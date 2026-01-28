/**
 * Top-level matchmaking export for backward compatibility
 * Maintains flat API structure (api.matchmaking.*) while code is organized in subdirectories
 */

export {
  getMyStatus,
  getQueueStats,
  joinQueue,
  leaveQueue,
  findMatches,
  getQueueEntries,
  createMatchedGame,
  cleanupExpiredEntries,
} from "./social/matchmaking";
