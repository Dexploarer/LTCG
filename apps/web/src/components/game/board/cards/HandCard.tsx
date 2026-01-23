"use client";

import { motion } from "framer-motion";
import { FlaskConical, Shield, Sparkles, Sword, Zap } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CardInZone } from "../../hooks/useGameBoard";

interface HandCardProps {
  card: CardInZone;
  index: number;
  totalCards: number;
  onClick?: () => void;
  isPlayable?: boolean;
  isSelected?: boolean;
}

const RARITY_COLORS: Record<string, { border: string; glow: string }> = {
  common: { border: "border-gray-500", glow: "" },
  uncommon: { border: "border-green-500", glow: "shadow-green-500/30" },
  rare: { border: "border-blue-500", glow: "shadow-blue-500/40" },
  epic: { border: "border-purple-500", glow: "shadow-purple-500/50" },
  legendary: { border: "border-yellow-500", glow: "shadow-yellow-500/50" },
};

const CARD_TYPE_COLORS: Record<string, string> = {
  monster: "from-orange-900/80 to-orange-950/80",
  spell: "from-green-900/80 to-green-950/80",
  trap: "from-purple-900/80 to-purple-950/80",
  field: "from-teal-900/80 to-teal-950/80",
};

export function HandCard({
  card,
  index,
  totalCards,
  onClick,
  isPlayable = false,
  isSelected = false,
}: HandCardProps) {
  // Fan effect - cards spread out from center
  const centerIndex = (totalCards - 1) / 2;
  const offsetFromCenter = index - centerIndex;
  const rotation = offsetFromCenter * 3; // 3 degrees per card from center
  const translateY = Math.abs(offsetFromCenter) * 2; // Slight arc

  const colors = RARITY_COLORS[card.rarity] ?? { border: "border-gray-500", glow: "" };
  const bgColor =
    CARD_TYPE_COLORS[card.cardType ?? "monster"] ?? "from-orange-900/80 to-orange-950/80";

  const effectiveAttack = card.monsterStats
    ? card.monsterStats.attack + (card.attackModifier ?? 0)
    : 0;
  const effectiveDefense = card.monsterStats
    ? card.monsterStats.defense + (card.defenseModifier ?? 0)
    : 0;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: 1,
        y: translateY,
        rotate: rotation,
        zIndex: index + 1,
      }}
      whileHover={{
        scale: 1.12,
        y: -15,
        rotate: 0,
        zIndex: 100,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 1.08 }}
      className={cn(
        "relative w-12 h-16 sm:w-14 sm:h-20 rounded-lg border-2 transition-shadow duration-200",
        "bg-gradient-to-br",
        bgColor,
        colors.border,
        colors.glow && `shadow-lg ${colors.glow}`,
        isSelected && "ring-2 ring-yellow-400 ring-offset-1 ring-offset-slate-900 z-50",
        isPlayable &&
          !isSelected &&
          "ring-2 ring-green-400 shadow-lg shadow-green-500/50 animate-pulse",
        !isPlayable && "opacity-70",
        onClick ? "cursor-pointer" : "cursor-default"
      )}
      style={{
        transformOrigin: "bottom center",
        marginLeft: index > 0 ? "-0.25rem" : "0",
      }}
    >
      {/* Card image */}
      <div className="absolute inset-0.5 rounded overflow-hidden bg-slate-800 relative">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 56px, 80px"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center p-0.5">
            {card.cardType === "monster" ? (
              <Sparkles className="w-4 h-4 text-slate-500" />
            ) : card.cardType === "spell" ? (
              <FlaskConical className="w-4 h-4 text-green-500/50" />
            ) : (
              <Zap className="w-4 h-4 text-purple-500/50" />
            )}
          </div>
        )}
      </div>

      {/* Card name banner */}
      <div className="absolute top-0.5 left-0.5 right-0.5 bg-black/70 rounded px-0.5 py-0.5">
        <p className="text-[8px] font-semibold text-white truncate">{card.name}</p>
      </div>

      {/* Card type badge */}
      <div
        className={cn(
          "absolute top-4 right-0.5 px-0.5 py-0.5 rounded text-[6px] font-bold uppercase",
          card.cardType === "monster" && "bg-orange-600 text-white",
          card.cardType === "spell" && "bg-green-600 text-white",
          card.cardType === "trap" && "bg-purple-600 text-white",
          card.cardType === "field" && "bg-teal-600 text-white"
        )}
      >
        {card.cardType}
      </div>

      {/* Monster stats */}
      {card.monsterStats && (
        <div className="absolute bottom-0.5 left-0.5 right-0.5 bg-black/80 rounded px-0.5 py-0.5 flex justify-between">
          <span className="text-[8px] font-bold text-red-400 flex items-center gap-0.5">
            <Sword className="w-2 h-2" />
            {effectiveAttack}
          </span>
          <span className="text-[8px] font-bold text-blue-400 flex items-center gap-0.5">
            <Shield className="w-2 h-2" />
            {effectiveDefense}
          </span>
        </div>
      )}

      {/* Level indicator for monsters */}
      {card.monsterStats && (
        <div className="absolute top-4 left-0.5 flex items-center gap-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <span className="text-[6px] text-yellow-400 font-bold">Lv.{card.monsterStats.level}</span>
        </div>
      )}

      {/* Playable indicator */}
      {isPlayable && (
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[6px] px-1 py-0.5 rounded-full font-bold shadow-lg shadow-green-500/50">
          PLAY
        </div>
      )}

      {/* Rarity indicator */}
      <div
        className={cn(
          "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
          card.rarity === "legendary" && "bg-yellow-400",
          card.rarity === "epic" && "bg-purple-500",
          card.rarity === "rare" && "bg-blue-500",
          card.rarity === "uncommon" && "bg-green-500",
          card.rarity === "common" && "bg-gray-400"
        )}
      />
    </motion.button>
  );
}

// Opponent's hand (face-down cards)
export function OpponentHandCard({ index, totalCards }: { index: number; totalCards: number }) {
  const centerIndex = (totalCards - 1) / 2;
  const offsetFromCenter = index - centerIndex;
  const rotation = offsetFromCenter * 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      className="w-8 h-11 rounded-md bg-gradient-to-br from-indigo-900 to-purple-900 border-2 border-indigo-500/50 flex items-center justify-center"
      style={{
        transformOrigin: "top center",
        marginLeft: index > 0 ? "-0.25rem" : "0",
      }}
    >
      <div className="w-3 h-3 rounded-full bg-indigo-500/30 flex items-center justify-center">
        <Sparkles className="w-2 h-2 text-indigo-300" />
      </div>
    </motion.div>
  );
}
