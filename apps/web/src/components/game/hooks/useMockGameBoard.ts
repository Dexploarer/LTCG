// @ts-nocheck
// TODO: This file uses mock Convex types that need to be updated when backend is ready.
"use client";

import type { Id } from "@convex/_generated/dataModel";
import { useCallback, useMemo, useState } from "react";
import type {
  AttackOption,
  CardInZone,
  GamePhase,
  PlayerBoard,
  ValidActions,
} from "./useGameBoard";

// Mock ID generator
function mockId(prefix: string, num: number): Id<any> {
  return `${prefix}_${num}` as Id<any>;
}

// Mock cards
const MOCK_MONSTER_1: CardInZone = {
  instanceId: mockId("ci", 1),
  cardId: mockId("c", 1),
  name: "Flame Warrior",
  cardType: "monster",
  rarity: "rare",
  imageUrl: "/cards/flame-warrior.png",
  archetype: "Infernal Dragons",
  monsterStats: {
    attack: 1600,
    defense: 1400,
    level: 4,
    attribute: "fire",
    monsterType: "warrior",
  },
  effects: [
    {
      name: "Burning Strike",
      description:
        "When this card destroys a monster by battle, inflict 300 damage to your opponent.",
      effectType: "trigger",
    },
  ],
  position: "attack",
  isFaceDown: false,
  hasAttacked: false,
  attackModifier: 0,
  defenseModifier: 0,
  zoneIndex: 0,
};

const MOCK_MONSTER_2: CardInZone = {
  instanceId: mockId("ci", 2),
  cardId: mockId("c", 2),
  name: "Shadow Beast",
  cardType: "monster",
  rarity: "common",
  archetype: "Abyssal Horrors",
  monsterStats: { attack: 1400, defense: 1200, level: 4, attribute: "dark", monsterType: "beast" },
  position: "attack",
  isFaceDown: false,
  hasAttacked: false,
  zoneIndex: 0,
};

const MOCK_MONSTER_3: CardInZone = {
  instanceId: mockId("ci", 3),
  cardId: mockId("c", 3),
  name: "Dark Guardian",
  cardType: "monster",
  rarity: "uncommon",
  archetype: "Abyssal Horrors",
  monsterStats: {
    attack: 1200,
    defense: 2000,
    level: 4,
    attribute: "dark",
    monsterType: "warrior",
  },
  position: "defense",
  isFaceDown: false,
  hasAttacked: false,
  zoneIndex: 1,
};

const MOCK_HAND_CARDS: CardInZone[] = [
  {
    instanceId: mockId("ci", 10),
    cardId: mockId("c", 10),
    name: "Fire Dragon",
    cardType: "monster",
    rarity: "epic",
    archetype: "Infernal Dragons",
    monsterStats: { attack: 1800, defense: 1200, level: 4 },
    isFaceDown: false,
  },
  {
    instanceId: mockId("ci", 11),
    cardId: mockId("c", 11),
    name: "Flame Shield",
    cardType: "trap",
    rarity: "rare",
    effects: [
      {
        name: "Flame Shield",
        description:
          "When an opponent's monster declares an attack: Negate the attack and destroy the attacking monster.",
        effectType: "counter",
      },
    ],
    isFaceDown: false,
  },
  {
    instanceId: mockId("ci", 12),
    cardId: mockId("c", 12),
    name: "Ember Knight",
    cardType: "monster",
    rarity: "uncommon",
    archetype: "Infernal Dragons",
    monsterStats: { attack: 1500, defense: 1000, level: 4 },
    isFaceDown: false,
  },
  {
    instanceId: mockId("ci", 13),
    cardId: mockId("c", 13),
    name: "Inferno Blast",
    cardType: "spell",
    rarity: "rare",
    effects: [
      {
        name: "Inferno Blast",
        description: "Destroy 1 monster on the field and inflict 500 damage to your opponent.",
        effectType: "normal",
      },
    ],
    isFaceDown: false,
  },
  {
    instanceId: mockId("ci", 14),
    cardId: mockId("c", 14),
    name: "Dragon's Roar",
    cardType: "spell",
    rarity: "common",
    effects: [
      {
        name: "Dragon's Roar",
        description:
          "All Dragon-type monsters you control gain 300 ATK until the end of this turn.",
        effectType: "quick",
      },
    ],
    isFaceDown: false,
  },
];

const MOCK_SET_TRAP: CardInZone = {
  instanceId: mockId("ci", 20),
  cardId: mockId("c", 20),
  name: "Mirror Force",
  cardType: "trap",
  rarity: "rare",
  isFaceDown: true,
  zoneIndex: 0,
};

