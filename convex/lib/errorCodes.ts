/**
 * Error Code System
 *
 * BEST PRACTICE: Use structured error codes instead of plain strings
 * Benefits:
 * - Easier to handle errors in frontend
 * - Better error tracking and monitoring
 * - Consistent error messages
 * - Internationalization support
 */

export const ErrorCode = {
  // Authentication Errors (1xxx)
  AUTH_REQUIRED: "AUTH_1001",
  AUTH_INVALID_TOKEN: "AUTH_1002",
  AUTH_SESSION_EXPIRED: "AUTH_1003",
  AUTH_INVALID_CREDENTIALS: "AUTH_1004",
  AUTH_USER_EXISTS: "AUTH_1005",
  AUTH_USERNAME_TAKEN: "AUTH_1006",

  // Authorization Errors (2xxx)
  AUTHZ_ADMIN_REQUIRED: "AUTHZ_2001",
  AUTHZ_INSUFFICIENT_PERMISSIONS: "AUTHZ_2002",
  AUTHZ_RESOURCE_FORBIDDEN: "AUTHZ_2003",

  // Rate Limiting Errors (3xxx)
  RATE_LIMIT_EXCEEDED: "RATE_3001",
  RATE_LIMIT_PACK_PURCHASE: "RATE_3002",
  RATE_LIMIT_FRIEND_REQUEST: "RATE_3003",
  RATE_LIMIT_CHAT_MESSAGE: "RATE_3004",

  // Resource Not Found Errors (4xxx)
  NOT_FOUND_USER: "NOT_FOUND_4001",
  NOT_FOUND_QUEST: "NOT_FOUND_4002",
  NOT_FOUND_ACHIEVEMENT: "NOT_FOUND_4003",
  NOT_FOUND_PRODUCT: "NOT_FOUND_4004",
  NOT_FOUND_LOBBY: "NOT_FOUND_4005",

  // Validation Errors (5xxx)
  VALIDATION_INVALID_INPUT: "VALIDATION_5001",
  VALIDATION_MISSING_FIELD: "VALIDATION_5002",
  VALIDATION_INVALID_FORMAT: "VALIDATION_5003",

  // Quest/Achievement Errors (5xxx - State Validation)
  QUEST_NOT_COMPLETED: "QUEST_5004",
  QUEST_ALREADY_CLAIMED: "QUEST_5005",
  ACHIEVEMENT_ALREADY_UNLOCKED: "ACHIEVEMENT_5006",

  // Chat/Message Errors (5xxx - Content Validation)
  CHAT_MESSAGE_TOO_LONG: "CHAT_5007",
  CHAT_MESSAGE_EMPTY: "CHAT_5008",

  // Economy Errors (6xxx)
  ECONOMY_INSUFFICIENT_GOLD: "ECONOMY_6001",
  ECONOMY_INSUFFICIENT_GEMS: "ECONOMY_6002",
  ECONOMY_INVALID_PRODUCT: "ECONOMY_6003",
  ECONOMY_PROMO_CODE_INVALID: "ECONOMY_6004",
  ECONOMY_PROMO_CODE_EXPIRED: "ECONOMY_6005",
  ECONOMY_PROMO_CODE_USED: "ECONOMY_6006",

  // Social Errors (7xxx)
  SOCIAL_ALREADY_FRIENDS: "SOCIAL_7001",
  SOCIAL_REQUEST_PENDING: "SOCIAL_7002",
  SOCIAL_USER_BLOCKED: "SOCIAL_7003",
  SOCIAL_CANNOT_SELF_FRIEND: "SOCIAL_7004",

  // Game Errors (8xxx)
  GAME_LOBBY_FULL: "GAME_8001",
  GAME_ALREADY_IN_GAME: "GAME_8002",
  GAME_INVALID_MOVE: "GAME_8003",
  GAME_NOT_YOUR_TURN: "GAME_8004",

  // Matchmaking Errors (8xxx - Game Related)
  MATCHMAKING_ALREADY_IN_QUEUE: "MATCHMAKING_8005",
  MATCHMAKING_NOT_IN_QUEUE: "MATCHMAKING_8006",
  MATCHMAKING_PLAYER_LEFT_QUEUE: "MATCHMAKING_8007",

  // System Errors (9xxx)
  SYSTEM_INTERNAL_ERROR: "SYSTEM_9001",
  SYSTEM_DATABASE_ERROR: "SYSTEM_9002",
  SYSTEM_TRANSACTION_FAILED: "SYSTEM_9003",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Error messages mapped to error codes
 * These can be overridden per-locale for internationalization
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Authentication
  AUTH_1001: "Authentication required",
  AUTH_1002: "Invalid authentication token",
  AUTH_1003: "Session expired. Please sign in again",
  AUTH_1004: "Invalid email or password",
  AUTH_1005: "User with this email already exists",
  AUTH_1006: "Username is already taken",

  // Authorization
  AUTHZ_2001: "Admin access required",
  AUTHZ_2002: "You don't have permission to perform this action",
  AUTHZ_2003: "Access to this resource is forbidden",

  // Rate Limiting
  RATE_3001: "Rate limit exceeded. Please try again later",
  RATE_3002: "Too many pack purchases. Please wait before purchasing again",
  RATE_3003: "Too many friend requests. Please wait before sending more",
  RATE_3004: "Too many chat messages. Please slow down",

  // Not Found
  NOT_FOUND_4001: "User not found",
  NOT_FOUND_4002: "Quest not found",
  NOT_FOUND_4003: "Achievement not found",
  NOT_FOUND_4004: "Product not found or unavailable",
  NOT_FOUND_4005: "Game lobby not found",

  // Validation
  VALIDATION_5001: "Invalid input provided",
  VALIDATION_5002: "Required field is missing",
  VALIDATION_5003: "Invalid format",

  // Quest/Achievement
  QUEST_5004: "Quest is not completed yet",
  QUEST_5005: "Quest rewards have already been claimed",
  ACHIEVEMENT_5006: "Achievement has already been unlocked",

  // Chat/Message
  CHAT_5007: "Chat message is too long",
  CHAT_5008: "Chat message cannot be empty",

  // Economy
  ECONOMY_6001: "Insufficient gold",
  ECONOMY_6002: "Insufficient gems",
  ECONOMY_6003: "Invalid product configuration",
  ECONOMY_6004: "Invalid promo code",
  ECONOMY_6005: "This promo code has expired",
  ECONOMY_6006: "You have already redeemed this promo code",

  // Social
  SOCIAL_7001: "You are already friends with this user",
  SOCIAL_7002: "Friend request already sent",
  SOCIAL_7003: "Cannot send friend request to this user",
  SOCIAL_7004: "You cannot send a friend request to yourself",

  // Game
  GAME_8001: "Game lobby is full",
  GAME_8002: "You are already in an active game",
  GAME_8003: "Invalid move",
  GAME_8004: "It is not your turn",

  // Matchmaking
  MATCHMAKING_8005: "You are already in the matchmaking queue",
  MATCHMAKING_8006: "You are not in the matchmaking queue",
  MATCHMAKING_8007: "One or more players left the matchmaking queue",

  // System
  SYSTEM_9001: "An internal error occurred. Please try again",
  SYSTEM_9002: "Database error occurred",
  SYSTEM_9003: "Transaction failed. Please try again",
};

/**
 * Create a structured error with code and message
 *
 * @param code - Error code from ErrorCode enum
 * @param details - Optional additional details
 * @returns Error with structured message
 *
 * @example
 * throw createError(ErrorCode.ECONOMY_INSUFFICIENT_GOLD, { required: 100, available: 50 });
 */
export function createError(code: ErrorCode, details?: Record<string, unknown>): Error {
  const message = ErrorMessages[code];
  const error = new Error(message) as Error & { code: ErrorCode; details?: Record<string, unknown> };
  error.code = code;
  if (details) {
    error.details = details;
  }
  return error;
}

/**
 * Type guard to check if error has a code
 */
export function hasErrorCode(error: unknown): error is Error & { code: ErrorCode } {
  return error instanceof Error && "code" in error && typeof error.code === "string";
}
