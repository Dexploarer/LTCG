import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query, internalAction } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { validateSession } from "./lib/validators";

// ============================================================================
// CONSTANTS
// ============================================================================

const RATING_DEFAULTS = {
  DEFAULT_RATING: 1000,
  RANKED_RATING_WINDOW: 200,
} as const;

const RANK_THRESHOLDS = {
  Bronze: 0,
  Silver: 1200,
  Gold: 1400,
  Platinum: 1600,
  Diamond: 1800,
  Master: 2000,
  Legend: 2200,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate rank tier from rating
 */
function getRank(rating: number): string {
  if (rating >= RANK_THRESHOLDS.Legend) return "Legend";
  if (rating >= RANK_THRESHOLDS.Master) return "Master";
  if (rating >= RANK_THRESHOLDS.Diamond) return "Diamond";
  if (rating >= RANK_THRESHOLDS.Platinum) return "Platinum";
  if (rating >= RANK_THRESHOLDS.Gold) return "Gold";
  if (rating >= RANK_THRESHOLDS.Silver) return "Silver";
  return "Bronze";
}

/**
 * Generate random 6-character alphanumeric join code
 * Excludes ambiguous characters: O, 0, I, 1, l
 */
function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Update user presence status
 */
async function updatePresenceInternal(
  ctx: MutationCtx,
  userId: Id<"users">,
  username: string,
  status: "online" | "in_game" | "idle"
): Promise<void> {
  const existing = await ctx.db
    .query("userPresence")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, {
      status,
      lastActiveAt: Date.now(),
    });
  } else {
    await ctx.db.insert("userPresence", {
      userId,
      username,
      status,
      lastActiveAt: Date.now(),
    });
  }
}

/**
 * Validate user can create or join a game
 * Checks: session, active deck, deck validity, not already in game, no existing lobby
 */
async function validateUserCanCreateGame(
  ctx: QueryCtx | MutationCtx,
  token: string
): Promise<{
  userId: Id<"users">;
  username: string;
  deckId: Id<"userDecks">;
  deckArchetype: string;
}> {
  // Validate session
  const { userId, username } = await validateSession(ctx, token);

  // Check user has active deck set
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.activeDeckId) {
    throw new Error("You must select an active deck in your Binder before creating a game");
  }

  // Get active deck
  const deck = await ctx.db.get(user.activeDeckId);
  if (!deck || deck.userId !== userId || !deck.isActive) {
    throw new Error("Your active deck is no longer valid. Please select a new deck in your Binder");
  }

  // Validate deck has exactly 30 cards
  const deckCards = await ctx.db
    .query("deckCards")
    .withIndex("by_deck", (q) => q.eq("deckId", user.activeDeckId!))
    .collect();

  const totalCards = deckCards.reduce((sum, dc) => sum + dc.quantity, 0);
  if (totalCards !== 30) {
    throw new Error(`Your active deck must have exactly 30 cards. Currently has ${totalCards}.`);
  }

  // Check user presence status
  const presence = await ctx.db
    .query("userPresence")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (presence?.status === "in_game") {
    throw new Error("You are already in a game");
  }

  // Check user doesn't already have an active lobby
  const existingLobby = await ctx.db
    .query("gameLobbies")
    .withIndex("by_host", (q) => q.eq("hostId", userId))
    .filter((q) =>
      q.or(q.eq(q.field("status"), "waiting"), q.eq(q.field("status"), "active"))
    )
    .first();

  if (existingLobby) {
    throw new Error("You already have an active lobby");
  }

  // Get deck archetype
  const deckArchetype = deck.deckArchetype || "neutral";

  return {
    userId,
    username,
    deckId: user.activeDeckId,
    deckArchetype,
  };
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List waiting lobbies (public lobbies only)
 */
