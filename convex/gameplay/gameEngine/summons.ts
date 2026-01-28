/**
 * Game Engine - Summons Module
 *
 * Handles monster summoning mechanics:
 * - Normal Summon / Tribute Summon
 * - Set Monster
 * - Flip Summon
 */

import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../../lib/convexAuth";
import { moveCard } from "../../lib/gameHelpers";
import { parseAbility, executeEffect } from "../effectSystem";
import { recordEventHelper } from "../gameEvents";
import {
  validateNormalSummon,
  validateSetMonster,
  validateFlipSummon,
} from "../summonValidator";

/**
 * Normal Summon a monster
 *
 * Summons a monster from hand to the field in face-up Attack or Defense Position.
 * Counts as the 1 Normal Summon per turn.
 * Records: normal_summon or tribute_summon (if tributes used)
 * Also records: tribute_paid, card_to_graveyard (if tributes)
 */
export const normalSummon = mutation({
  args: {
    lobbyId: v.id("gameLobbies"),
    cardId: v.id("cardDefinitions"),
    tributeCardIds: v.optional(v.array(v.id("cardDefinitions"))),
    position: v.union(v.literal("attack"), v.literal("defense")),
  },
  handler: async (ctx, args) => {
    // 1. Validate session
    const user = await requireAuthMutation(ctx);

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

    // 5. Validate summon
    const validation = await validateNormalSummon(
      ctx,
      gameState,
      user.userId,
      args.cardId,
      args.tributeCardIds
    );

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const isHost = user.userId === gameState.hostId;
    const hand = isHost ? gameState.hostHand : gameState.opponentHand;
    const board = isHost ? gameState.hostBoard : gameState.opponentBoard;

    // 6. Get card details
    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    // 7. Process tributes (if any)
    const tributeCount = args.tributeCardIds?.length || 0;
    if (tributeCount > 0 && args.tributeCardIds) {
      // Record tribute_paid event
      await recordEventHelper(ctx, {
        lobbyId: args.lobbyId,
        gameId: lobby.gameId!,
        turnNumber: lobby.turnNumber!,
        eventType: "tribute_paid",
        playerId: user.userId,
        playerUsername: user.username,
        description: `${user.username} tributed ${tributeCount} monster(s)`,
        metadata: {
          tributeCards: args.tributeCardIds,
          forCard: args.cardId,
        },
      });

      // Move tributed monsters to graveyard
      for (const tributeId of args.tributeCardIds) {
        await moveCard(
          ctx,
          gameState,
          tributeId,
          "board",
          "graveyard",
          user.userId,
          lobby.turnNumber
        );

        // Remove from board
        const updatedBoard = board.filter((bc) => bc.cardId !== tributeId);
        await ctx.db.patch(gameState._id, {
          [isHost ? "hostBoard" : "opponentBoard"]: updatedBoard,
        });
      }
    }

    // 8. Remove card from hand
    const newHand = hand.filter((c) => c !== args.cardId);

    // 9. Add card to board (face-up normal summon)
    const positionValue = args.position === "attack" ? 1 : -1; // 1 = ATK, -1 = DEF

    // Parse ability for protection flags
    let protectionFlags = {};
    if (card.ability) {
      const parsedEffect = parseAbility(card.ability);
      if (parsedEffect?.protection) {
        protectionFlags = {
          cannotBeDestroyedByBattle: parsedEffect.protection.cannotBeDestroyedByBattle,
          cannotBeDestroyedByEffects: parsedEffect.protection.cannotBeDestroyedByEffects,
          cannotBeTargeted: parsedEffect.protection.cannotBeTargeted,
        };
      }
    }

    const newBoardCard = {
      cardId: args.cardId,
      position: positionValue,
      attack: card.attack || 0,
      defense: card.defense || 0,
      hasAttacked: false,
      isFaceDown: false, // Normal summon is face-up
      ...protectionFlags,
    };

    const newBoard = [...board, newBoardCard];

    // 10. Mark player as having normal summoned this turn
    await ctx.db.patch(gameState._id, {
      [isHost ? "hostHand" : "opponentHand"]: newHand,
      [isHost ? "hostBoard" : "opponentBoard"]: newBoard,
      [isHost
        ? "hostNormalSummonedThisTurn"
        : "opponentNormalSummonedThisTurn"]: true,
    });

    // 11. Record summon event
    const eventType = tributeCount > 0 ? "tribute_summon" : "normal_summon";
    await recordEventHelper(ctx, {
      lobbyId: args.lobbyId,
      gameId: lobby.gameId!,
      turnNumber: lobby.turnNumber!,
      eventType,
      playerId: user.userId,
      playerUsername: user.username,
      description: `${user.username} ${tributeCount > 0 ? "Tribute" : "Normal"} Summoned ${card.name} in ${args.position} position`,
      metadata: {
        cardId: args.cardId,
        cardName: card.name,
        position: args.position,
        tributeCount,
        attack: card.attack,
        defense: card.defense,
      },
    });

    // 12. Check for "When summoned" trigger effects
    let triggerEffectResult = { success: true, message: "No trigger" };

    if (card.ability) {
      const parsedEffect = parseAbility(card.ability);

      // Only execute if this is an "on_summon" trigger
      if (parsedEffect && parsedEffect.trigger === "on_summon") {
        const refreshedState = await ctx.db
          .query("gameStates")
          .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
          .first();

        if (refreshedState) {
          triggerEffectResult = await executeEffect(
            ctx,
            refreshedState,
            args.lobbyId,
            parsedEffect,
            user.userId,
            args.cardId,
            [] // No targets for auto-trigger effects for now
          );

          if (triggerEffectResult.success) {
            // Record trigger activation
            await recordEventHelper(ctx, {
              lobbyId: args.lobbyId,
              gameId: lobby.gameId!,
              turnNumber: lobby.turnNumber!,
              eventType: "effect_activated",
              playerId: user.userId,
              playerUsername: user.username,
              description: `${card.name} effect: ${triggerEffectResult.message}`,
              metadata: { cardId: args.cardId, trigger: "on_summon" },
            });
          }
        }
      }
    }

    // 13. Return success
    return {
      success: true,
      cardSummoned: card.name,
      position: args.position,
      tributesUsed: tributeCount,
      triggerEffect: triggerEffectResult.message,
    };
  },
});

