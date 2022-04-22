const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const loginWithIdp = require('./loginWithIdp');
const { createIdToken } = require('../../api-util/idToken');

const radix = 10;
const PORT = parseInt(process.env.REACT_APP_DEV_API_SERVER_PORT, radix);
const rootUrl = process.env.REACT_APP_CANONICAL_ROOT_URL;
const clientID = process.env.REACT_APP_AUTH0_CLIENT_ID;
const clientSecret = process.env.AUTH0_CLIENT_SECRET;
const domain = process.env.AUTH0_DOMAIN;

// Identity provider and identity provider client information. They should
// match to an identity provider client "Client ID" and "IdP ID" in Console.
const idpClientId = process.env.AUTH_PROXY_CLIENT_ID;
const idpId = process.env.AUTH_PROXY_IDP_ID;

let callbackURL = null;

const useDevApiServer = process.env.NODE_ENV === 'development' && !!PORT;

if (useDevApiServer) {
  callbackURL = `http://localhost:${PORT}/api/auth/auth0/callback`;
} else {
  callbackURL = `${rootUrl}/api/auth/auth0/callback`;
}

const strategyOptions = {
  issuer: `https://${domain}/`,
  authorizationURL: `https://${domain}/authorize`,
  tokenURL: `https://${domain}/oauth/token`,
  domain,
  clientID,
  clientSecret,
  callbackURL,
  scope: ['openid profile email'],
  state: false,
  passReqToCallback: true
};

const verifyCallback = (req, accessToken, refreshToken, extraParams, profile, done) => {
  // We can can use util function to generate id token to match OIDC so that we can use
  // our custom id provider in Flex

  // Depening on where you get your Auth0 signups, you will need to determine first and last names for the user from the data
  const userNameElements = profile.nickname.split(".");

  const firstName = userNameElements[0];
  const lastName = userNameElements[userNameElements.length - 1];
  const email = profile.emails[0].value;

  const user = {
    userId: profile.id,
    firstName,
    lastName,
    email,
    emailVerified: profile._json.emailVerified,
  };

  // console.log('user: ', user, '\n issuer: ', issuer)
  let queryParams = {};
  if (req) {
    const state = req.query.state;
    queryParams = JSON.parse(state);
  }
  
  const { from, defaultReturn, defaultConfirm } = queryParams;

  // These keys are used for signing the ID token (JWT)
  // When you store them to environment variables you should replace
  // any line brakes with '\n'.
  // You should also make sure that the key size is big enough.
  const rsaPrivateKey = process.env.RSA_PRIVATE_KEY_AUTH.replace(/\\n/gm, '\n');
  const keyId = process.env.KEY_ID;

  createIdToken(idpClientId, user, { signingAlg: 'RS256', rsaPrivateKey, keyId })
    .then(idpToken => {
      console.log('idpToken: ', idpToken)
      const userData = {
        email,
        firstName,
        lastName,
        idpToken,
        from,
        defaultReturn,
        defaultConfirm,
      };
      done(null, userData);
    })
    .catch(e => console.error(e));
};

// ClientId is required when adding a new Auth0 strategy to passport
if (clientID) {
  passport.use(new Auth0Strategy(strategyOptions, verifyCallback));
}

exports.authenticateAuth0 = (req, res, next) => {
  const from = req.query.from ? req.query.from : null;
  const defaultReturn = req.query.defaultReturn ? req.query.defaultReturn : null;
  const defaultConfirm = req.query.defaultConfirm ? req.query.defaultConfirm : null;

  const params = {
    ...(!!from && { from }),
    ...(!!defaultReturn && { defaultReturn }),
    ...(!!defaultConfirm && { defaultConfirm }),
  };

  const paramsAsString = JSON.stringify(params);

  passport.authenticate('auth0', {
    state: paramsAsString,
  })(req, res, next);
};

// Use custom callback for calling loginWithIdp enpoint
// to log in the user to Flex with the data from Auth0
exports.authenticateAuth0Callback = (req, res, next) => {
  passport.authenticate('auth0', function(err, user) {
    loginWithIdp(err, user, req, res, idpClientId, idpId);
  })(req, res, next);
};