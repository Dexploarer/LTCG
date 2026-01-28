/**
 * Top-level economy export for backward compatibility
 * Maintains flat API structure (api.economy.*) while code is organized in subdirectories
 */

export {
  initializePlayerCurrency,
  adjustPlayerCurrency,
  getPlayerBalance,
  getTransactionHistory,
  redeemPromoCode,
} from "./economy/economy";
