/**
 * Top-level marketplace export for backward compatibility
 * Maintains flat API structure (api.marketplace.*) while code is organized in subdirectories
 */

export {
  getMarketplaceListings,
  getUserListings,
  getAuctionBidHistory,
  createListing,
  cancelListing,
  buyNow,
  placeBid,
  claimAuctionWin,
  finalizeExpiredAuctions,
} from "./economy/marketplace";
