/**
 * Top-level decks export for backward compatibility
 * Maintains flat API structure (api.decks.*) while code is organized in subdirectories
 */

export {
  getUserDecks,
  getDeckWithCards,
  getDeckStats,
  validateDeck,
  createDeck,
  saveDeck,
  renameDeck,
  deleteDeck,
  duplicateDeck,
  setActiveDeck,
  selectStarterDeck,
} from "./core/decks";
