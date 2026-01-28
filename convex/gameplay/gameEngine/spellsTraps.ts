/**
 * Game Engine - Spells & Traps Module
 *
 * Handles Spell/Trap card mechanics:
 * - Set Spell/Trap
 * - Activate Spell
 * - Activate Trap
 */

import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../../lib/convexAuth";
import { parseAbility, executeEffect } from "../effectSystem";
import { recordEventHelper } from "../gameEvents";

/**
 * Set Spell/Trap face-down
 *
 * Places a Spell or Trap card from hand face-down in the Spell/Trap Zone.
 * Records: spell_set or trap_set
 */
export const setSpellTrap = mutation({
  args: {
    lobbyId: v.id("gameLobbies"),
    cardId: v.id("cardDefinitions"),
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

    const isHost = user.userId === gameState.hostId;
    const hand = isHost ? gameState.hostHand : gameState.opponentHand;
    const spellTrapZone = isHost ? gameState.hostSpellTrapZone : gameState.opponentSpellTrapZone;

    // 5. Validate card is in hand
    if (!hand.includes(args.cardId)) {
      throw new Error("Card is not in your hand");
    }

    // 6. Get card details
    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    if (card.cardType !== "spell" && card.cardType !== "trap") {
      throw new Error("Card must be a spell or trap card");
    }

    // 7. Validate Spell/Trap Zone space (max 5)
    if (spellTrapZone.length >= 5) {
      throw new Error("Spell/Trap Zone is full (max 5 cards)");
    }

    // 8. Remove card from hand and add to spell/trap zone
    const newHand = hand.filter((c) => c !== args.cardId);
    const newSpellTrapZone = [...spellTrapZone, {
      cardId: args.cardId,
      isFaceDown: true,
      isActivated: false
    }];

    await ctx.db.patch(gameState._id, {
      [isHost ? "hostHand" : "opponentHand"]: newHand,
      [isHost ? "hostSpellTrapZone" : "opponentSpellTrapZone"]: newSpellTrapZone,
    });

    // 9. Record event
    const eventType = card.cardType === "spell" ? "spell_set" : "trap_set";
    await recordEventHelper(ctx, {
      lobbyId: args.lobbyId,
      gameId: lobby.gameId!,
      turnNumber: lobby.turnNumber!,
      eventType,
      playerId: user.userId,
      playerUsername: user.username,
      description: `${user.username} Set a ${card.cardType} card`,
      metadata: {
        cardId: args.cardId,
        // Don't reveal card name for face-down cards
      },
    });

    // 10. Return success
    return {
      success: true,
      cardType: card.cardType,
    };
  },
});

/**
 * Activate Spell card
 *
 * Activates a Spell card from hand or field.
 * For MVP, immediately resolves (no chain system yet).
 * Records: spell_activated
 */
export const activateSpell = mutation({
  args: {
    lobbyId: v.id("gameLobbies"),
    cardId: v.id("cardDefinitions"),
    targets: v.optional(v.array(v.id("cardDefinitions"))),
  },
  handler: async (ctx, args) => {
    // 1. Validate session
    const user = await requireAuthMutation(ctx);

    // 2. Get lobby
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) {
      throw new Error("Lobby not found");
    }

    // 3. Validate it's the current player's turn (or valid activation timing)
    // Note: Quick-Play spells can be activated on opponent's turn
    // For MVP, we'll only allow activation on your own turn

    // 4. Get game state
    const gameState = await ctx.db
      .query("gameStates")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .first();

    if (!gameState) {
      throw new Error("Game state not found");
    }

    const isHost = user.userId === gameState.hostId;
    const hand = isHost ? gameState.hostHand : gameState.opponentHand;
    const spellTrapZone = isHost ? gameState.hostSpellTrapZone : gameState.opponentSpellTrapZone;

    // 5. Validate card is in hand or set on field
    const inHand = hand.includes(args.cardId);
    const inSpellTrapZone = spellTrapZone.some(st => st.cardId === args.cardId);

    if (!inHand && !inSpellTrapZone) {
      throw new Error("Card is not in your hand or spell/trap zone");
    }

    // 6. Get card details
    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    if (card.cardType !== "spell") {
      throw new Error("Card is not a spell card");
    }

    // 7. Validate phase (Main Phases only for Normal Spells)
    const currentPhase = gameState.currentPhase;
    if (currentPhase !== "main1" && currentPhase !== "main2") {
      throw new Error("Can only activate Normal Spells during Main Phase");
    }

    // 8. Remove card from hand or spell/trap zone
    if (inHand) {
      const newHand = hand.filter((c) => c !== args.cardId);
      await ctx.db.patch(gameState._id, {
        [isHost ? "hostHand" : "opponentHand"]: newHand,
      });
    } else {
      // Remove from spell/trap zone
      const newSpellTrapZone = spellTrapZone.filter(st => st.cardId !== args.cardId);
      await ctx.db.patch(gameState._id, {
        [isHost ? "hostSpellTrapZone" : "opponentSpellTrapZone"]: newSpellTrapZone,
      });
    }

    // 9. Record spell_activated event
    await recordEventHelper(ctx, {
      lobbyId: args.lobbyId,
      gameId: lobby.gameId!,
      turnNumber: lobby.turnNumber!,
      eventType: "spell_activated",
      playerId: user.userId,
      playerUsername: user.username,
      description: `${user.username} activated ${card.name}`,
      metadata: {
        cardId: args.cardId,
        cardName: card.name,
        targets: args.targets,
      },
    });

    // 10. Parse and execute effect
    let effectResult = { success: true, message: "No effect" };

    if (card.ability) {
      const parsedEffect = parseAbility(card.ability);

      if (parsedEffect) {
        // Refresh game state (may have changed during event recording)
        const refreshedState = await ctx.db
          .query("gameStates")
          .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
          .first();

        if (refreshedState) {
          effectResult = await executeEffect(
            ctx,
            refreshedState,
            args.lobbyId,
            parsedEffect,
            user.userId,
            args.cardId,
            args.targets
          );

          if (!effectResult.success) {
            // Effect failed - still consume the card
            console.warn(`Effect failed: ${effectResult.message}`);
          }
        }
      } else {
        console.warn(`Could not parse ability: ${card.ability}`);
      }
    }

    // 11. Move to graveyard
    const updatedState = await ctx.db
      .query("gameStates")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .first();

    if (updatedState) {
      const graveyard = isHost ? updatedState.hostGraveyard : updatedState.opponentGraveyard;
      await ctx.db.patch(updatedState._id, {
        [isHost ? "hostGraveyard" : "opponentGraveyard"]: [...graveyard, args.cardId],
      });
    }

    // 12. Return success with effect result
    return {
      success: true,
      spellName: card.name,
      effectApplied: effectResult.success,
      effectMessage: effectResult.message,
    };
  },
});

