import { updatedEntities, denormalisedEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { parse } from '../../util/urlHelpers';

// Pagination page size might need to be dynamic on responsive page layouts
// Current design has max 3 columns 42 is divisible by 2 and 3
// So, there's enough cards to fill all columns on full pagination pages
const RESULT_PAGE_SIZE = 42;

// ================ Action types ================ //

export const FETCH_LISTINGS_REQUEST = 'app/ManageWishlistPage/FETCH_LISTINGS_REQUEST';
export const FETCH_LISTINGS_SUCCESS = 'app/ManageWishlistPage/FETCH_LISTINGS_SUCCESS';
export const FETCH_LISTINGS_ERROR = 'app/ManageWishlistPage/FETCH_LISTINGS_ERROR';

export const OPEN_LISTING_REQUEST = 'app/ManageWishlistPage/OPEN_LISTING_REQUEST';
export const OPEN_LISTING_SUCCESS = 'app/ManageWishlistPage/OPEN_LISTING_SUCCESS';
export const OPEN_LISTING_ERROR = 'app/ManageWishlistPage/OPEN_LISTING_ERROR';

export const CLOSE_LISTING_REQUEST = 'app/ManageWishlistPage/CLOSE_LISTING_REQUEST';
export const CLOSE_LISTING_SUCCESS = 'app/ManageWishlistPage/CLOSE_LISTING_SUCCESS';
export const CLOSE_LISTING_ERROR = 'app/ManageWishlistPage/CLOSE_LISTING_ERROR';

export const ADD_OWN_ENTITIES = 'app/ManageWishlistPage/ADD_OWN_ENTITIES';

// ================ Reducer ================ //

const initialState = {
  pagination: null,
  queryParams: null,
  queryInProgress: false,
  queryListingsError: null,
  currentPageResultIds: [],
  wishlistEntities: {},
  openingListing: null,
  openingListingError: null,
  closingListing: null,
  closingListingError: null,
};

const resultIds = data => data.data.map(l => l.id);

const merge = (state, sdkResponse) => {
  const apiResponse = sdkResponse.data;
  return {
    ...state,
    wishlistEntities: updatedEntities({ ...state.wishlistEntities }, apiResponse),
  };
};


const manageWishlistPageReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case FETCH_LISTINGS_REQUEST:
      return {
        ...state,
        queryParams: payload.queryParams,
        queryInProgress: true,
        queryListingsError: null,
        currentPageResultIds: [],
      };
    case FETCH_LISTINGS_SUCCESS:
      return {
        ...state,
        currentPageResultIds: resultIds(payload.data),
        pagination: payload.data.meta,
        queryInProgress: false,
      };
    case FETCH_LISTINGS_ERROR:
      // eslint-disable-next-line no-console
      console.error(payload);
      return { ...state, queryInProgress: false, queryListingsError: payload };

    case ADD_OWN_ENTITIES:
      return merge(state, payload);

    default:
      return state;
  }
};

export default manageWishlistPageReducer;

// ================ Selectors ================ //

/**
 * Get the denormalised own listing entities with the given IDs
 *
 * @param {Object} state the full Redux store
 * @param {Array<UUID>} listingIds listing IDs to select from the store
 */
export const getWishlistListingsById = (state, listingIds) => {
  const { wishlistEntities } = state.ManageWishlistPage;
  const resources = listingIds.map(id => ({
    id,
    type: 'listing',
  }));
  const throwIfNotFound = false;
  return denormalisedEntities(wishlistEntities, resources, throwIfNotFound);
};

// ================ Action creators ================ //

// This works the same way as addMarketplaceEntities,
// but we don't want to mix own listings with searched listings
// (own listings data contains different info - e.g. exact location etc.)
export const addOwnEntities = sdkResponse => ({
  type: ADD_OWN_ENTITIES,
  payload: sdkResponse,
});

export const queryListingsRequest = queryParams => ({
  type: FETCH_LISTINGS_REQUEST,
  payload: { queryParams },
});

export const queryListingsSuccess = response => ({
  type: FETCH_LISTINGS_SUCCESS,
  payload: { data: response.data },
});

export const queryListingsError = e => ({
  type: FETCH_LISTINGS_ERROR,
  error: true,
  payload: e,
});

// Throwing error for new (loadData may need that info)
export const queryWishlistListings = queryParams => (dispatch, getState, sdk) => {
  dispatch(queryListingsRequest(queryParams));

  return sdk.currentUser.show()
    .then(resp => {
      const wishlist = resp.data.data.attributes.profile.privateData?.wishlist;
      
      const { perPage, ...rest } = queryParams;
      const params = { pub_id: wishlist, ...rest, per_page: perPage };

      return sdk.listings
          .query(params)
          .then(response => {
            dispatch(addOwnEntities(response));
            dispatch(queryListingsSuccess(response));
            return response;
          })
          .catch(e => {
            dispatch(queryListingsError(storableError(e)));
            throw e;
          });
      })
};

export const loadData = (params, search) => {
  const queryParams = parse(search);
  const page = queryParams.page || 1;
  return queryWishlistListings({
    ...queryParams,
    page,
    perPage: RESULT_PAGE_SIZE,
    include: ['author', 'images'],
    'fields.image': ['variants.landscape-crop', 'variants.landscape-crop2x'],
    'limit.images': 1,
  });
};
