/**
 * Effect System Types
 *
 * Type definitions for card effects, triggers, and abilities.
 */

import type { Id, Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export type EffectType =
  | "draw"           // Draw X cards
  | "destroy"        // Destroy target card(s)
  | "damage"         // Deal X damage to player
  | "gainLP"         // Gain X LP
  | "modifyATK"      // Modify ATK/DEF
  | "summon"         // Special summon
  | "toHand"         // Add card to hand
  | "toGraveyard"    // Send card to GY
  | "banish"         // Banish card
  | "search"         // Search deck
  | "negate"         // Negate activation/effect

export type TriggerCondition =
  | "on_summon"            // When this card is summoned
  | "on_destroy"           // When this card is destroyed
  | "on_flip"              // When this card is flipped
  | "on_battle_damage"     // When this card inflicts battle damage
  | "on_battle_destroy"    // When this card destroys a monster by battle
  | "on_battle_attacked"   // When this card is attacked
  | "on_battle_start"      // At the start of the Battle Phase
  | "on_draw"              // During draw phase
  | "on_end"               // During end phase
  | "manual"               // Manual activation (spells/traps)

export interface ParsedEffect {
  type: EffectType;
  trigger: TriggerCondition;
  value?: number;                              // Numeric value (e.g., "Draw 2" -> value: 2)
  targetCount?: number;                        // Number of targets required
  targetType?: "monster" | "spell" | "trap" | "any";
  targetLocation?: "board" | "hand" | "graveyard" | "deck";
  condition?: string;                          // Additional conditions
  continuous?: boolean;                        // Is this a continuous effect?
  isOPT?: boolean;                             // Once per turn restriction
  // Cost field for effects that require payment
  cost?: {
    type: "discard" | "pay_lp" | "tribute" | "banish";
    value?: number;                            // Number of cards or LP amount
    targetType?: "monster" | "spell" | "trap" | "any";
  };
  // Protection flags
  protection?: {
    cannotBeDestroyedByBattle?: boolean;
    cannotBeDestroyedByEffects?: boolean;
    cannotBeTargeted?: boolean;
  };
}

// Multi-part ability support
export interface ParsedAbility {
  effects: ParsedEffect[];
  hasMultiPart: boolean;
}

// Effect executor function signature
export type EffectExecutor = (
  ctx: MutationCtx,
  gameState: Doc<"gameStates">,
  lobbyId: Id<"gameLobbies">,
  effect: ParsedEffect,
  playerId: string,
  sourceCardId: Id<"cardDefinitions">,
  targets?: Id<"cardDefinitions">[]
) => Promise<{ success: boolean; message: string }>;
