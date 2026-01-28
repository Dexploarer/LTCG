/**
 * Top-level story export for backward compatibility
 * Maintains flat API structure (api.story.*) while code is organized in subdirectories
 */

export {
  getPlayerProgress,
  getChapterDetails,
  getAvailableChapters,
  getPlayerXPInfo,
  getPlayerBadges,
  getBattleHistory,
  startChapter,
  completeChapter,
  abandonChapter,
  initializeStoryProgress,
  awardBadge,
} from "./progression/story";
