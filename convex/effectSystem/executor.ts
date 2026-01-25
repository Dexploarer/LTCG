/**
 * Effect System Executor
 *
 * Main dispatcher that routes parsed effects to their specific executor implementations.
 * Handles OPT (Once Per Turn) restrictions and targeting protection checks.
 */

import type { MutationCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";
import { hasUsedOPT, markOPTUsed } from "../lib/gameHelpers";
import type { ParsedEffect, ParsedAbility } from "./types";

// Import all effect executors
import { executeDraw } from "./executors/draw";
import { executeDestroy } from "./executors/destroy";
import { executeDamage } from "./executors/damage";
import { executeGainLP } from "./executors/gainLP";
import { executeModifyATK } from "./executors/modifyATK";
import { executeSpecialSummon } from "./executors/summon";
import { executeToHand } from "./executors/toHand";
import { executeSearch } from "./executors/search";
import { executeNegate } from "./executors/negate";
import { executeBanish } from "./executors/banish";
import { executeSendToGraveyard } from "./executors/toGraveyard";

/**
 * Execute a parsed effect
 */
export async function executeEffect(
  ctx: MutationCtx,
  gameState: Doc<"gameStates">,
  lobbyId: Id<"gameLobbies">,
  effect: ParsedEffect,
  playerId: Id<"users">,
  cardId: Id<"cardDefinitions">,
  targets?: Id<"cardDefinitions">[]
): Promise<{ success: boolean; message: string }> {

  // Check OPT restriction
  if (effect.isOPT && hasUsedOPT(gameState, cardId)) {
    return { success: false, message: "This card's effect can only be used once per turn" };
  }

  const isHost = playerId === gameState.hostId;
  const opponentId = isHost ? gameState.opponentId : gameState.hostId;

  // Check targeting protection for effects that target cards
  if (targets && targets.length > 0) {
    // Check both boards for targeted cards
    const hostBoard = gameState.hostBoard;
    const opponentBoard = gameState.opponentBoard;

    for (const targetId of targets) {
      const targetCard = [...hostBoard, ...opponentBoard].find(bc => bc.cardId === targetId);
      if (targetCard?.cannotBeTargeted) {
        const card = await ctx.db.get(targetId);
        return {
          success: false,
          message: `${card?.name || "Card"} cannot be targeted`
        };
      }
    }
  }

  // Execute the effect and capture result
  let result: { success: boolean; message: string };

  switch (effect.type) {
    case "draw":
      result = await executeDraw(ctx, gameState, playerId, effect.value || 1);
      break;

    case "destroy":
      if (!targets || targets.length === 0) {
        result = { success: false, message: "No targets selected" };
      } else if (effect.targetCount && effect.targetCount > 1) {
        // Multi-target destroy (e.g., "Destroy 2 target monsters")
        const destroyResults: string[] = [];
        let allSucceeded = true;

        for (let i = 0; i < Math.min(effect.targetCount, targets.length); i++) {
          const target = targets[i];
          if (!target) continue;

          const destroyResult = await executeDestroy(ctx, gameState, lobbyId, target, playerId);
          destroyResults.push(destroyResult.message);
          if (!destroyResult.success) {
            allSucceeded = false;
          }
        }

        result = {
          success: allSucceeded,
          message: destroyResults.join("; ")
        };
      } else {
        // Single target destroy
        const target = targets[0];
        if (!target) {
          result = { success: false, message: "No target selected" };
        } else {
          result = await executeDestroy(ctx, gameState, lobbyId, target, playerId);
        }
      }
      break;

    case "damage":
      result = await executeDamage(ctx, gameState, lobbyId, opponentId, effect.value || 0);
      break;

    case "gainLP":
      result = await executeGainLP(ctx, gameState, lobbyId, playerId, effect.value || 0);
      break;

    case "modifyATK":
      if (!targets || targets.length === 0) {
        result = { success: false, message: "No targets selected" };
      } else {
        const target = targets[0];
        if (!target) {
          result = { success: false, message: "No target selected" };
        } else {
          result = await executeModifyATK(ctx, gameState, target, effect.value || 0, isHost);
        }
      }
      break;

    case "summon":
      if (!targets || targets.length === 0) {
        result = { success: false, message: "No targets selected" };
      } else {
        const target = targets[0];
        if (!target) {
          result = { success: false, message: "No target selected" };
        } else {
          result = await executeSpecialSummon(ctx, gameState, target, playerId, effect.targetLocation || "hand");
        }
      }
      break;

    case "toHand":
      if (!targets || targets.length === 0) {
        result = { success: false, message: "No targets selected" };
      } else {
        const target = targets[0];
        if (!target) {
          result = { success: false, message: "No target selected" };
        } else {
          result = await executeToHand(ctx, gameState, lobbyId, target, playerId, effect.targetLocation || "graveyard");
        }
      }
      break;

    case "search":
      // Search deck for cards matching criteria
      // Note: In a real implementation, this would require a two-step process:
      // 1. Call executeSearch without selectedCardId to get matching cards
      // 2. Present choices to player
      // 3. Call executeSearch again with selectedCardId to add to hand
      // For now, we'll return the matching cards for UI selection
      result = await executeSearch(ctx, gameState, playerId, effect, targets?.[0]);
      break;

    case "negate":
      if (!targets || targets.length === 0) {
        result = { success: false, message: "No targets selected for negation" };
      } else {
        const target = targets[0];
        if (!target) {
          result = { success: false, message: "No target selected" };
        } else {
          result = await executeNegate(ctx, gameState, target, effect);
        }
      }
      break;

    case "toGraveyard":
      if (!targets || targets.length === 0) {
        result = { success: false, message: "No targets selected" };
      } else {
        const target = targets[0];
        if (!target) {
          result = { success: false, message: "No target selected" };
        } else {
          // Filter targetLocation to valid source locations for sending to GY
          const validLocation = (effect.targetLocation === "board" ||
                                  effect.targetLocation === "hand" ||
                                  effect.targetLocation === "deck")
            ? effect.targetLocation
            : "board";

          result = await executeSendToGraveyard(
            ctx,
            gameState,
            lobbyId,
            target,
            playerId,
            validLocation
          );
        }
      }
      break;

    case "banish":
      if (!targets || targets.length === 0) {
        result = { success: false, message: "No targets selected" };
      } else {
        const target = targets[0];
        if (!target) {
          result = { success: false, message: "No target selected" };
        } else {
          result = await executeBanish(
            ctx,
            gameState,
            target,
            playerId,
            effect.targetLocation || "board"
          );
        }
      }
      break;

    default:
      result = { success: false, message: `Unknown effect type: ${effect.type}` };
  }

  // Mark card as having used OPT effect if successful
  if (result.success && effect.isOPT) {
    await markOPTUsed(ctx, gameState, cardId);
  }

  return result;
}

/**
 * Execute all effects from a multi-part ability
 *
 * For cards with multiple effects (protection + continuous + triggered):
 * - Protection effects are passive (just flags)
 * - Continuous effects are calculated dynamically
 * - Triggered effects execute based on trigger condition
 *
 * Returns combined results from all executed effects
 */
export async function executeMultiPartAbility(
  ctx: MutationCtx,
  gameState: Doc<"gameStates">,
  lobbyId: Id<"gameLobbies">,
  parsedAbility: ParsedAbility,
  playerId: Id<"users">,
  cardId: Id<"cardDefinitions">,
  targets?: Id<"cardDefinitions">[]
): Promise<{ success: boolean; messages: string[]; effectsExecuted: number }> {
  const messages: string[] = [];
  let effectsExecuted = 0;
  let anySuccess = false;

  for (const effect of parsedAbility.effects) {
    // Skip protection-only effects (these are passive flags, not executed)
    if (effect.type === "modifyATK" && effect.value === 0 && effect.protection) {
      continue;
    }

    // Skip continuous effects (these are calculated dynamically, not executed)
    if (effect.continuous && effect.type === "modifyATK") {
      continue;
    }

    // Execute triggered or manual effects
    const result = await executeEffect(ctx, gameState, lobbyId, effect, playerId, cardId, targets);
    if (result.success) {
      anySuccess = true;
      effectsExecuted++;
    }
    messages.push(result.message);
  }

  return {
    success: anySuccess,
    messages,
    effectsExecuted,
  };
}