// Create mock player board
function createMockPlayer(): PlayerBoard {
  return {
    playerId: mockId("p", 1),
    playerName: "Player",
    playerType: "human",
    isActivePlayer: true,
    lifePoints: 8000,
    maxLifePoints: 8000,
    hand: MOCK_HAND_CARDS,
    handCount: MOCK_HAND_CARDS.length,
    frontline: MOCK_MONSTER_1,
    support: [],
    backrow: [MOCK_SET_TRAP],
    fieldSpell: null,
    graveyard: [],
    graveyardCount: 0,
    deckCount: 32,
    normalSummonsRemaining: 1,
  };
}

function createMockOpponent(): PlayerBoard {
  return {
    playerId: mockId("p", 2),
    playerName: "AI Opponent",
    playerType: "ai",
    isActivePlayer: false,
    lifePoints: 8000,
    maxLifePoints: 8000,
    hand: [],
    handCount: 5,
    frontline: MOCK_MONSTER_2,
    support: [MOCK_MONSTER_3],
    backrow: [{ ...MOCK_SET_TRAP, instanceId: mockId("ci", 21), zoneIndex: 0 }],
    fieldSpell: null,
    graveyard: [],
    graveyardCount: 2,
    deckCount: 28,
    normalSummonsRemaining: 0,
  };
}

