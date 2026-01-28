/**
 * Top-level gameEvents export for backward compatibility
 * Maintains flat API structure (api.gameEvents.*) while code is organized in subdirectories
 */

export {
  getGameEvents,
  getRecentGameEvents,
  subscribeToGameEvents,
  getGameEventStats,
  recordEvent,
  recordGameStart,
  recordGameEnd,
} from "./gameplay/gameEvents";