export const listWaitingLobbies = query({
  args: {
    mode: v.optional(v.union(v.literal("casual"), v.literal("ranked"), v.literal("all"))),
    userRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const mode = args.mode || "all";
    const userRating = args.userRating || RATING_DEFAULTS.DEFAULT_RATING;

    // Query waiting lobbies
    let lobbiesQuery = ctx.db.query("gameLobbies");

    // Use index for filtering by mode and status
    if (mode === "all") {
      lobbiesQuery = lobbiesQuery
        .withIndex("by_status", (q) => q.eq("status", "waiting"));
    } else {
      lobbiesQuery = lobbiesQuery
        .withIndex("by_mode_status", (q) => q.eq("mode", mode).eq("status", "waiting"));
    }

    const allLobbies = await lobbiesQuery.collect();

    // Filter out private lobbies
    let publicLobbies = allLobbies.filter((lobby) => !lobby.isPrivate);

    // For ranked mode, filter by rating window
    if (mode === "ranked" || mode === "all") {
      publicLobbies = publicLobbies.filter((lobby) => {
        if (lobby.mode !== "ranked") return true;
        const ratingDiff = Math.abs(lobby.hostRating - userRating);
        return ratingDiff <= RATING_DEFAULTS.RANKED_RATING_WINDOW;
      });
    }

    // Sort by newest first
    publicLobbies.sort((a, b) => b.createdAt - a.createdAt);

    // Limit to 50 results
    publicLobbies = publicLobbies.slice(0, 50);

    // Return without joinCode (security)
    return publicLobbies.map((lobby) => ({
      id: lobby._id,
      hostUsername: lobby.hostUsername,
      hostRank: lobby.hostRank,
      hostRating: lobby.hostRating,
      deckArchetype: lobby.deckArchetype,
      mode: lobby.mode,
      createdAt: lobby.createdAt,
      isPrivate: lobby.isPrivate,
    }));
  },
});

/**
 * Get user's active lobby (as host)
 */
export const getActiveLobby = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);

    // Find user's lobby where they are the host
    const lobby = await ctx.db
      .query("gameLobbies")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .filter((q) =>
        q.or(q.eq(q.field("status"), "waiting"), q.eq(q.field("status"), "active"))
      )
      .first();

    return lobby;
  },
});

/**
 * Get detailed lobby information
 */
export const getLobbyDetails = query({
  args: {
    token: v.string(),
    lobbyId: v.id("gameLobbies"),
  },
  handler: async (ctx, args) => {
    await validateSession(ctx, args.token);

    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) {
      throw new Error("Lobby not found");
    }

    if (lobby.status === "cancelled") {
      throw new Error("This lobby has been cancelled");
    }

    return lobby;
  },
});

/**
 * Get user's private lobby (to show join code)
 */
