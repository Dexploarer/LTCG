// @ts-nocheck
// TODO: This file depends on Convex game APIs that have not been implemented yet.
"use client";

import type { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import type { CardInZone } from "../../hooks/useGameBoard";
import { BoardCard, EmptySlot } from "../cards/BoardCard";

interface MonsterZoneProps {
  frontline: CardInZone | null;
  support: CardInZone[];
  isOpponent?: boolean;
  selectedCard?: Id<"cardInstances"> | null;
  targetableCards?: Set<Id<"cardInstances">>;
  attackingCard?: Id<"cardInstances"> | null;
  attackableCards?: Set<Id<"cardInstances">>;
  onCardClick?: (card: CardInZone) => void;
  onCardAttack?: (card: CardInZone) => void;
  onEmptySlotClick?: (zone: "frontline" | "support", index?: number) => void;
}

export function MonsterZone({
  frontline,
  support,
  isOpponent = false,
  selectedCard,
  targetableCards = new Set<Id<"cardInstances">>(),
  attackingCard,
  attackableCards = new Set<Id<"cardInstances">>(),
  onCardClick,
  onCardAttack,
  onEmptySlotClick,
}: MonsterZoneProps) {
  // Support zone has 4 slots max
  const supportSlots = Array.from({ length: 4 }, (_, i) => support[i] ?? null);

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 sm:gap-1",
        isOpponent ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Support Zone (4 slots) */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[8px] sm:text-[10px] font-medium uppercase tracking-wider text-slate-500">
          Support
        </span>
        <div className="flex gap-0.5">
          {supportSlots.map((card, index) => {
            const key = `support-slot-${index}`;
            return card ? (
              <BoardCard
                key={key}
                card={card}
                size="sm"
                isSelected={selectedCard === card.instanceId}
                isTargetable={targetableCards.has(card.instanceId)}
                isAttacking={attackingCard === card.instanceId}
                canAttack={attackableCards.has(card.instanceId)}
                onAttack={() => onCardAttack?.(card)}
                onClick={() => onCardClick?.(card)}
              />
            ) : (
              <EmptySlot
                key={key}
                size="sm"
                label={!isOpponent ? "" : undefined}
                onClick={!isOpponent ? () => onEmptySlotClick?.("support", index) : undefined}
              />
            );
          })}
        </div>
      </div>

      {/* Frontline (1 slot, larger) */}
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn(
            "text-[8px] sm:text-[10px] font-bold uppercase tracking-wider",
            frontline ? "text-orange-400" : "text-slate-500"
          )}
        >
          Front
        </span>
        {frontline ? (
          <BoardCard
            card={frontline}
            size="md"
            isSelected={selectedCard === frontline.instanceId}
            isTargetable={targetableCards.has(frontline.instanceId)}
            isAttacking={attackingCard === frontline.instanceId}
            canAttack={attackableCards.has(frontline.instanceId)}
            onAttack={() => onCardAttack?.(frontline)}
            onClick={() => onCardClick?.(frontline)}
          />
        ) : (
          <EmptySlot
            size="md"
            highlighted={!isOpponent}
            onClick={!isOpponent ? () => onEmptySlotClick?.("frontline") : undefined}
          />
        )}
      </div>
    </div>
  );
}
