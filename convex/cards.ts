/**
 * Top-level cards export for backward compatibility
 * Maintains flat API structure (api.cards.*) while code is organized in subdirectories
 */

export {
  getAllCardDefinitions,
  getCardDefinition,
  getUserCards,
  getUserFavoriteCards,
  getUserCollectionStats,
  toggleFavorite,
  addCardsToInventory,
  giveStarterCollection,
  createCardDefinition,
} from "./core/cards";