export const getMyPrivateLobby = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);

    const lobby = await ctx.db
      .query("gameLobbies")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isPrivate"), true),
          q.eq(q.field("status"), "waiting")
        )
      )
      .first();

    if (!lobby) {
      return null;
    }

    return {
      lobbyId: lobby._id,
      joinCode: lobby.joinCode,
      mode: lobby.mode,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new game lobby
 */
export const createLobby = mutation({
  args: {
    token: v.string(),
    mode: v.union(v.literal("casual"), v.literal("ranked")),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const isPrivate = args.isPrivate || false;

    // Validate user can create game
    const { userId, username, deckArchetype } = await validateUserCanCreateGame(ctx, args.token);

    // Generate join code for private matches
    const joinCode = isPrivate ? generateJoinCode() : undefined;

    // Calculate rank
    const rating = RATING_DEFAULTS.DEFAULT_RATING;
    const rank = getRank(rating);

    // Set max rating diff for ranked matches
    const maxRatingDiff = args.mode === "ranked" ? RATING_DEFAULTS.RANKED_RATING_WINDOW : undefined;

    // Create lobby
    const lobbyId = await ctx.db.insert("gameLobbies", {
      hostId: userId,
      hostUsername: username,
      hostRank: rank,
      hostRating: rating,
      deckArchetype,
      mode: args.mode,
      status: "waiting",
      isPrivate,
      joinCode,
      maxRatingDiff,
      createdAt: Date.now(),
    });

    // Update user presence to in_game
    await updatePresenceInternal(ctx, userId, username, "in_game");

    return {
      lobbyId,
      joinCode,
    };
  },
});

/**
 * Join an existing lobby
 */
export const joinLobby = mutation({
  args: {
    token: v.string(),
    lobbyId: v.id("gameLobbies"),
    joinCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate user can join game
    const { userId, username, deckArchetype } = await validateUserCanCreateGame(ctx, args.token);

    // Get lobby
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) {
      throw new Error("Lobby not found or no longer available");
    }

    // Check lobby is waiting
    if (lobby.status !== "waiting") {
      throw new Error("Lobby is not accepting players");
    }

    // Check user is not the host
    if (lobby.hostId === userId) {
      throw new Error("You cannot join your own lobby");
    }

    // Check lobby doesn't already have opponent (race condition)
    if (lobby.opponentId) {
      throw new Error("This lobby is no longer available");
    }

    // Validate join code for private lobbies
    if (lobby.isPrivate) {
      if (!args.joinCode) {
        throw new Error("Join code required for private match");
      }
      if (args.joinCode.toUpperCase() !== lobby.joinCode) {
        throw new Error("Invalid join code for private match");
      }
    }

    // Validate rating for ranked matches
    if (lobby.mode === "ranked" && lobby.maxRatingDiff) {
      const opponentRating = RATING_DEFAULTS.DEFAULT_RATING;
      const ratingDiff = Math.abs(lobby.hostRating - opponentRating);
      if (ratingDiff > lobby.maxRatingDiff) {
        throw new Error("Your rating is too far from the host's rating for ranked match");
      }
    }

    // Calculate opponent rank
    const opponentRating = RATING_DEFAULTS.DEFAULT_RATING;
    const opponentRank = getRank(opponentRating);

    // Generate game ID
    const gameId = crypto.randomUUID();

    // Randomly decide who goes first
    const goesFirst = Math.random() < 0.5 ? lobby.hostId : userId;
    const now = Date.now();

    // Update lobby with opponent info and start game
    await ctx.db.patch(args.lobbyId, {
      opponentId: userId,
      opponentUsername: username,
      opponentRank,
      status: "active",
      startedAt: now,
      gameId,
      currentTurnPlayerId: goesFirst,
      turnStartedAt: now,
      lastMoveAt: now,
      turnNumber: 1,
    });

    // Update both players' presence to in_game
    await updatePresenceInternal(ctx, userId, username, "in_game");
    await updatePresenceInternal(ctx, lobby.hostId, lobby.hostUsername, "in_game");

    return {
      gameId,
      lobbyId: args.lobbyId,
      opponentUsername: lobby.hostUsername,
    };
  },
});

/**
 * Join a lobby using a join code
 */
export const joinLobbyByCode = mutation({
  args: {
    token: v.string(),
    joinCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Normalize join code
    const normalizedCode = args.joinCode.trim().toUpperCase();

    // Find lobby by join code
    const lobby = await ctx.db
      .query("gameLobbies")
      .withIndex("by_join_code", (q) => q.eq("joinCode", normalizedCode))
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .first();

    if (!lobby) {
      throw new Error("Invalid or expired join code");
    }

    // Use joinLobby logic
    // Re-validate and join
    const { userId, username, deckArchetype } = await validateUserCanCreateGame(ctx, args.token);

    // Check user is not the host
    if (lobby.hostId === userId) {
      throw new Error("You cannot join your own lobby");
    }

    // Check lobby doesn't already have opponent
    if (lobby.opponentId) {
      throw new Error("This lobby is no longer available");
    }

    // Calculate opponent rank
    const opponentRating = RATING_DEFAULTS.DEFAULT_RATING;
    const opponentRank = getRank(opponentRating);

    // Generate game ID
    const gameId = crypto.randomUUID();

    // Randomly decide who goes first
    const goesFirst = Math.random() < 0.5 ? lobby.hostId : userId;
    const now = Date.now();

    // Update lobby
    await ctx.db.patch(lobby._id, {
      opponentId: userId,
      opponentUsername: username,
      opponentRank,
      status: "active",
      startedAt: now,
      gameId,
      currentTurnPlayerId: goesFirst,
      turnStartedAt: now,
      lastMoveAt: now,
      turnNumber: 1,
    });

    // Update both players' presence
    await updatePresenceInternal(ctx, userId, username, "in_game");
    await updatePresenceInternal(ctx, lobby.hostId, lobby.hostUsername, "in_game");

    return {
      gameId,
      lobbyId: lobby._id,
      opponentUsername: lobby.hostUsername,
    };
  },
});

