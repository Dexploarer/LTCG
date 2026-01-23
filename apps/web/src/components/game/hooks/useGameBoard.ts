// @ts-nocheck
// TODO: This file depends on Convex game APIs that haven't been implemented yet.
// Remove @ts-nocheck when backend game engine is complete.
"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef } from "react";

// =============================================================================
// Types
// =============================================================================

export interface CardInZone {
  instanceId: Id<"cardInstances">;
  cardId: Id<"cards">;
  name: string;
  cardType?: string;
  rarity: string;
  imageUrl?: string;
  archetype?: string;
  monsterStats?: {
    attack: number;
    defense: number;
    level: number;
    attribute?: string;
    monsterType?: string;
  };
  effects?: Array<{ name: string; description: string; effectType?: string }>;
  position?: string;
  isFaceDown: boolean;
  hasAttacked?: boolean;
  attackModifier?: number;
  defenseModifier?: number;
  zoneIndex?: number;
}

export interface PlayerBoard {
  playerId: Id<"players">;
  playerName: string;
  playerType: string;
  isActivePlayer: boolean;
  lifePoints: number;
  maxLifePoints: number;
  hand: CardInZone[];
  handCount: number;
  frontline: CardInZone | null;
  support: CardInZone[];
  backrow: CardInZone[];
  fieldSpell: CardInZone | null;
  graveyard: CardInZone[];
  graveyardCount: number;
  deckCount: number;
  normalSummonsRemaining: number;
}

export interface GamePhase {
  turnNumber: number;
  activePlayerId: Id<"players">;
  currentPhase: string;
  battleSubPhase?: string;
  attackingCardId?: Id<"cardInstances">;
  attackTargetCardId?: Id<"cardInstances">;
}

export interface ValidActions {
  isYourTurn: boolean;
  currentPhase?: string;
  canNormalSummon: boolean;
  canTributeSummon: boolean;
  canSetMonster: boolean;
  canSetSpellTrap: boolean;
  canActivateSpell: boolean;
  canActivateTrap: boolean;
  canAttack: boolean;
  canChangePosition: boolean;
  canAdvancePhase: boolean;
  canEndTurn: boolean;
  summonableMonsters: Id<"cardInstances">[];
  tributeSummonableMonsters: { cardInstanceId: Id<"cardInstances">; tributesRequired: number }[];
  settableMonsters: Id<"cardInstances">[];
  settableSpellTraps: Id<"cardInstances">[];
  activatableSpells: Id<"cardInstances">[];
  activatableFieldCards?: Id<"cardInstances">[];
  activatableTraps: Id<"cardInstances">[];
  attackers: Id<"cardInstances">[];
  positionChangeable: Id<"cardInstances">[];
  availableTributes: Id<"cardInstances">[];
}

export interface AttackOption {
  instanceId: Id<"cardInstances">;
  name: string;
  attack: number;
  canAttack: boolean;
  reason?: string;
  validTargets: Id<"cardInstances">[];
  canDirectAttack: boolean;
}

export interface AttackTarget {
  instanceId: Id<"cardInstances">;
  name: string;
  attack?: number;
  defense?: number;
  position: string;
  isFaceDown: boolean;
}

// =============================================================================
// Hook
// =============================================================================