/**
 * Activate Trap card
 *
 * Activates a face-down Trap card from field.
 * For MVP, immediately resolves (no chain system yet).
 * Records: trap_activated
 */
export const activateTrap = mutation({
  args: {
    lobbyId: v.id("gameLobbies"),
    cardId: v.id("cardDefinitions"),
    targets: v.optional(v.array(v.id("cardDefinitions"))),
  },
  handler: async (ctx, args) => {
    // 1. Validate session
    const user = await requireAuthMutation(ctx);

    // 2. Get lobby
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) {
      throw new Error("Lobby not found");
    }

    // 3. Get game state
    const gameState = await ctx.db
      .query("gameStates")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .first();

    if (!gameState) {
      throw new Error("Game state not found");
    }

    const isHost = user.userId === gameState.hostId;
    const spellTrapZone = isHost ? gameState.hostSpellTrapZone : gameState.opponentSpellTrapZone;

    // 4. Validate trap is set on field
    const trapInZone = spellTrapZone.find(st => st.cardId === args.cardId);
    if (!trapInZone) {
      throw new Error("Trap card is not set on your field");
    }

    if (!trapInZone.isFaceDown) {
      throw new Error("Trap is already face-up");
    }

    // 5. Get card details
    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card not found");
    }

    if (card.cardType !== "trap") {
      throw new Error("Card is not a trap card");
    }

    // 6. Validate trap was set for at least 1 turn
    // TODO: Track when cards were set, validate turn count
    // For now, we'll skip this validation

    // 7. Remove from spell/trap zone
    const newSpellTrapZone = spellTrapZone.filter(st => st.cardId !== args.cardId);
    await ctx.db.patch(gameState._id, {
      [isHost ? "hostSpellTrapZone" : "opponentSpellTrapZone"]: newSpellTrapZone,
    });

    // 8. Record trap_activated event
    await recordEventHelper(ctx, {
      lobbyId: args.lobbyId,
      gameId: lobby.gameId!,
      turnNumber: lobby.turnNumber!,
      eventType: "trap_activated",
      playerId: user.userId,
      playerUsername: user.username,
      description: `${user.username} activated ${card.name}`,
      metadata: {
        cardId: args.cardId,
        cardName: card.name,
        targets: args.targets,
      },
    });

    // 9. Parse and execute effect
    let effectResult = { success: true, message: "No effect" };

    if (card.ability) {
      const parsedEffect = parseAbility(card.ability);

      if (parsedEffect) {
        // Refresh game state (may have changed during event recording)
        const refreshedState = await ctx.db
          .query("gameStates")
          .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
          .first();

        if (refreshedState) {
          effectResult = await executeEffect(
            ctx,
            refreshedState,
            args.lobbyId,
            parsedEffect,
            user.userId,
            args.cardId,
            args.targets
          );

          if (!effectResult.success) {
            console.warn(`Effect failed: ${effectResult.message}`);
          }
        }
      } else {
        console.warn(`Could not parse ability: ${card.ability}`);
      }
    }

    // 10. Move to graveyard
    const updatedState = await ctx.db
      .query("gameStates")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .first();

    if (updatedState) {
      const graveyard = isHost ? updatedState.hostGraveyard : updatedState.opponentGraveyard;
      await ctx.db.patch(updatedState._id, {
        [isHost ? "hostGraveyard" : "opponentGraveyard"]: [...graveyard, args.cardId],
      });
    }

    // 11. Return success with effect result
    return {
      success: true,
      trapName: card.name,
      effectApplied: effectResult.success,
      effectMessage: effectResult.message,
    };
  },
});
