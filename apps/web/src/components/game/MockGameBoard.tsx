// @ts-nocheck
// TODO: This file uses mock Convex types that need to be updated when backend is ready.
"use client";

import type { Id } from "@convex/_generated/dataModel";
import { ChevronLeft, Flag, Loader2, Trophy, XCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { LifePointsBar } from "./board/LifePointsBar";
import { OpponentBoard } from "./board/OpponentBoard";
import { PlayerBoard } from "./board/PlayerBoard";
import { PlayerHand } from "./board/PlayerHand";
import { ActionButtons } from "./controls/ActionButtons";
import { PhaseBar } from "./controls/PhaseBar";
import { ActivateCardModal } from "./dialogs/ActivateCardModal";
import { AttackModal } from "./dialogs/AttackModal";
import { CardInspectorModal } from "./dialogs/CardInspectorModal";
import { ForfeitDialog } from "./dialogs/ForfeitDialog";
import { SummonModal } from "./dialogs/SummonModal";
import type { CardInZone } from "./hooks/useGameBoard";
import { useMockGameBoard } from "./hooks/useMockGameBoard";

interface MockGameBoardProps {
  chapterId: string;
  stageNumber: string;
  onGameEnd?: () => void;
}

export function MockGameBoard({ chapterId, stageNumber, onGameEnd }: MockGameBoardProps) {
  const {
    // State
    player,
    opponent,
    phase,
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
    activateSpell,
    activateFieldSpell,
    activateTrap,
  } = useMockGameBoard();

  // UI State
  const [selectedHandCard, setSelectedHandCard] = useState<CardInZone | null>(null);
  const [selectedFieldCard, setSelectedFieldCard] = useState<CardInZone | null>(null);
  const [selectedBackrowCard, setSelectedBackrowCard] = useState<CardInZone | null>(null);
  const [inspectedCard, setInspectedCard] = useState<CardInZone | null>(null);
  const [isInspectedOpponent, setIsInspectedOpponent] = useState(false);
  const [showSummonModal, setShowSummonModal] = useState(false);
  const [showAttackModal, setShowAttackModal] = useState(false);
  const [showForfeitDialog, setShowForfeitDialog] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showCardInspector, setShowCardInspector] = useState(false);
  const [isForfeitLoading, setIsForfeitLoading] = useState(false);

  const attackableAttackers = useMemo(() => {
    if (!attackOptions) return new Set<Id<"cardInstances">>();
    return new Set(
      attackOptions.filter((option) => option.canAttack).map((option) => option.instanceId)
    );
  }, [attackOptions]);

  const selectedAttackOption = useMemo(() => {
    if (!attackOptions || !selectedFieldCard) return null;
    return (
      attackOptions.find((option) => option.instanceId === selectedFieldCard.instanceId) ?? null
    );
  }, [attackOptions, selectedFieldCard]);

  const targetableCards = useMemo(() => {
    if (!isBattlePhase || !selectedAttackOption || !selectedAttackOption.canAttack) {
      return new Set<Id<"cardInstances">>();
    }
    return new Set(selectedAttackOption.validTargets);
  }, [isBattlePhase, selectedAttackOption]);

  const attackTargets = useMemo(() => {
    if (!selectedAttackOption || !opponent) return [];
    const opponentField = new Map<Id<"cardInstances">, CardInZone>();
    if (opponent.frontline) {
      opponentField.set(opponent.frontline.instanceId, opponent.frontline);
    }
    for (const card of opponent.support) {
      opponentField.set(card.instanceId, card);
    }

    return selectedAttackOption.validTargets.flatMap((targetId) => {
      const card = opponentField.get(targetId);
      if (!card) return [];
      return [
        {
          instanceId: card.instanceId,
          name: card.name,
          attack: card.monsterStats?.attack,
          defense: card.monsterStats?.defense,
          position: card.position ?? (card.isFaceDown ? "setDefense" : "attack"),
          isFaceDown: card.isFaceDown,
        },
      ];
    });
  }, [selectedAttackOption, opponent]);

  const canAttack = useMemo(() => {
    return attackOptions?.some((option) => option.canAttack) ?? false;
  }, [attackOptions]);

  const defaultAttacker = useMemo(() => {
    if (!player || attackableAttackers.size === 0) return null;
    if (player.frontline && attackableAttackers.has(player.frontline.instanceId)) {
      return player.frontline;
    }
    return player.support.find((card) => attackableAttackers.has(card.instanceId)) ?? null;
  }, [player, attackableAttackers]);

  const handleDeclareAttack = useCallback(
    async (targetId?: Id<"cardInstances">) => {
      if (!selectedFieldCard) return;

      const result = await declareAttack(selectedFieldCard.instanceId, targetId);

      if (result.success) {
        setSelectedFieldCard(null);
        setShowAttackModal(false);
      }
    },
    [selectedFieldCard, declareAttack]
  );

  const handleHandCardClick = useCallback(
    (card: CardInZone) => {
      if (!isPlayerTurn || !isMainPhase) {
        return;
      }

      if (playableHandCards.has(card.instanceId)) {
        setSelectedHandCard(card);
        setShowSummonModal(true);
      }
    },
    [isPlayerTurn, isMainPhase, playableHandCards]
  );

  const handleFieldCardClick = useCallback(
    (card: CardInZone) => {
      if (isBattlePhase && isPlayerTurn && attackableAttackers.has(card.instanceId)) {
        setSelectedFieldCard(card);
        setShowAttackModal(true);
        return;
      }

      if (isBattlePhase && selectedFieldCard && targetableCards.has(card.instanceId)) {
        handleDeclareAttack(card.instanceId);
        return;
      }

      if (!card.isFaceDown) {
        setInspectedCard(card);
        const isOpponentCard =
          opponent?.frontline?.instanceId === card.instanceId ||
          opponent?.support?.some((c) => c.instanceId === card.instanceId) ||
          opponent?.backrow?.some((c) => c.instanceId === card.instanceId);
        setIsInspectedOpponent(isOpponentCard ?? false);
        setShowCardInspector(true);
        return;
      }

      setSelectedFieldCard((prev) => (prev?.instanceId === card.instanceId ? null : card));
    },
    [
      isBattlePhase,
      isPlayerTurn,
      opponent,
      attackableAttackers,
      selectedFieldCard,
      targetableCards,
      handleDeclareAttack,
    ]
  );

  const handleSummon = useCallback(
    async (position: "attack" | "defense") => {
      if (!selectedHandCard) return;

      const result = await normalSummon(selectedHandCard.instanceId, position);

      if (result.success) {
        setSelectedHandCard(null);
        setShowSummonModal(false);
      }
    },
    [selectedHandCard, normalSummon]
  );

  const handleSetMonster = useCallback(async () => {
    if (!selectedHandCard) return;

    const result = await setMonster(selectedHandCard.instanceId);

    if (result.success) {
      setSelectedHandCard(null);
      setShowSummonModal(false);
    }
  }, [selectedHandCard, setMonster]);

  const handleSetSpellTrap = useCallback(async () => {
    if (!selectedHandCard) return;

    const result = await setSpellTrap(selectedHandCard.instanceId);

    if (result.success) {
      setSelectedHandCard(null);
      setShowSummonModal(false);
    }
  }, [selectedHandCard, setSpellTrap]);

  const handleHandCardActivate = useCallback(async () => {
    if (!selectedHandCard) return;

    let result: { success: boolean };
    if (selectedHandCard.cardType === "field") {
      result = await activateFieldSpell(selectedHandCard.instanceId);
    } else {
      result = await activateSpell(selectedHandCard.instanceId);
    }

    if (result.success) {
      setSelectedHandCard(null);
      setShowSummonModal(false);
    }
  }, [selectedHandCard, activateSpell, activateFieldSpell]);

  const handleAdvancePhase = useCallback(async () => {
    await advancePhase();
  }, [advancePhase]);

  const handleEndTurn = useCallback(async () => {
    await endTurn();
  }, [endTurn]);

  const handleForfeit = useCallback(async () => {
    setIsForfeitLoading(true);
    try {
      await forfeitGame();
      onGameEnd?.();
    } finally {
      setIsForfeitLoading(false);
      setShowForfeitDialog(false);
    }
  }, [forfeitGame, onGameEnd]);

  const handleBackrowCardClick = useCallback((card: CardInZone) => {
    setSelectedBackrowCard(card);
    setShowActivateModal(true);
  }, []);

  const handleActivateCard = useCallback(
    async (effectIndex?: number) => {
      if (!selectedBackrowCard) return;

      const isField = selectedBackrowCard.cardType === "field";
      const isSpell =
        selectedBackrowCard.cardType === "spell" || selectedBackrowCard.cardType === "equipment";
      const isTrap = selectedBackrowCard.cardType === "trap";

      let result: { success: boolean } | undefined;
      if (isField) {
        result = await activateFieldSpell(selectedBackrowCard.instanceId, effectIndex);
      } else if (isSpell) {
        result = await activateSpell(selectedBackrowCard.instanceId, effectIndex);
      } else if (isTrap) {
        result = await activateTrap(selectedBackrowCard.instanceId, effectIndex);
      }

      if (result?.success) {
        setSelectedBackrowCard(null);
        setShowActivateModal(false);
      }
    },
    [selectedBackrowCard, activateSpell, activateFieldSpell, activateTrap]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0d0a09]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading game...</span>
        </div>
      </div>
    );
  }

  // Game ended state
  if (gameEnded) {
    const isWinner = winner === "player";
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0d0a09]">
        <div className="flex flex-col items-center gap-3 text-center p-6 rounded-xl border bg-background">
          {isWinner ? (
            <>
              <Trophy className="h-12 w-12 text-yellow-500" />
              <h2 className="text-xl font-bold text-green-500">Victory!</h2>
              <p className="text-sm text-muted-foreground">Congratulations, you won the game!</p>
            </>
          ) : (
            <>
              <XCircle className="h-12 w-12 text-red-500" />
              <h2 className="text-xl font-bold text-red-500">Defeat</h2>
              <p className="text-sm text-muted-foreground">Better luck next time!</p>
            </>
          )}
          <Button asChild className="mt-3" size="sm">
            <Link href={`/play/story/${chapterId}`}>Return to Chapter</Link>
          </Button>
        </div>
      </div>
    );
  }

  // No data state
  if (!player || !opponent || !phase) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0d0a09]">
        <div className="text-xs text-muted-foreground">Game data not available</div>
      </div>
    );
  }

  // Determine summon options
  const selectedId = selectedHandCard?.instanceId;
  const canSummonAttack =
    selectedId &&
    validActions?.canNormalSummon &&
    validActions.summonableMonsters?.includes(selectedId) === true;
  const canSummonDefense = canSummonAttack;
  const canSetMonsterCard =
    selectedId &&
    validActions?.canSetMonster &&
    validActions.settableMonsters?.includes(selectedId) === true;
  const canSetSpellTrapCard =
    selectedId &&
    validActions?.canSetSpellTrap &&
    validActions.settableSpellTraps?.includes(selectedId) === true;

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative flex flex-col">
      {/* Decorative Overlay */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* Game Content Container - full height, no scroll */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top Bar: Exit + Opponent Life Points + Forfeit Button */}
        <div className="px-2 pt-2 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/play/story/${chapterId}`}
              className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Exit
            </Link>
            <LifePointsBar
              playerName={`Stage ${stageNumber}`}
              lifePoints={opponent.lifePoints}
              maxLifePoints={opponent.maxLifePoints}
              isOpponent
              isActive={!isPlayerTurn}
              isAi={opponent.playerType === "ai"}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForfeitDialog(true)}
            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 text-[10px] h-7 px-2"
          >
            <Flag className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Forfeit</span>
          </Button>
        </div>

        {/* Opponent Hand */}
        <div className="shrink-0">
          <PlayerHand cards={[]} handCount={opponent.handCount} isOpponent />
        </div>

        {/* Opponent Board */}
        <div className="border-b border-slate-700/50 shrink-0">
          <OpponentBoard
            board={opponent}
            selectedCard={selectedFieldCard?.instanceId}
            targetableCards={targetableCards}
            onCardClick={handleFieldCardClick}
          />
        </div>

        {/* Phase Bar (Center) */}
        <div className="px-2 py-1 border-y border-white/5 bg-black/40 backdrop-blur-sm shrink-0">
          <PhaseBar
            currentPhase={currentPhase}
            turnNumber={phase.turnNumber}
            isPlayerTurn={isPlayerTurn}
            canAdvancePhase={validActions?.canAdvancePhase ?? false}
            onAdvancePhase={handleAdvancePhase}
          />
        </div>

        {/* Player Board */}
        <div className="border-b border-white/5 shrink-0">
          <PlayerBoard
            board={player}
            selectedCard={selectedFieldCard?.instanceId}
            attackingCard={phase.attackingCardId}
            targetableCards={targetableCards}
            onCardClick={handleFieldCardClick}
            onEmptyBackrowClick={handleSetSpellTrap}
            activatableBackrowCards={activatableBackrowCards}
            onBackrowCardClick={handleBackrowCardClick}
          />
        </div>

        {/* Player Hand - flexible, takes remaining space */}
        <div className="flex-1 min-h-0 border-b border-white/5 bg-black/20 overflow-visible relative">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent pointer-events-none" />
          <PlayerHand
            cards={player.hand}
            handCount={player.hand.length}
            playableCards={playableHandCards}
            selectedCard={selectedHandCard?.instanceId}
            onCardClick={handleHandCardClick}
          />
        </div>

        {/* Player Life Points & Actions */}
        <div className="px-2 py-1.5 flex items-center justify-between gap-2 shrink-0">
          <LifePointsBar
            playerName={player.playerName}
            lifePoints={player.lifePoints}
            maxLifePoints={player.maxLifePoints}
            isActive={isPlayerTurn}
          />

          <ActionButtons
            isPlayerTurn={isPlayerTurn}
            isBattlePhase={isBattlePhase}
            canAttack={canAttack}
            canEndTurn={validActions?.canEndTurn ?? false}
            onEndTurn={handleEndTurn}
            onAttack={() => {
              if (defaultAttacker) {
                setSelectedFieldCard(defaultAttacker);
                setShowAttackModal(true);
              }
            }}
          />
        </div>

        {/* Modals */}
        <SummonModal
          isOpen={showSummonModal}
          card={selectedHandCard}
          canSummonAttack={canSummonAttack ?? false}
          canSummonDefense={canSummonDefense ?? false}
          canSet={
            selectedHandCard?.cardType === "monster"
              ? (canSetMonsterCard ?? false)
              : (canSetSpellTrapCard ?? false)
          }
          canActivate={
            selectedId
              ? ((validActions?.activatableSpells?.includes(selectedId) ||
                  validActions?.activatableFieldCards?.includes(selectedId)) ??
                false)
              : false
          }
          onSummon={handleSummon}
          onSet={selectedHandCard?.cardType === "monster" ? handleSetMonster : handleSetSpellTrap}
          onActivate={handleHandCardActivate}
          onClose={() => {
            setShowSummonModal(false);
            setSelectedHandCard(null);
          }}
        />

        <AttackModal
          isOpen={showAttackModal}
          attacker={selectedAttackOption}
          targets={attackTargets}
          canDirectAttack={selectedAttackOption?.canDirectAttack ?? false}
          onSelectTarget={handleDeclareAttack}
          onClose={() => {
            setShowAttackModal(false);
            setSelectedFieldCard(null);
          }}
        />

        <ForfeitDialog
          isOpen={showForfeitDialog}
          onConfirm={handleForfeit}
          onCancel={() => setShowForfeitDialog(false)}
          isLoading={isForfeitLoading}
        />

        <ActivateCardModal
          isOpen={showActivateModal}
          card={selectedBackrowCard}
          canActivate={
            selectedBackrowCard
              ? activatableBackrowCards.has(selectedBackrowCard.instanceId)
              : false
          }
          onActivate={handleActivateCard}
          onClose={() => {
            setShowActivateModal(false);
            setSelectedBackrowCard(null);
          }}
        />

        <CardInspectorModal
          isOpen={showCardInspector}
          card={inspectedCard}
          isOpponentCard={isInspectedOpponent}
          onClose={() => {
            setShowCardInspector(false);
            setInspectedCard(null);
          }}
        />
      </div>
    </div>
  );
}
