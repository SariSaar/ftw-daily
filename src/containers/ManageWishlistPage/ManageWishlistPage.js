import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { isScrollingDisabled } from '../../ducks/UI.duck';
import {
  ListingCard,
  Page,
  PaginationLinks,
  UserNav,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
} from '../../components';
import { TopbarContainer } from '..';

import { getWishlistListingsById } from './ManageWishlistPage.duck';
import css from './ManageWishlistPage.module.css';

export class ManageWishlistPageComponent extends Component {
  constructor(props) {
    super(props);

    this.state = { listingMenuOpen: null };
    this.onToggleMenu = this.onToggleMenu.bind(this);
  }

  onToggleMenu(listing) {
    this.setState({ listingMenuOpen: listing });
  }

  render() {
    const {
      closingListingError,
      listings,
      openingListingError,
      pagination,
      queryInProgress,
      queryListingsError,
      queryParams,
      scrollingDisabled,
      intl,
    } = this.props;

    const hasPaginationInfo = !!pagination && pagination.totalItems != null;
    const listingsAreLoaded = !queryInProgress && hasPaginationInfo;

    const loadingResults = (
      <h2>
        <FormattedMessage id="ManageWishlistPage.loadingOwnListings" />
      </h2>
    );

    const queryError = (
      <h2 className={css.error}>
        <FormattedMessage id="ManageWishlistPage.queryError" />
      </h2>
    );

    const noResults =
      listingsAreLoaded && pagination.totalItems === 0 ? (
        <h1 className={css.title}>
          <FormattedMessage id="ManageWishlistPage.noResults" />
        </h1>
      ) : null;

    const heading =
      listingsAreLoaded && pagination.totalItems > 0 ? (
        <h1 className={css.title}>
          <FormattedMessage
            id="ManageWishlistPage.youHaveListings"
            values={{ count: pagination.totalItems }}
          />
        </h1>
      ) : (
        noResults
      );

    const page = queryParams ? queryParams.page : 1;
    const paginationLinks =
      listingsAreLoaded && pagination && pagination.totalPages > 1 ? (
        <PaginationLinks
          className={css.pagination}
          pageName="ManageWishlistPage"
          pageSearchParams={{ page }}
          pagination={pagination}
        />
      ) : null;

    const listingMenuOpen = this.state.listingMenuOpen;
    const closingErrorListingId = !!closingListingError && closingListingError.listingId;
    const openingErrorListingId = !!openingListingError && openingListingError.listingId;

    const title = intl.formatMessage({ id: 'ManageWishlistPage.title' });

    const panelWidth = 62.5;
    // Render hints for responsive image
    const renderSizes = [
      `(max-width: 767px) 100vw`,
      `(max-width: 1920px) ${panelWidth / 2}vw`,
      `${panelWidth / 3}vw`,
    ].join(', ');

    return (
      <Page title={title} scrollingDisabled={scrollingDisabled}>
        <LayoutSingleColumn>
          <LayoutWrapperTopbar>
            <TopbarContainer currentPage="ManageWishlistPage" />
            <UserNav selectedPageName="ManageWishlistPage" />
          </LayoutWrapperTopbar>
          <LayoutWrapperMain>
            {queryInProgress ? loadingResults : null}
            {queryListingsError ? queryError : null}
            <div className={css.listingPanel}>
              {heading}
              <div className={css.listingCards}>
                {listings.map(l => (
                  <ListingCard
                    className={css.listingCard}
                    key={l.id.uuid}
                    listing={l}
                  />
                ))}
              </div>
              {paginationLinks}
            </div>
          </LayoutWrapperMain>
          <LayoutWrapperFooter>
            <Footer />
          </LayoutWrapperFooter>
        </LayoutSingleColumn>
      </Page>
    );
  }
}

ManageWishlistPageComponent.defaultProps = {
  listings: [],
  pagination: null,
  queryListingsError: null,
  queryParams: null,
  closingListing: null,
  closingListingError: null,
  openingListing: null,
  openingListingError: null,
};

const { arrayOf, bool, func, object, shape, string } = PropTypes;

ManageWishlistPageComponent.propTypes = {
  listings: arrayOf(propTypes.listing),
  pagination: propTypes.pagination,
  queryInProgress: bool.isRequired,
  queryListingsError: propTypes.error,
  queryParams: object,
  scrollingDisabled: bool.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const {
    currentPageResultIds,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
    openingListing,
    openingListingError,
    closingListing,
    closingListingError,
  } = state.ManageWishlistPage;
  const listings = getWishlistListingsById(state, currentPageResultIds);
  return {
    currentPageResultIds,
    listings,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
    scrollingDisabled: isScrollingDisabled(state),
    openingListing,
    openingListingError,
    closingListing,
    closingListingError,
  };
};

const mapDispatchToProps = dispatch => ({
  // onCloseListing: listingId => dispatch(closeListing(listingId)),
  // onOpenListing: listingId => dispatch(openListing(listingId)),
});

const ManageWishlistPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  injectIntl
)(ManageWishlistPageComponent);

export default ManageWishlistPage;