/**
 * Set a monster face-down
 *
 * Places a monster from hand face-down in Defense Position.
 * Counts as the 1 Normal Summon per turn.
 * Records: monster_set
 */
export const setMonster = mutation({
  args: {
    lobbyId: v.id("gameLobbies"),
    cardId: v.id("cardDefinitions"),
    tributeCardIds: v.optional(v.array(v.id("cardDefinitions"))),
  },
  handler: async (ctx, args) => {
    // 1. Validate session
    const user = await requireAuthMutation(ctx);

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

    // 5. Validate set (uses same validation as normal summon)
    const validation = await validateSetMonster(
      ctx,
      gameState,
      user.userId,
      args.cardId,
      args.tributeCardIds
    );

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const isHost = user.userId === gameState.hostId;
    const hand = isHost ? gameState.hostHand : gameState.opponentHand;
    const board = isHost ? gameState.hostBoard : gameState.opponentBoard;

    // 6. Get card details
    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    // 7. Process tributes (if any)
    const tributeCount = args.tributeCardIds?.length || 0;
    if (tributeCount > 0 && args.tributeCardIds) {
      await recordEventHelper(ctx, {
        lobbyId: args.lobbyId,
        gameId: lobby.gameId!,
        turnNumber: lobby.turnNumber!,
        eventType: "tribute_paid",
        playerId: user.userId,
        playerUsername: user.username,
        description: `${user.username} tributed ${tributeCount} monster(s)`,
        metadata: {
          tributeCards: args.tributeCardIds,
          forCard: args.cardId,
        },
      });

      for (const tributeId of args.tributeCardIds) {
        await moveCard(
          ctx,
          gameState,
          tributeId,
          "board",
          "graveyard",
          user.userId,
          lobby.turnNumber
        );

        const updatedBoard = board.filter((bc) => bc.cardId !== tributeId);
        await ctx.db.patch(gameState._id, {
          [isHost ? "hostBoard" : "opponentBoard"]: updatedBoard,
        });
      }
    }

    // 8. Remove card from hand
    const newHand = hand.filter((c) => c !== args.cardId);

    // 9. Add card to board (face-down defense position)
    const newBoardCard = {
      cardId: args.cardId,
      position: -1, // -1 = Defense
      attack: card.attack || 0,
      defense: card.defense || 0,
      hasAttacked: false,
      isFaceDown: true, // Set monsters are face-down
    };

    const newBoard = [...board, newBoardCard];

    // 10. Mark player as having normal summoned/set this turn
    await ctx.db.patch(gameState._id, {
      [isHost ? "hostHand" : "opponentHand"]: newHand,
      [isHost ? "hostBoard" : "opponentBoard"]: newBoard,
      [isHost
        ? "hostNormalSummonedThisTurn"
        : "opponentNormalSummonedThisTurn"]: true,
    });

    // 11. Record monster_set event
    await recordEventHelper(ctx, {
      lobbyId: args.lobbyId,
      gameId: lobby.gameId!,
      turnNumber: lobby.turnNumber!,
      eventType: "monster_set",
      playerId: user.userId,
      playerUsername: user.username,
      description: `${user.username} Set a monster face-down`,
      metadata: {
        cardId: args.cardId,
        // Don't reveal card name for face-down cards
        tributeCount,
      },
    });

    // 12. Return success
    return {
      success: true,
      cardSet: "face-down",
      tributesUsed: tributeCount,
    };
  },
});

