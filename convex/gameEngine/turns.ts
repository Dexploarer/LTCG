/**
 * Game Engine - Turns Module
 *
 * Handles turn management:
 * - End Turn
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { api } from "../_generated/api";
import { getUserFromToken } from "../lib/auth";
import { enforceHandLimit, clearTemporaryModifiers, clearOPTTracking } from "../lib/gameHelpers";

/**
 * End Turn
 *
 * Ends the current player's turn and starts the next turn.
 * Must be in End Phase to call this.
 *
 * Records: turn_end, hand_limit_enforced, turn_start, phase_changed
 */
export const endTurn = mutation({
  args: {
    token: v.string(),
    lobbyId: v.id("gameLobbies"),
  },
  handler: async (ctx, args) => {
    // 1. Validate session
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Invalid session token");
    }

    // 2. Get lobby
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) {
      throw new Error("Lobby not found");
    }

    // 3. Validate it's the current player's turn
    if (lobby.currentTurnPlayerId !== user.userId) {
      throw new Error("Not your turn");
    }

    // 4. Get game state
    const gameState = await ctx.db
      .query("gameStates")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .first();

    if (!gameState) {
      throw new Error("Game state not found");
    }

    // 5. Validate in End Phase
    if (gameState.currentPhase !== "end") {
      throw new Error("Must be in End Phase to end turn");
    }

    const isHost = user.userId === gameState.hostId;

    // 6. Trigger end-of-turn effects (future implementation)

    // 7. Enforce hand size limit (6 cards max)
    await enforceHandLimit(ctx, gameState, user.userId, lobby.turnNumber);

    // 7.5. Clear temporary modifiers (ATK/DEF bonuses "until end of turn")
    await clearTemporaryModifiers(ctx, gameState, "end");

    // 7.6. Clear OPT (Once Per Turn) tracking
    await clearOPTTracking(ctx, gameState);

    // 8. Clear "this turn" flags
    const playerBoard = isHost ? gameState.hostBoard : gameState.opponentBoard;
    const opponentBoard = isHost ? gameState.opponentBoard : gameState.hostBoard;

    // Reset hasAttacked for all monsters
    const resetPlayerBoard = playerBoard.map((card) => ({
      ...card,
      hasAttacked: false,
    }));

    const resetOpponentBoard = opponentBoard.map((card) => ({
      ...card,
      hasAttacked: false,
    }));

    // 9. Record turn_end event
    await ctx.runMutation(api.gameEvents.recordEvent, {
      lobbyId: args.lobbyId,
      gameId: lobby.gameId!,
      turnNumber: lobby.turnNumber!,
      eventType: "turn_end",
      playerId: user.userId,
      playerUsername: user.username,
      description: `${user.username}'s turn ended`,
      metadata: {
        turnNumber: lobby.turnNumber!,
      },
    });

    // 10. Switch to next player
    const nextPlayerId = isHost ? gameState.opponentId : gameState.hostId;
    const nextTurnNumber = lobby.turnNumber! + 1;

    await ctx.db.patch(args.lobbyId, {
      currentTurnPlayerId: nextPlayerId,
      turnNumber: nextTurnNumber,
    });

    // 11. Reset normal summon flags
    await ctx.db.patch(gameState._id, {
      [isHost ? "hostBoard" : "opponentBoard"]: resetPlayerBoard,
      [isHost ? "opponentBoard" : "hostBoard"]: resetOpponentBoard,
      hostNormalSummonedThisTurn: false,
      opponentNormalSummonedThisTurn: false,
      currentPhase: "draw",
    });

    // 12. Record turn_start event for new turn
    const nextPlayer = await ctx.db.get(nextPlayerId);
    await ctx.runMutation(api.gameEvents.recordEvent, {
      lobbyId: args.lobbyId,
      gameId: lobby.gameId!,
      turnNumber: nextTurnNumber,
      eventType: "turn_start",
      playerId: nextPlayerId,
      playerUsername: nextPlayer?.username || "Unknown",
      description: `${nextPlayer?.username || "Unknown"}'s turn ${nextTurnNumber}`,
      metadata: {
        turnNumber: nextTurnNumber,
      },
    });

    // 13. Record phase_changed event (to Draw Phase)
    await ctx.runMutation(api.gameEvents.recordEvent, {
      lobbyId: args.lobbyId,
      gameId: lobby.gameId!,
      turnNumber: nextTurnNumber,
      eventType: "phase_changed",
      playerId: nextPlayerId,
      playerUsername: nextPlayer?.username || "Unknown",
      description: `${nextPlayer?.username || "Unknown"} entered Draw Phase`,
      metadata: {
        previousPhase: "end",
        newPhase: "draw",
      },
    });

    // 14. Auto-execute Draw Phase (skip on turn 1 for first player)
    const shouldSkipDraw = nextTurnNumber === 1 && nextPlayerId === lobby.hostId;
    if (!shouldSkipDraw) {
      // Note: drawCards is called via phaseManager.initializeTurnPhase
      // For now, we'll leave this to be handled by phase manager
    }

    // 15. Return success
    return {
      success: true,
      newTurnPlayer: nextPlayer?.username || "Unknown",
      newTurnNumber: nextTurnNumber,
    };
  },
});
