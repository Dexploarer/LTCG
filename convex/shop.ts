/**
 * Top-level shop export for backward compatibility
 * Maintains flat API structure (api.shop.*) while code is organized in subdirectories
 */

export {
  getShopProducts,
  getPackOpeningHistory,
  purchasePack,
  purchaseBox,
  purchaseCurrencyBundle,
} from "./economy/shop";