/**
 * Flip Summon a face-down monster
 *
 * Flips a face-down monster to face-up Attack or Defense Position.
 * Does NOT count as the Normal Summon.
 * Records: flip_summon
 */
export const flipSummon = mutation({
  args: {
    lobbyId: v.id("gameLobbies"),
    cardId: v.id("cardDefinitions"),
    newPosition: v.union(v.literal("attack"), v.literal("defense")),
  },
  handler: async (ctx, args) => {
    // 1. Validate session
    const user = await requireAuthMutation(ctx);

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

    // 5. Validate flip summon
    const validation = await validateFlipSummon(ctx, gameState, user.userId, args.cardId);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const isHost = user.userId === gameState.hostId;
    const board = isHost ? gameState.hostBoard : gameState.opponentBoard;

    // 6. Find card on board and flip it
    const cardIndex = board.findIndex((bc) => bc.cardId === args.cardId);
    if (cardIndex === -1) {
      throw new Error("Card not found on board");
    }

    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    // 7. Update card to face-up
    const positionValue = args.newPosition === "attack" ? 1 : -1; // 1 = ATK, -1 = DEF
    const newBoard = [...board];
    newBoard[cardIndex] = {
      ...newBoard[cardIndex]!,
      position: positionValue,
      isFaceDown: false, // Flip to face-up
    };

    await ctx.db.patch(gameState._id, {
      [isHost ? "hostBoard" : "opponentBoard"]: newBoard,
    });

    // 8. Record flip_summon event
    await recordEventHelper(ctx, {
      lobbyId: args.lobbyId,
      gameId: lobby.gameId!,
      turnNumber: lobby.turnNumber!,
      eventType: "flip_summon",
      playerId: user.userId,
      playerUsername: user.username,
      description: `${user.username} Flip Summoned ${card.name} in ${args.newPosition} position`,
      metadata: {
        cardId: args.cardId,
        cardName: card.name,
        position: args.newPosition,
        attack: card.attack,
        defense: card.defense,
      },
    });

    // 9. Trigger FLIP effect if exists
    let flipEffectResult = { success: true, message: "No FLIP effect" };

    if (card.ability) {
      const parsedEffect = parseAbility(card.ability);

      // Only execute if this is an "on_flip" trigger
      if (parsedEffect && parsedEffect.trigger === "on_flip") {
        const refreshedState = await ctx.db
          .query("gameStates")
          .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
          .first();

        if (refreshedState) {
          flipEffectResult = await executeEffect(
            ctx,
            refreshedState,
            args.lobbyId,
            parsedEffect,
            user.userId,
            args.cardId,
            [] // No targets for auto-trigger effects for now
          );

          if (flipEffectResult.success) {
            // Record FLIP effect activation
            await recordEventHelper(ctx, {
              lobbyId: args.lobbyId,
              gameId: lobby.gameId!,
              turnNumber: lobby.turnNumber!,
              eventType: "effect_activated",
              playerId: user.userId,
              playerUsername: user.username,
              description: `FLIP: ${card.name} effect: ${flipEffectResult.message}`,
              metadata: { cardId: args.cardId, trigger: "on_flip" },
            });
          }
        }
      }
    }

    // 10. Return success
    return {
      success: true,
      cardFlipped: card.name,
      position: args.newPosition,
      flipEffect: flipEffectResult.message,
    };
  },
});
