# Implementing OIDC proxy with Auth0

This document lists steps taken to implement FTW OIDC proxy using Auth0 as an OIDC identity provider.

Source materials: 
- https://techzone.vmware.com/blog/using-auth0-openid-connect-provider-workspace-one-access


# Set up Auth0
- Auth0 Admin Console > Applications >
  - decision: Single Page web applications vs Regular web application? need to test both, will start with regular since that's what's instructed in the linked tutorial


## Regular web application

- application login uri https://sari-cottagedays-flex.herokuapp.com/api/auth/auth0/callback
Follow the LinkedIn proxy steps from 9 onwards

http://www.passportjs.org/packages/passport-auth0/