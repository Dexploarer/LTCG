/**
 * Profile Component Constants
 * Configuration constants for ranks, elements, rarities, and badges
 */

import {
  Crown,
  Droplets,
  Flame,
  Heart,
  Medal,
  Mountain,
  Star,
  Swords,
  Target,
  Wind,
  Zap,
} from "lucide-react";

export const RANK_COLORS: Record<
  "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Master" | "Legend",
  { text: string; bg: string; border: string }
> = {
  Bronze: { text: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/30" },
  Silver: { text: "text-gray-300", bg: "bg-gray-400/20", border: "border-gray-400/30" },
  Gold: { text: "text-yellow-500", bg: "bg-yellow-500/20", border: "border-yellow-500/30" },
  Platinum: { text: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30" },
  Diamond: { text: "text-cyan-400", bg: "bg-cyan-500/20", border: "border-cyan-500/30" },
  Master: { text: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30" },
  Legend: { text: "text-yellow-400", bg: "bg-yellow-400/20", border: "border-yellow-400/30" },
};

export const ELEMENT_CONFIG = {
  fire: { icon: Flame, color: "text-orange-400", bg: "bg-orange-500/20" },
  water: { icon: Droplets, color: "text-blue-400", bg: "bg-blue-500/20" },
  earth: { icon: Mountain, color: "text-amber-600", bg: "bg-amber-600/20" },
  wind: { icon: Wind, color: "text-emerald-400", bg: "bg-emerald-500/20" },
};

export const RARITY_CONFIG = {
  common: { color: "text-gray-400", border: "border-gray-500/30", glow: "" },
  rare: { color: "text-blue-400", border: "border-blue-500/50", glow: "shadow-blue-500/20" },
  epic: { color: "text-purple-400", border: "border-purple-500/50", glow: "shadow-purple-500/20" },
  legendary: {
    color: "text-yellow-400",
    border: "border-yellow-500/50",
    glow: "shadow-yellow-500/30 shadow-lg",
  },
};

export const BADGE_ICONS: Record<string, typeof Crown> = {
  crown: Crown,
  flame: Flame,
  swords: Swords,
  star: Star,
  zap: Zap,
  heart: Heart,
  target: Target,
  medal: Medal,
};
