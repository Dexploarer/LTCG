"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo } from "react";

// =============================================================================
// Types adapted to match actual schema
// =============================================================================

export interface CardInZone {
  instanceId: Id<"cardDefinitions">; // Using cardDefinitionId as instanceId for now
  cardId: Id<"cardDefinitions">;
  name?: string;
  cardType?: string;
  rarity?: string;
  imageUrl?: string;
  archetype?: string;
  attack?: number;
  defense?: number;
  position?: string | number; // "attack" | "defense" | "setDefense" or 1/-1
  isFaceDown?: boolean;
  hasAttacked?: boolean;
  attackModifier?: number;
  defenseModifier?: number;
  monsterStats?: {
    level: number;
    attack: number;
    defense: number;
  };
  effects?: Array<{
    name: string;
    description: string;
    effectType?: string;
  }>;
}

export interface PlayerBoard {
  playerId: Id<"users">;
  playerName: string;
  playerType?: string;
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
  activePlayerId: Id<"users">;
  currentPhase: string;
  battleSubPhase?: string;
  attackingCardId?: Id<"cardDefinitions">;
}

export interface ValidActions {
  isYourTurn: boolean;
  currentPhase?: string;
  canNormalSummon: boolean;
  canSetMonster: boolean;
  canSetSpellTrap: boolean;
  canActivateSpell: boolean;
  canActivateTrap: boolean;
  canAttack: boolean;
  canAdvancePhase: boolean;
  canEndTurn: boolean;
  summonableMonsters?: Id<"cardDefinitions">[];
  settableMonsters?: Id<"cardDefinitions">[];
  settableSpellTraps?: Id<"cardDefinitions">[];
  activatableSpells?: Id<"cardDefinitions">[];
  activatableFieldCards?: Id<"cardDefinitions">[];
  activatableTraps?: Id<"cardDefinitions">[];
  attackers?: Id<"cardDefinitions">[];
}

// =============================================================================
// Hook
// =============================================================================

