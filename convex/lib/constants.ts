/**
 * Shared Constants for Convex
 *
 * Centralized configuration values used across feature modules.
 * Modify these values to adjust game economy and behavior.
 */

/**
 * Rarity distribution weights (out of 1000)
 * Used for pack opening and random card generation
 */
export const RARITY_WEIGHTS = {
  common: 650,     // 65%
  uncommon: 200,   // 20%
  rare: 100,       // 10%
  epic: 40,        // 4%
  legendary: 10,   // 1%
} as const;

/**
 * Marketplace Configuration
 */
export const MARKETPLACE = {
  /** Platform fee percentage (0.05 = 5%) */
  PLATFORM_FEE_PERCENT: 0.05,

  /** Minimum bid increment percentage (0.05 = 5%) */
  MIN_BID_INCREMENT_PERCENT: 0.05,

  /** Minimum listing price in gold */
  MIN_LISTING_PRICE: 10,

  /** Minimum auction duration in hours */
  MIN_AUCTION_DURATION: 1,

  /** Maximum auction duration in hours */
  MAX_AUCTION_DURATION: 168, // 7 days
} as const;

/**
 * Economy Configuration
 */
export const ECONOMY = {
  /** Starting gold for new players */
  WELCOME_BONUS_GOLD: 500,

  /** Starting gems for new players */
  WELCOME_BONUS_GEMS: 100,
} as const;

/**
 * Pagination Configuration
 */
export const PAGINATION = {
  /** Default page size for transaction history */
  TRANSACTION_PAGE_SIZE: 20,

  /** Default page size for marketplace listings */
  MARKETPLACE_PAGE_SIZE: 50,

  /** Default page size for pack opening history */
  PACK_HISTORY_PAGE_SIZE: 20,
} as const;

/**
 * Chat Configuration
 */
export const CHAT = {
  /** Rate limit: max messages per time window */
  RATE_LIMIT_MAX_MESSAGES: 5,

  /** Rate limit: time window in milliseconds */
  RATE_LIMIT_WINDOW_MS: 10000, // 10 seconds

  /** Presence timeout in milliseconds */
  PRESENCE_TIMEOUT_MS: 300000, // 5 minutes
} as const;
