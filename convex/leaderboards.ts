/**
 * Top-level leaderboards export for backward compatibility
 * Maintains flat API structure (api.leaderboards.*) while code is organized in subdirectories
 */

export {
  getLeaderboard,
  getCachedLeaderboard,
  getUserRank,
  refreshAllSnapshots,
} from "./social/leaderboards";
