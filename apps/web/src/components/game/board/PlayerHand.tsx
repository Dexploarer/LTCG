// @ts-nocheck
// TODO: This file depends on Convex game APIs that have not been implemented yet.
"use client";

import type { Id } from "@convex/_generated/dataModel";
import type { CardInZone } from "../hooks/useGameBoard";
import { HandCard, OpponentHandCard } from "./cards/HandCard";

interface PlayerHandProps {
  cards: CardInZone[];
  handCount: number;
  isOpponent?: boolean;
  playableCards?: Set<Id<"cardInstances">>;
  selectedCard?: Id<"cardInstances"> | null;
  onCardClick?: (card: CardInZone) => void;
}

export function PlayerHand({
  cards,
  handCount,
  isOpponent = false,
  playableCards,
  selectedCard,
  onCardClick,
}: PlayerHandProps) {
  if (isOpponent) {
    return (
      <div className="flex items-center justify-center py-1">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: handCount }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Static opponent hand cards don't reorder
            <OpponentHandCard key={`opponent-hand-${index}`} index={index} totalCards={handCount} />
          ))}
        </div>
        {handCount > 0 && (
          <span className="ml-2 text-[10px] text-muted-foreground">{handCount} cards</span>
        )}
      </div>
    );
  }

  return (
    <div className="relative py-2 px-1 sm:py-3 sm:px-4 overflow-visible">
      <div className="flex items-end justify-center pb-1 pt-1">
        {cards.map((card, index) => (
          <HandCard
            key={card.instanceId}
            card={card}
            index={index}
            totalCards={cards.length}
            isPlayable={playableCards?.has(card.instanceId) ?? false}
            isSelected={selectedCard === card.instanceId}
            onClick={() => onCardClick?.(card)}
          />
        ))}
      </div>
    </div>
  );
}
