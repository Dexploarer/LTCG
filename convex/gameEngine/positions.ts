/**
 * Game Engine - Positions Module
 *
 * Handles monster position changes:
 * - Change Position (Attack ↔ Defense)
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { api } from "../_generated/api";
import { getUserFromToken } from "../lib/auth";
import { validatePositionChange } from "../summonValidator";

/**
 * Change monster position (Attack ↔ Defense)
 *
 * Switches a face-up monster between Attack and Defense Position.
 * Can only be done once per monster per turn.
 * Cannot be done in Battle Phase.
 * Records: position_changed
 */
export const changePosition = mutation({
  args: {
    token: v.string(),
    lobbyId: v.id("gameLobbies"),
    cardId: v.id("cardDefinitions"),
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

    // 5. Validate position change
    const validation = await validatePositionChange(ctx, gameState, user.userId, args.cardId);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const isHost = user.userId === gameState.hostId;
    const board = isHost ? gameState.hostBoard : gameState.opponentBoard;

    // 6. Find card on board and toggle position
    const cardIndex = board.findIndex((bc) => bc.cardId === args.cardId);
    if (cardIndex === -1) {
      throw new Error("Card not found on board");
    }

    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    const boardCard = board[cardIndex]!;
    const currentPosition = boardCard.position;
    const newPosition = currentPosition === 1 ? -1 : 1; // Toggle: 1 (ATK) ↔ -1 (DEF)
    const newPositionName = newPosition === 1 ? "attack" : "defense";
    const oldPositionName = currentPosition === 1 ? "attack" : "defense";

    // 7. Update position (maintain face-up status)
    const newBoard = [...board];
    newBoard[cardIndex] = {
      ...boardCard,
      position: newPosition,
    };

    await ctx.db.patch(gameState._id, {
      [isHost ? "hostBoard" : "opponentBoard"]: newBoard,
    });

    // 8. Record position_changed event
    await ctx.runMutation(api.gameEvents.recordEvent, {
      lobbyId: args.lobbyId,
      gameId: lobby.gameId!,
      turnNumber: lobby.turnNumber!,
      eventType: "position_changed",
      playerId: user.userId,
      playerUsername: user.username,
      description: `${user.username} changed ${card.name} to ${newPositionName} position`,
      metadata: {
        cardId: args.cardId,
        cardName: card.name,
        previousPosition: oldPositionName,
        newPosition: newPositionName,
      },
    });

    // 9. Return success
    return {
      success: true,
      cardName: card.name,
      newPosition: newPositionName,
    };
  },
});