export function useMockGameBoard() {
  const [player, setPlayer] = useState<PlayerBoard>(createMockPlayer);
  const [opponent, _setOpponent] = useState<PlayerBoard>(createMockOpponent);
  const [currentPhase, setCurrentPhase] = useState<string>("main1");
  const [turnNumber, setTurnNumber] = useState(1);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  const phase: GamePhase = useMemo(
    () => ({
      turnNumber,
      activePlayerId: isPlayerTurn ? player.playerId : opponent.playerId,
      currentPhase,
    }),
    [turnNumber, isPlayerTurn, player.playerId, opponent.playerId, currentPhase]
  );

  const validActions: ValidActions = useMemo(
    () => ({
      isYourTurn: isPlayerTurn,
      currentPhase,
      canNormalSummon:
        isPlayerTurn &&
        (currentPhase === "main1" || currentPhase === "main2") &&
        player.normalSummonsRemaining > 0,
      canTributeSummon: false,
      canSetMonster: isPlayerTurn && (currentPhase === "main1" || currentPhase === "main2"),
      canSetSpellTrap: isPlayerTurn && (currentPhase === "main1" || currentPhase === "main2"),
      canActivateSpell: isPlayerTurn && (currentPhase === "main1" || currentPhase === "main2"),
      canActivateTrap: true,
      canAttack: isPlayerTurn && currentPhase === "battle",
      canChangePosition: isPlayerTurn && (currentPhase === "main1" || currentPhase === "main2"),
      canAdvancePhase: isPlayerTurn,
      canEndTurn: isPlayerTurn,
      summonableMonsters: MOCK_HAND_CARDS.filter((c) => c.cardType === "monster").map(
        (c) => c.instanceId
      ),
      tributeSummonableMonsters: [],
      settableMonsters: MOCK_HAND_CARDS.filter((c) => c.cardType === "monster").map(
        (c) => c.instanceId
      ),
      settableSpellTraps: MOCK_HAND_CARDS.filter(
        (c) => c.cardType === "spell" || c.cardType === "trap"
      ).map((c) => c.instanceId),
      activatableSpells: MOCK_HAND_CARDS.filter((c) => c.cardType === "spell").map(
        (c) => c.instanceId
      ),
      activatableFieldCards: [],
      activatableTraps: [],
      attackers: player.frontline ? [player.frontline.instanceId] : [],
      positionChangeable: [],
      availableTributes: [],
    }),
    [isPlayerTurn, currentPhase, player]
  );

  const attackOptions: AttackOption[] = useMemo(() => {
    if (currentPhase !== "battle" || !isPlayerTurn || !player.frontline) return [];

    const targets: Id<"cardInstances">[] = [];
    if (opponent.frontline) targets.push(opponent.frontline.instanceId);
    opponent.support.forEach((c) => targets.push(c.instanceId));

    return [
      {
        instanceId: player.frontline.instanceId,
        name: player.frontline.name,
        attack: player.frontline.monsterStats?.attack ?? 0,
        canAttack: !player.frontline.hasAttacked,
        validTargets: targets,
        canDirectAttack: targets.length === 0,
      },
    ];
  }, [currentPhase, isPlayerTurn, player.frontline, opponent]);

  const playableHandCards = useMemo(() => {
    if (!isPlayerTurn || (currentPhase !== "main1" && currentPhase !== "main2")) {
      return new Set<Id<"cardInstances">>();
    }
    return new Set(player.hand.map((c) => c.instanceId));
  }, [isPlayerTurn, currentPhase, player.hand]);

  const activatableBackrowCards = useMemo(() => new Set<Id<"cardInstances">>(), []);

  // Mock actions
  const normalSummon = useCallback(
    async (cardInstanceId: Id<"cardInstances">, position: "attack" | "defense") => {
      const card = player.hand.find((c) => c.instanceId === cardInstanceId);
      if (!card) return { success: false, error: "Card not found" };

      const summonedCard: CardInZone = {
        ...card,
        position,
        isFaceDown: false,
        hasAttacked: false,
        zoneIndex: player.support.length,
      };

      setPlayer((prev) => ({
        ...prev,
        hand: prev.hand.filter((c) => c.instanceId !== cardInstanceId),
        handCount: prev.handCount - 1,
        support: [...prev.support, summonedCard],
        normalSummonsRemaining: prev.normalSummonsRemaining - 1,
      }));

      return { success: true };
    },
    [player.hand, player.support.length]
  );

  const setMonster = useCallback(
    async (cardInstanceId: Id<"cardInstances">) => {
      const card = player.hand.find((c) => c.instanceId === cardInstanceId);
      if (!card) return { success: false, error: "Card not found" };

      const setCard: CardInZone = {
        ...card,
        position: "defense",
        isFaceDown: true,
        hasAttacked: false,
        zoneIndex: player.support.length,
      };

      setPlayer((prev) => ({
        ...prev,
        hand: prev.hand.filter((c) => c.instanceId !== cardInstanceId),
        handCount: prev.handCount - 1,
        support: [...prev.support, setCard],
      }));

      return { success: true };
    },
    [player.hand, player.support.length]
  );

  const setSpellTrap = useCallback(
    async (cardInstanceId: Id<"cardInstances">) => {
      const card = player.hand.find((c) => c.instanceId === cardInstanceId);
      if (!card) return { success: false, error: "Card not found" };

      const setCard: CardInZone = {
        ...card,
        isFaceDown: true,
        zoneIndex: player.backrow.length,
      };

      setPlayer((prev) => ({
        ...prev,
        hand: prev.hand.filter((c) => c.instanceId !== cardInstanceId),
        handCount: prev.handCount - 1,
        backrow: [...prev.backrow, setCard],
      }));

      return { success: true };
    },
    [player.hand, player.backrow.length]
  );

  const advancePhase = useCallback(async () => {
    const phases = ["draw", "standby", "main1", "battle", "main2", "end"];
    const currentIndex = phases.indexOf(currentPhase);
    const nextPhase = phases[(currentIndex + 1) % phases.length];
    setCurrentPhase(nextPhase);
    return { success: true };
  }, [currentPhase]);

  const endTurn = useCallback(async () => {
    setCurrentPhase("main1");
    setTurnNumber((prev) => prev + 1);
    setIsPlayerTurn((prev) => !prev);

    // Reset hasAttacked for player's monsters
    setPlayer((prev) => ({
      ...prev,
      frontline: prev.frontline ? { ...prev.frontline, hasAttacked: false } : null,
      support: prev.support.map((c) => ({ ...c, hasAttacked: false })),
      normalSummonsRemaining: 1,
    }));

    return { success: true };
  }, []);

  const declareAttack = useCallback(
    async (attackingCardId: Id<"cardInstances">, _targetCardId?: Id<"cardInstances">) => {
      // Mark attacker as having attacked
      setPlayer((prev) => ({
        ...prev,
        frontline:
          prev.frontline?.instanceId === attackingCardId
            ? { ...prev.frontline, hasAttacked: true }
            : prev.frontline,
        support: prev.support.map((c) =>
          c.instanceId === attackingCardId ? { ...c, hasAttacked: true } : c
        ),
      }));

      return { success: true };
    },
    []
  );

  const forfeitGame = useCallback(async () => {
    return { success: true };
  }, []);

  const activateSpell = useCallback(async () => ({ success: true }), []);
  const activateFieldSpell = useCallback(async () => ({ success: true }), []);
  const activateTrap = useCallback(async () => ({ success: true }), []);
  const respondToChain = useCallback(async () => ({ success: true, chainResolving: false }), []);
  const tributeSummon = useCallback(async () => ({ success: true }), []);
  const evolveMonster = useCallback(async () => ({ success: true }), []);

  return {
    // State
    boardState: { player, opponent, phase, gameStatus: "active", winnerId: null },
    player,
    opponent,
    pendingAction: null,
    chainResponses: null,
    phase,
    validActions,
    attackOptions,

    // Computed
    isLoading: false,
    isPlayerTurn,
    currentPhase,
    isMainPhase: currentPhase === "main1" || currentPhase === "main2",
    isBattlePhase: currentPhase === "battle",
    gameEnded: false,
    winner: null,
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