/**
 * Cancel user's waiting lobby
 */
export const cancelLobby = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { userId, username } = await validateSession(ctx, args.token);

    // Find user's waiting lobby
    const lobby = await ctx.db
      .query("gameLobbies")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .first();

    if (!lobby) {
      throw new Error("No active lobby to cancel");
    }

    // Update lobby status
    await ctx.db.patch(lobby._id, {
      status: "cancelled",
    });

    // Update host presence to online
    await updatePresenceInternal(ctx, userId, username, "online");

    return { success: true };
  },
});

/**
 * Leave a lobby (as host or opponent)
 */
export const leaveLobby = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { userId, username } = await validateSession(ctx, args.token);

    // Find user's lobby (as host or opponent)
    const lobbies = await ctx.db
      .query("gameLobbies")
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("hostId"), userId),
            q.eq(q.field("opponentId"), userId)
          ),
          q.or(
            q.eq(q.field("status"), "waiting"),
            q.eq(q.field("status"), "active")
          )
        )
      )
      .collect();

    const lobby = lobbies[0];
    if (!lobby) {
      throw new Error("No active lobby to leave");
    }

    // Cannot leave active game
    if (lobby.status === "active") {
      throw new Error("Cannot leave an active game (game in progress)");
    }

    // If user is host
    if (lobby.hostId === userId) {
      await ctx.db.patch(lobby._id, {
        status: "cancelled",
      });
    } else if (lobby.opponentId === userId) {
      // If user is opponent, remove them from lobby
      await ctx.db.patch(lobby._id, {
        opponentId: undefined,
        opponentUsername: undefined,
        opponentRank: undefined,
      });
    }

    // Update user presence to online
    await updatePresenceInternal(ctx, userId, username, "online");

    return { success: true };
  },
});

/**
 * Update turn (internal mutation, called by game engine when player makes a move)
 */
export const updateTurn = internalMutation({
  args: {
    lobbyId: v.id("gameLobbies"),
    newTurnPlayerId: v.id("users"),
    turnNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) {
      throw new Error("Lobby not found");
    }

    if (lobby.status !== "active") {
      throw new Error("Game is not active");
    }

    const now = Date.now();

    // Update lobby with new turn info
    await ctx.db.patch(args.lobbyId, {
      currentTurnPlayerId: args.newTurnPlayerId,
      turnStartedAt: now,
      lastMoveAt: now,
      turnNumber: args.turnNumber,
    });
  },
});

/**
 * Forfeit a game due to timeout or manual forfeit
 */