export function useGameBoard(gameId: Id<"games">, currentPlayerId: Id<"players">) {
  // ==========================================================================
  // Queries
  // ==========================================================================

  // Main board state (consolidated)
  const boardState = useQuery(api.game.board.getFullBoardState, {
    gameId,
    currentPlayerId,
  });

  // Valid actions for current player
  const validActions = useQuery(api.game.gameEngine.getAvailableActions, {
    gameId,
    playerId: currentPlayerId,
  });

  // Attack options (only in battle phase)
  const attackOptionsRaw = useQuery(
    api.game.combat.getAttackOptions,
    boardState?.phase.currentPhase === "battle" &&
      boardState?.phase.activePlayerId === currentPlayerId
      ? { gameId, playerId: currentPlayerId }
      : "skip"
  );

  const attackOptions = useMemo<AttackOption[] | undefined>(() => {
    if (!attackOptionsRaw) return undefined;
    return attackOptionsRaw.map((option) => ({
      instanceId: option.cardInstanceId,
      name: option.name,
      attack: option.attack,
      canAttack: option.canAttack,
      reason: option.reason,
      validTargets: option.validTargets,
      canDirectAttack: option.canDirectAttack,
    }));
  }, [attackOptionsRaw]);

  // Pending action (for response prompts)
  const pendingAction = useQuery(api.game.chains.getPlayerPendingAction, {
    gameId,
    playerId: currentPlayerId,
  });

  // Valid chain responses (when there's a pending action)
  const chainResponses = useQuery(
    api.game.chains.getValidChainResponses,
    pendingAction ? { gameId, playerId: currentPlayerId } : "skip"
  );

  // ==========================================================================
  // Mutations
  // ==========================================================================

  const normalSummonMutation = useMutation(api.game.gameEngine.normalSummon);
  const setMonsterMutation = useMutation(api.game.gameEngine.setMonster);
  const setSpellTrapMutation = useMutation(api.game.gameEngine.setSpellTrap);
  const advancePhaseMutation = useMutation(api.game.gameEngine.playerAdvancePhase);
  const endTurnMutation = useMutation(api.game.gameEngine.playerEndTurn);
  const declareAttackMutation = useMutation(api.game.combat.playerDeclareAttack);
  const forfeitMutation = useMutation(api.game.games.forfeit);
  const tributeSummonMutation = useMutation(api.game.gameEngine.tributeSummon);
  const evolveMonsterMutation = useMutation(api.game.evolution.evolveMonster);
  const activateSpellMutation = useMutation(api.game.gameEngine.activateSpell);
  const activateFieldSpellMutation = useMutation(api.game.gameEngine.activateFieldSpell);
  const activateTrapMutation = useMutation(api.game.gameEngine.activateTrap);
  const chainResponseMutation = useMutation(api.game.chains.playerChainResponse);

  // ==========================================================================
  // Actions
  // ==========================================================================

  const normalSummon = useCallback(
    async (cardInstanceId: Id<"cardInstances">, position: "attack" | "defense") => {
      try {
        const result = await normalSummonMutation({
          gameId,
          playerId: currentPlayerId,
          cardInstanceId,
          position,
        });
        return result;
      } catch (error) {
        console.error("Normal summon failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [normalSummonMutation, gameId, currentPlayerId]
  );

  const setMonster = useCallback(
    async (cardInstanceId: Id<"cardInstances">) => {
      try {
        const result = await setMonsterMutation({
          gameId,
          playerId: currentPlayerId,
          cardInstanceId,
        });
        return result;
      } catch (error) {
        console.error("Set monster failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [setMonsterMutation, gameId, currentPlayerId]
  );

  const setSpellTrap = useCallback(
    async (cardInstanceId: Id<"cardInstances">) => {
      try {
        const result = await setSpellTrapMutation({
          gameId,
          playerId: currentPlayerId,
          cardInstanceId,
        });
        return result;
      } catch (error) {
        console.error("Set spell/trap failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [setSpellTrapMutation, gameId, currentPlayerId]
  );

  const advancePhase = useCallback(async () => {
    try {
      const result = await advancePhaseMutation({
        gameId,
        playerId: currentPlayerId,
      });
      return result;
    } catch (error) {
      console.error("Advance phase failed:", error);
      return { success: false, error: String(error) };
    }
  }, [advancePhaseMutation, gameId, currentPlayerId]);

  const endTurn = useCallback(async () => {
    try {
      const result = await endTurnMutation({
        gameId,
        playerId: currentPlayerId,
      });
      return result;
    } catch (error) {
      console.error("End turn failed:", error);
      return { success: false, error: String(error) };
    }
  }, [endTurnMutation, gameId, currentPlayerId]);

  const declareAttack = useCallback(
    async (attackingCardId: Id<"cardInstances">, targetCardId?: Id<"cardInstances">) => {
      try {
        const result = await declareAttackMutation({
          gameId,
          playerId: currentPlayerId,
          attackingCardId,
          targetCardId,
        });
        return result;
      } catch (error) {
        console.error("Declare attack failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [declareAttackMutation, gameId, currentPlayerId]
  );

  const forfeitGame = useCallback(async () => {
    try {
      const result = await forfeitMutation({
        gameId,
        playerId: currentPlayerId,
      });
      return result;
    } catch (error) {
      console.error("Forfeit failed:", error);
      return { success: false, error: String(error) };
    }
  }, [forfeitMutation, gameId, currentPlayerId]);

  const tributeSummon = useCallback(
    async (
      cardInstanceId: Id<"cardInstances">,
      tributeIds: Id<"cardInstances">[],
      position: "attack" | "defense"
    ) => {
      try {
        const result = await tributeSummonMutation({
          gameId,
          playerId: currentPlayerId,
          cardInstanceId,
          tributeIds,
          position,
        });
        return result;
      } catch (error) {
        console.error("Tribute summon failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [tributeSummonMutation, gameId, currentPlayerId]
  );

  const evolveMonster = useCallback(
    async (cardInstanceId: Id<"cardInstances">, targetCardId: Id<"cards">) => {
      try {
        const result = await evolveMonsterMutation({
          gameId,
          playerId: currentPlayerId,
          cardInstanceId,
          targetCardId,
        });
        return result;
      } catch (error) {
        console.error("Evolution failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [evolveMonsterMutation, gameId, currentPlayerId]
  );

  const activateSpell = useCallback(
    async (
      cardInstanceId: Id<"cardInstances">,
      effectIndex?: number,
      targetCardIds?: Id<"cardInstances">[],
      targetPlayerIds?: Id<"players">[]
    ) => {
      try {
        const result = await activateSpellMutation({
          gameId,
          playerId: currentPlayerId,
          cardInstanceId,
          effectIndex,
          targetCardIds,
          targetPlayerIds,
        });
        return result;
      } catch (error) {
        console.error("Activate spell failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [activateSpellMutation, gameId, currentPlayerId]
  );

  const activateFieldSpell = useCallback(
    async (
      cardInstanceId: Id<"cardInstances">,
      effectIndex?: number,
      targetCardIds?: Id<"cardInstances">[],
      targetPlayerIds?: Id<"players">[]
    ) => {
      try {
        const result = await activateFieldSpellMutation({
          gameId,
          playerId: currentPlayerId,
          cardInstanceId,
          effectIndex,
          targetCardIds,
          targetPlayerIds,
        });
        return result;
      } catch (error) {
        console.error("Activate field spell failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [activateFieldSpellMutation, gameId, currentPlayerId]
  );

  const activateTrap = useCallback(
    async (
      cardInstanceId: Id<"cardInstances">,
      effectIndex?: number,
      targetCardIds?: Id<"cardInstances">[],
      targetPlayerIds?: Id<"players">[]
    ) => {
      try {
        const result = await activateTrapMutation({
          gameId,
          playerId: currentPlayerId,
          cardInstanceId,
          effectIndex,
          targetCardIds,
          targetPlayerIds,
        });
        return result;
      } catch (error) {
        console.error("Activate trap failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [activateTrapMutation, gameId, currentPlayerId]
  );

  const respondToChain = useCallback(
    async (
      response:
        | "pass"
        | {
            cardInstanceId: Id<"cardInstances">;
            effectIndex: number;
            targets?: {
              cardIds?: Id<"cardInstances">[];
              playerIds?: Id<"players">[];
            };
          }
    ) => {
      try {
        const result = await chainResponseMutation({
          gameId,
          playerId: currentPlayerId,
          response,
        });
        return result;
      } catch (error) {
        console.error("Chain response failed:", error);
        return { success: false, chainResolving: false, error: String(error) };
      }
    },
    [chainResponseMutation, gameId, currentPlayerId]
  );

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  const isPlayerTurn = useMemo(() => {
    return boardState?.phase.activePlayerId === currentPlayerId;
  }, [boardState?.phase.activePlayerId, currentPlayerId]);

  const currentPhase = useMemo(() => {
    return boardState?.phase.currentPhase ?? "unknown";
  }, [boardState?.phase.currentPhase]);

  const isMainPhase = useMemo(() => {
    return currentPhase === "main1" || currentPhase === "main2";
  }, [currentPhase]);

  const isBattlePhase = useMemo(() => {
    return currentPhase === "battle";
  }, [currentPhase]);

  const isLoading = boardState === undefined || validActions === undefined;

  // ==========================================================================
  // Automatic Phase Progression
  // ==========================================================================

  // Track if we're currently auto-advancing to prevent multiple calls
  const isAutoAdvancing = useRef(false);

  // Auto-advance non-interactive phases (draw, standby)
  useEffect(() => {
    if (
      !isLoading &&
      isPlayerTurn &&
      validActions?.canAdvancePhase &&
      (currentPhase === "draw" || currentPhase === "standby") &&
      !isAutoAdvancing.current
    ) {
      isAutoAdvancing.current = true;

      const timer = setTimeout(async () => {
        try {
          await advancePhaseMutation({
            gameId,
            playerId: currentPlayerId,
          });
        } catch (error) {
          console.error("Auto-advance phase failed:", error);
        } finally {
          isAutoAdvancing.current = false;
        }
      }, 500);

      return () => {
        clearTimeout(timer);
        isAutoAdvancing.current = false;
      };
    }
  }, [
    isLoading,
    isPlayerTurn,
    validActions?.canAdvancePhase,
    currentPhase,
    advancePhaseMutation,
    gameId,
    currentPlayerId,
  ]);

  const gameEnded = useMemo(() => {
    return boardState?.gameStatus === "completed" || boardState?.winnerId != null;
  }, [boardState?.gameStatus, boardState?.winnerId]);

  const winner = useMemo(() => {
    if (!boardState?.winnerId) return null;
    if (boardState.winnerId === currentPlayerId) return "player";
    return "opponent";
  }, [boardState?.winnerId, currentPlayerId]);

  // Check which hand cards are playable
  const playableHandCards = useMemo(() => {
    if (!validActions || !boardState) return new Set<Id<"cardInstances">>();

    const playable = new Set<Id<"cardInstances">>();

    for (const id of validActions.summonableMonsters ?? []) {
      playable.add(id);
    }

    for (const item of validActions.tributeSummonableMonsters ?? []) {
      playable.add(item.cardInstanceId);
    }

    for (const id of validActions.settableMonsters ?? []) {
      playable.add(id);
    }

    for (const id of validActions.settableSpellTraps ?? []) {
      playable.add(id);
    }

    for (const id of validActions.activatableSpells ?? []) {
      playable.add(id);
    }

    for (const id of validActions.activatableFieldCards ?? []) {
      playable.add(id);
    }

    return playable;
  }, [validActions, boardState]);

  // Backrow cards that can be activated right now
  const activatableBackrowCards = useMemo(() => {
    if (!validActions || !boardState?.player) return new Set<Id<"cardInstances">>();

    const activatable = new Set<Id<"cardInstances">>();

    for (const id of validActions.activatableSpells ?? []) {
      const isInBackrow = boardState.player.backrow.some((card) => card.instanceId === id);
      if (isInBackrow) {
        activatable.add(id);
      }
    }

    for (const id of validActions.activatableFieldCards ?? []) {
      const isInBackrow = boardState.player.backrow.some((card) => card.instanceId === id);
      if (isInBackrow) {
        activatable.add(id);
      }
    }

    for (const id of validActions.activatableTraps ?? []) {
      activatable.add(id);
    }

    return activatable;
  }, [validActions, boardState]);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // State
    boardState,
    player: boardState?.player ?? null,
    opponent: boardState?.opponent ?? null,
    pendingAction,
    chainResponses,
    phase: boardState?.phase ?? null,
    validActions,
    attackOptions,

    // Computed
    isLoading,
    isPlayerTurn,
    currentPhase,
    isMainPhase,
    isBattlePhase,
    gameEnded,
    winner,
    playableHandCards,
    activatableBackrowCards,

    // Actions
    normalSummon,
    setMonster,
    setSpellTrap,
    advancePhase,
    endTurn,
    declareAttack,
    forfeitGame,
    tributeSummon,
    evolveMonster,
    activateSpell,
    activateFieldSpell,
    activateTrap,
    respondToChain,
  };
}

export type UseGameBoardReturn = ReturnType<typeof useGameBoard>;