export function useGameBoard(lobbyId: Id<"gameLobbies">, currentPlayerId: Id<"users">) {
  // ==========================================================================
  // Queries - using actual APIs that exist
  // ==========================================================================

  // First, get lobby details to check if game is active
  const lobbyDetails = useQuery(api.gameplay.games.queries.getLobbyDetails, { lobbyId });

  // Only query game state if lobby is active (not "waiting")
  const gameState = useQuery(
    api.gameplay.games.queries.getGameStateForPlayer,
    lobbyDetails?.status === "active" ? { lobbyId } : "skip"
  );

  const availableActions = useQuery(
    api.gameplay.games.queries.getAvailableActions,
    lobbyDetails?.status === "active" ? { lobbyId } : "skip"
  );

  // ==========================================================================
  // Mutations - using actual game engine APIs
  // ==========================================================================

  // Mutations with optimistic updates for instant feedback
  const normalSummonMutation = useMutation(api.gameplay.gameEngine.summons.normalSummon)
    .withOptimisticUpdate((localStore, args) => {
      const currentState = localStore.getQuery(api.gameplay.games.queries.getGameStateForPlayer, { lobbyId });
      if (!currentState) return;

      // Optimistically update game state - remove card from hand, add to board
      const newHand = currentState.myHand.filter(id => id !== args.cardId);
      const newBoardCard = {
        cardId: args.cardId,
        position: args.position === "attack" ? 1 : -1,
        attack: 0, // Will be updated by server
        defense: 0,
        isFaceDown: false,
        hasAttacked: false,
      };

      localStore.setQuery(api.gameplay.games.queries.getGameStateForPlayer, { lobbyId }, {
        ...currentState,
        myHand: newHand,
        myBoard: [...currentState.myBoard, newBoardCard],
      });
    });

  const setMonsterMutation = useMutation(api.gameplay.gameEngine.summons.setMonster)
    .withOptimisticUpdate((localStore, args) => {
      const currentState = localStore.getQuery(api.gameplay.games.queries.getGameStateForPlayer, { lobbyId });
      if (!currentState) return;

      // Optimistically remove from hand and add to board face-down
      const newHand = currentState.myHand.filter(id => id !== args.cardId);
      const newBoardCard = {
        cardId: args.cardId,
        position: -1, // Defense position
        attack: 0,
        defense: 0,
        isFaceDown: true,
        hasAttacked: false,
      };

      localStore.setQuery(api.gameplay.games.queries.getGameStateForPlayer, { lobbyId }, {
        ...currentState,
        myHand: newHand,
        myBoard: [...currentState.myBoard, newBoardCard],
      });
    });

  const setSpellTrapMutation = useMutation(api.gameplay.gameEngine.spellsTraps.setSpellTrap);
  const activateSpellMutation = useMutation(api.gameplay.gameEngine.spellsTraps.activateSpell);
  const activateTrapMutation = useMutation(api.gameplay.gameEngine.spellsTraps.activateTrap);

  const advancePhaseMutation = useMutation(api.gameplay.phaseManager.advancePhase)
    .withOptimisticUpdate((localStore, args) => {
      const currentState = localStore.getQuery(api.gameplay.games.queries.getGameStateForPlayer, { lobbyId });
      if (!currentState) return;

      // Optimistically advance to next phase
      const phaseOrder = ["draw", "standby", "main1", "battle_start", "battle", "battle_end", "main2", "end"];
      const currentIndex = phaseOrder.indexOf(currentState.currentPhase);
      const nextPhase = currentIndex >= 0 && currentIndex < phaseOrder.length - 1
        ? phaseOrder[currentIndex + 1]
        : currentState.currentPhase;

      localStore.setQuery(api.gameplay.games.queries.getGameStateForPlayer, { lobbyId }, {
        ...currentState,
        currentPhase: nextPhase as any,
      });
    });

  const endTurnMutation = useMutation(api.gameplay.gameEngine.turns.endTurn)
    .withOptimisticUpdate((localStore, args) => {
      const currentState = localStore.getQuery(api.gameplay.games.queries.getGameStateForPlayer, { lobbyId });
      if (!currentState) return;

      // Optimistically switch turns and advance to main phase 1
      // Note: The opponent will draw automatically and start in main1
      localStore.setQuery(api.gameplay.games.queries.getGameStateForPlayer, { lobbyId }, {
        ...currentState,
        isYourTurn: false,
        currentPhase: "main1",
        turnNumber: currentState.turnNumber + 1,
      });
    });

  const surrenderGameMutation = useMutation(api.gameplay.games.lifecycle.surrenderGame);

  const declareAttackMutation = useMutation(api.gameplay.combatSystem.declareAttack)
    .withOptimisticUpdate((localStore, args) => {
      const currentState = localStore.getQuery(api.gameplay.games.queries.getGameStateForPlayer, { lobbyId });
      if (!currentState) return;

      // Optimistically mark attacker as having attacked
      const newBoard = currentState.myBoard.map(card =>
        card.cardId === args.attackerCardId
          ? { ...card, hasAttacked: true }
          : card
      );

      localStore.setQuery(api.gameplay.games.queries.getGameStateForPlayer, { lobbyId }, {
        ...currentState,
        myBoard: newBoard,
      });
    });

  // ==========================================================================
  // Actions
  // ==========================================================================

  const normalSummon = useCallback(
    async (cardId: Id<"cardDefinitions">, position: "attack" | "defense", tributeIds?: Id<"cardDefinitions">[]) => {
      try {
        await normalSummonMutation({
          lobbyId,
          cardId,
          position,
          tributeCardIds: tributeIds,
        });
        return { success: true };
      } catch (error) {
        console.error("Normal summon failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [normalSummonMutation, lobbyId]
  );

  const setMonster = useCallback(
    async (cardId: Id<"cardDefinitions">) => {
      try {
        await setMonsterMutation({
          lobbyId,
          cardId,
        });
        return { success: true };
      } catch (error) {
        console.error("Set monster failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [setMonsterMutation, lobbyId]
  );

  const setSpellTrap = useCallback(
    async (cardId: Id<"cardDefinitions">) => {
      try {
        await setSpellTrapMutation({
          lobbyId,
          cardId,
        });
        return { success: true };
      } catch (error) {
        console.error("Set spell/trap failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [setSpellTrapMutation, lobbyId]
  );

  const advancePhase = useCallback(async () => {
    try {
      await advancePhaseMutation({ lobbyId });
      return { success: true };
    } catch (error) {
      console.error("Advance phase failed:", error);
      return { success: false, error: String(error) };
    }
  }, [advancePhaseMutation, lobbyId]);

  const executeAITurnMutation = useMutation(api.gameplay.ai.aiTurn.executeAITurn);

  const endTurn = useCallback(async () => {
    try {
      await endTurnMutation({ lobbyId });

      // Check if this is a story mode game and trigger AI turn
      if (lobbyDetails?.mode === "story") {
        // Give a brief delay for UI to update
        setTimeout(async () => {
          try {
            // Find the game ID from lobby details
            const gameId = lobbyDetails.gameId;
            if (gameId) {
              await executeAITurnMutation({ gameId });
            }
          } catch (aiError) {
            console.error("AI turn execution failed:", aiError);
          }
        }, 1000);
      }

      return { success: true };
    } catch (error) {
      console.error("End turn failed:", error);
      return { success: false, error: String(error) };
    }
  }, [endTurnMutation, lobbyId, lobbyDetails, executeAITurnMutation]);

  const declareAttack = useCallback(
    async (attackingCardId: Id<"cardDefinitions">, targetCardId?: Id<"cardDefinitions">) => {
      try {
        await declareAttackMutation({
          lobbyId,
          attackerCardId: attackingCardId,
          targetCardId,
        });
        return { success: true };
      } catch (error) {
        console.error("Declare attack failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [declareAttackMutation, lobbyId]
  );

  const forfeitGame = useCallback(async () => {
    try {
      await surrenderGameMutation({ lobbyId });
      return { success: true };
    } catch (error) {
      console.error("Forfeit failed:", error);
      return { success: false, error: String(error) };
    }
  }, [surrenderGameMutation, lobbyId]);

  const activateSpell = useCallback(
    async (cardId: Id<"cardDefinitions">, effectIndex?: number) => {
      try {
        await activateSpellMutation({
          lobbyId,
          cardId,
        });
        return { success: true };
      } catch (error) {
        console.error("Activate spell failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [activateSpellMutation, lobbyId]
  );

  const activateFieldSpell = useCallback(
    async (cardId: Id<"cardDefinitions">, effectIndex?: number) => {
      try {
        // Field spells use the same activateSpell mutation
        await activateSpellMutation({
          lobbyId,
          cardId,
        });
        return { success: true };
      } catch (error) {
        console.error("Activate field spell failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [activateSpellMutation, lobbyId]
  );

  const activateTrap = useCallback(
    async (cardId: Id<"cardDefinitions">, effectIndex?: number) => {
      try {
        await activateTrapMutation({
          lobbyId,
          cardId,
        });
        return { success: true };
      } catch (error) {
        console.error("Activate trap failed:", error);
        return { success: false, error: String(error) };
      }
    },
    [activateTrapMutation, lobbyId]
  );

  const respondToChain = useCallback(
    async (response: "pass" | { cardId: Id<"cardDefinitions">; effectIndex: number }) => {
      try {
        // TODO: Implement respondToChain mutation
        console.log("Respond to chain:", response);
        return { success: true, chainResolving: false };
      } catch (error) {
        console.error("Chain response failed:", error);
        return { success: false, chainResolving: false, error: String(error) };
      }
    },
    [lobbyId]
  );

  // ==========================================================================
  // Computed Values - adapted to actual gameState structure
  // ==========================================================================

  const isPlayerTurn = useMemo(() => {
    return gameState?.isYourTurn ?? false;
  }, [gameState?.isYourTurn]);

  const currentPhase = useMemo(() => {
    return gameState?.currentPhase ?? "unknown";
  }, [gameState?.currentPhase]);

  const isMainPhase = useMemo(() => {
    return currentPhase === "main1" || currentPhase === "main2";
  }, [currentPhase]);

  const isBattlePhase = useMemo(() => {
    return currentPhase === "battle";
  }, [currentPhase]);

  // Loading logic: waiting for lobbyDetails, or if active, waiting for game state
  const isLoading =
    lobbyDetails === undefined ||
    (lobbyDetails.status === "active" && (gameState === undefined || availableActions === undefined));

  const gameEnded = useMemo(() => {
    // Check if game is over
    return false; // TODO: Check actual game status from gameState
  }, [gameState]);

  const winner = useMemo(() => {
    // TODO: Determine winner from gameState
    return null;
  }, [gameState]);

  // Transform gameState data to match PlayerBoard interface
  const player = useMemo<PlayerBoard | null>(() => {
    if (!gameState) return null;

    return {
      playerId: currentPlayerId,
      playerName: "You", // TODO: Get from user data
      playerType: "human",
      isActivePlayer: gameState.isYourTurn,
      lifePoints: gameState.myLifePoints,
      maxLifePoints: 8000,
      hand: gameState.myHand.map((card: any) => ({
        instanceId: card._id,
        cardId: card._id,
        name: card.name,
        imageUrl: card.imageUrl,
        cardType: card.cardType,
        rarity: card.rarity,
        archetype: card.archetype,
        monsterStats: card.cardType === "creature" ? {
          attack: card.attack,
          defense: card.defense,
          level: card.level,
        } : undefined,
        effects: card.ability ? [{
          name: card.name || "Card Effect",
          description: card.ability,
          effectType: card.effectType,
        }] : [],
        isFaceDown: false,
      })),
      handCount: gameState.myHand.length,
      frontline: null, // TODO: Extract from myBoard
      support: gameState.myBoard.map((card: any) => ({
        instanceId: card._id,
        cardId: card._id,
        name: card.name,
        imageUrl: card.imageUrl,
        cardType: card.cardType,
        rarity: card.rarity,
        archetype: card.archetype,
        attack: card.currentAttack,
        defense: card.currentDefense,
        position: card.position === 1 ? "attack" : "defense",
        hasAttacked: card.hasAttacked,
        isFaceDown: card.isFaceDown,
        monsterStats: {
          attack: card.currentAttack,
          defense: card.currentDefense,
          level: card.level,
        },
        effects: card.ability ? [{
          name: card.name || "Card Effect",
          description: card.ability,
          effectType: card.effectType,
        }] : [],
      })),
      backrow: gameState.mySpellTrapZone.map((card: any) => ({
        instanceId: card._id,
        cardId: card._id,
        name: card.name,
        imageUrl: card.imageUrl,
        cardType: card.cardType,
        rarity: card.rarity,
        archetype: card.archetype,
        isFaceDown: card.isFaceDown,
        effects: card.ability ? [{
          name: card.name || "Card Effect",
          description: card.ability,
          effectType: card.effectType,
        }] : [],
      })),
      fieldSpell: null, // TODO: Extract from gameState
      graveyard: gameState.myGraveyard.map((card: any) => ({
        instanceId: card._id,
        cardId: card._id,
        name: card.name,
        imageUrl: card.imageUrl,
        isFaceDown: false,
      })),
      graveyardCount: gameState.myGraveyard.length,
      deckCount: gameState.myDeckCount,
      normalSummonsRemaining: 1, // TODO: Track from gameState
    };
  }, [gameState, currentPlayerId]);

  const opponent = useMemo<PlayerBoard | null>(() => {
    if (!gameState) return null;

    return {
      playerId: gameState.opponentId,
      playerName: gameState.opponentUsername,
      playerType: "human",
      isActivePlayer: !gameState.isYourTurn,
      lifePoints: gameState.opponentLifePoints,
      maxLifePoints: 8000,
      hand: [], // Opponent's hand is hidden
      handCount: gameState.opponentHandCount,
      frontline: null,
      support: gameState.opponentBoard.map((card: any) => ({
        instanceId: card._id,
        cardId: card._id,
        name: card.name,
        imageUrl: card.imageUrl,
        cardType: card.cardType,
        rarity: card.rarity,
        archetype: card.archetype,
        attack: card.currentAttack,
        defense: card.currentDefense,
        position: card.position === 1 ? "attack" : "defense",
        hasAttacked: card.hasAttacked,
        isFaceDown: card.isFaceDown,
        monsterStats: {
          attack: card.currentAttack,
          defense: card.currentDefense,
          level: card.level,
        },
        effects: card.ability ? [{
          name: card.name || "Card Effect",
          description: card.ability,
          effectType: card.effectType,
        }] : [],
      })),
      backrow: gameState.opponentSpellTrapZone.map((card: any) => ({
        instanceId: card._id,
        cardId: card._id,
        name: card.name,
        imageUrl: card.imageUrl,
        cardType: card.cardType,
        rarity: card.rarity,
        archetype: card.archetype,
        isFaceDown: card.isFaceDown,
        effects: card.ability ? [{
          name: card.name || "Card Effect",
          description: card.ability,
          effectType: card.effectType,
        }] : [],
      })),
      fieldSpell: null,
      graveyard: gameState.opponentGraveyard.map((card: any) => ({
        instanceId: card._id,
        cardId: card._id,
        name: card.name,
        imageUrl: card.imageUrl,
        isFaceDown: false,
      })),
      graveyardCount: gameState.opponentGraveyard.length,
      deckCount: gameState.opponentDeckCount,
      normalSummonsRemaining: 1,
    };
  }, [gameState]);

  const phase = useMemo<GamePhase | null>(() => {
    if (!gameState) return null;

    return {
      turnNumber: gameState.turnNumber,
      activePlayerId: gameState.isYourTurn ? currentPlayerId : gameState.opponentId,
      currentPhase: gameState.currentPhase,
    };
  }, [gameState, currentPlayerId]);

  // Map available actions to ValidActions interface
  const validActions = useMemo<ValidActions | null>(() => {
    if (!availableActions) return null;

    return {
      isYourTurn: gameState?.isYourTurn ?? false,
      currentPhase: gameState?.currentPhase,
      canNormalSummon: availableActions.actions.includes("normalSummon"),
      canSetMonster: availableActions.actions.includes("setMonster"),
      canSetSpellTrap: availableActions.actions.includes("setSpellTrap"),
      canActivateSpell: availableActions.actions.includes("activateSpell"),
      canActivateTrap: availableActions.actions.includes("activateTrap"),
      canAttack: availableActions.actions.includes("attack"),
      canAdvancePhase: availableActions.actions.includes("advancePhase"),
      canEndTurn: availableActions.actions.includes("endTurn"),
    };
  }, [availableActions, gameState]);

  // Playable hand cards
  const playableHandCards = useMemo(() => {
    if (!validActions || !gameState) return new Set<Id<"cardDefinitions">>();

    const playable = new Set<Id<"cardDefinitions">>();

    // TODO: Determine which cards in hand are playable based on validActions
    // For now, all cards in hand are potentially playable if it's your turn
    if (validActions.isYourTurn) {
      gameState.myHand.forEach((card: any) => playable.add(card._id));
    }

    return playable;
  }, [validActions, gameState]);

  // Activatable backrow cards
  const activatableBackrowCards = useMemo(() => {
    if (!validActions || !gameState) return new Set<Id<"cardDefinitions">>();

    const activatable = new Set<Id<"cardDefinitions">>();

    // TODO: Determine which backrow cards can be activated

    return activatable;
  }, [validActions, gameState]);

  // Attack options - compute which monsters can attack
  const attackOptions = useMemo(() => {
    if (!player || !isBattlePhase || !isPlayerTurn) return [];

    const options: Array<{
      instanceId: Id<"cardDefinitions">;
      name: string;
      canAttack: boolean;
      canDirectAttack: boolean;
      validTargets: Id<"cardDefinitions">[];
    }> = [];

    // Get all valid attack targets (opponent's monsters)
    const validTargets: Id<"cardDefinitions">[] = [];
    if (opponent?.frontline) {
      validTargets.push(opponent.frontline.instanceId);
    }
    if (opponent?.support) {
      for (const card of opponent.support) {
        validTargets.push(card.instanceId);
      }
    }

    // Check if opponent has any face-up monsters
    const opponentHasMonsters = validTargets.length > 0;

    // Check frontline monster
    if (player.frontline) {
      const monster = player.frontline;
      // Position can be 1 (attack), -1 (defense), or string "attack"/"defense"/"setDefense"
      const isInAttackPosition = monster.position === 1 || monster.position === "attack";
      const canAttack = !monster.hasAttacked && !monster.isFaceDown && isInAttackPosition;

      if (canAttack) {
        options.push({
          instanceId: monster.instanceId,
          name: monster.name || "Unknown",
          canAttack: true,
          canDirectAttack: !opponentHasMonsters,
          validTargets: validTargets,
        });
      }
    }

    // Check support monsters
    if (player.support) {
      for (const monster of player.support) {
        // Position can be 1 (attack), -1 (defense), or string "attack"/"defense"/"setDefense"
        const isInAttackPosition = monster.position === 1 || monster.position === "attack";
        const canAttack = !monster.hasAttacked && !monster.isFaceDown && isInAttackPosition;

        if (canAttack) {
          options.push({
            instanceId: monster.instanceId,
            name: monster.name || "Unknown",
            canAttack: true,
            canDirectAttack: !opponentHasMonsters,
            validTargets: validTargets,
          });
        }
      }
    }

    return options;
  }, [player, opponent, isBattlePhase, isPlayerTurn]);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // State
    player,
    opponent,
    phase,
    validActions,
    attackOptions,
    pendingAction: undefined, // TODO: Implement pending actions
    chainResponses: undefined, // TODO: Implement chain responses

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
    activateSpell,
    activateFieldSpell,
    activateTrap,
    respondToChain,
  };
}

export type UseGameBoardReturn = ReturnType<typeof useGameBoard>;