export const forfeitGame = internalMutation({
  args: {
    lobbyId: v.id("gameLobbies"),
    forfeitingPlayerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) {
      throw new Error("Lobby not found");
    }

    if (lobby.status !== "active") {
      throw new Error("Game is not active");
    }

    // Determine winner (the player who didn't forfeit)
    const winnerId =
      args.forfeitingPlayerId === lobby.hostId ? lobby.opponentId : lobby.hostId;

    if (!winnerId) {
      throw new Error("Cannot determine winner");
    }

    // Update lobby
    await ctx.db.patch(args.lobbyId, {
      status: "forfeited",
      winnerId,
    });

    // Update both players' presence to online
    await updatePresenceInternal(ctx, lobby.hostId, lobby.hostUsername, "online");

    if (lobby.opponentId && lobby.opponentUsername) {
      await updatePresenceInternal(ctx, lobby.opponentId, lobby.opponentUsername, "online");
    }

    // TODO: Update player ratings based on winner
    // TODO: Record match history with forfeit flag
  },
});

/**
 * Complete a game (internal mutation, called by game engine)
 */
export const completeGame = internalMutation({
  args: {
    lobbyId: v.id("gameLobbies"),
    winnerId: v.id("users"),
    finalTurnNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) {
      throw new Error("Lobby not found");
    }

    // Update lobby
    await ctx.db.patch(args.lobbyId, {
      status: "completed",
      turnNumber: args.finalTurnNumber,
      winnerId: args.winnerId,
    });

    // Update both players' presence to online
    const hostUser = await ctx.db.get(lobby.hostId);
    if (hostUser) {
      await updatePresenceInternal(ctx, lobby.hostId, lobby.hostUsername, "online");
    }

    if (lobby.opponentId) {
      const opponentUser = await ctx.db.get(lobby.opponentId);
      if (opponentUser && lobby.opponentUsername) {
        await updatePresenceInternal(ctx, lobby.opponentId, lobby.opponentUsername, "online");
      }
    }

    // TODO: Update player ratings based on winner
    // TODO: Record match history
  },
});

// ============================================================================
// SCHEDULED CLEANUP
// ============================================================================

/**
 * Cleanup stale game lobbies
 * Runs every minute to check for games where players haven't made a move in > 2 minutes
 */
export const cleanupStaleGames = internalAction({
  handler: async (ctx) => {
    const now = Date.now();
    const TIMEOUT_MS = 120000; // 2 minutes (120 seconds)

    // Get all active games
    const activeLobbies = await ctx.runQuery(internal.games.getActiveLobbiesForCleanup);

    for (const lobby of activeLobbies) {
      // Check if last move was more than 2 minutes ago
      if (lobby.lastMoveAt && now - lobby.lastMoveAt > TIMEOUT_MS) {
        // Forfeit the game for the player whose turn it is
        if (lobby.currentTurnPlayerId) {
          await ctx.runMutation(internal.games.forfeitGame, {
            lobbyId: lobby._id,
            forfeitingPlayerId: lobby.currentTurnPlayerId,
          });
        }
      }
    }

    // Also cleanup waiting lobbies that have been waiting for too long (30 minutes)
    const WAITING_TIMEOUT_MS = 1800000; // 30 minutes
    const waitingLobbies = await ctx.runQuery(internal.games.getWaitingLobbiesForCleanup);

    for (const lobby of waitingLobbies) {
      if (now - lobby.createdAt > WAITING_TIMEOUT_MS) {
        await ctx.runMutation(internal.games.cancelStaleWaitingLobby, {
          lobbyId: lobby._id,
        });
      }
    }
  },
});

/**
 * Get active lobbies for cleanup (internal query)
 */
export const getActiveLobbiesForCleanup = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("gameLobbies")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

/**
 * Get waiting lobbies for cleanup (internal query)
 */
export const getWaitingLobbiesForCleanup = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("gameLobbies")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .collect();
  },
});

/**
 * Cancel stale waiting lobby (internal mutation)
 */
export const cancelStaleWaitingLobby = internalMutation({
  args: { lobbyId: v.id("gameLobbies") },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) return;

    // Update lobby to cancelled
    await ctx.db.patch(args.lobbyId, {
      status: "cancelled",
    });

    // Update host presence
    await updatePresenceInternal(ctx, lobby.hostId, lobby.hostUsername, "online");
  },
});
