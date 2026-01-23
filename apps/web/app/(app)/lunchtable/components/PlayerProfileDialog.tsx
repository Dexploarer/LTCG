"use client";

import {
  Bot,
  Crown,
  Droplets,
  Flame,
  Gamepad2,
  Heart,
  Medal,
  Mountain,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChallengeConfirmDialog } from "./ChallengeConfirmDialog";

// Social icons (simplified)
const TwitterIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DiscordIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
  </svg>
);

const TwitchIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
  </svg>
);

// Detail popup types
type DetailType = "badge" | "achievement" | "card";

interface DetailItem {
  type: DetailType;
  id: string;
  name: string;
  description: string;
  icon?: string;
  element?: "fire" | "water" | "earth" | "wind";
  rarity?: "common" | "rare" | "epic" | "legendary";
  earnedAt?: number;
  progress?: number;
  maxProgress?: number;
  // Card specific
  attack?: number;
  defense?: number;
  cost?: number;
  ability?: string;
  flavorText?: string;
  timesPlayed?: number;
}

// Extended mock data for cards
const MOCK_CARD_DETAILS: Record<string, Partial<DetailItem>> = {
  "card-1": {
    attack: 7,
    defense: 4,
    cost: 5,
    ability: "When this card enters play, deal 3 damage to all enemy creatures.",
    flavorText: '"The skies burn red when the drake awakens." - Fire Sage Pyralis',
  },
  "card-2": {
    attack: 9,
    defense: 6,
    cost: 8,
    ability:
      "Resurrection: When this card is destroyed, return it to play with half its original stats at the end of your next turn.",
    flavorText: '"From ashes, glory rises eternal." - The Phoenix Codex',
  },
};

// Extended badge details
const MOCK_BADGE_DETAILS: Record<string, { howToEarn: string; rarity: string }> = {
  "badge-1": {
    howToEarn: "Complete all 5 chapters of the main story campaign, defeating all boss encounters.",
    rarity: "Epic",
  },
  "badge-2": {
    howToEarn: "Win 100 ranked or casual matches using a deck with at least 20 fire element cards.",
    rarity: "Rare",
  },
  "badge-3": {
    howToEarn: "Win your very first ranked match against another player.",
    rarity: "Common",
  },
};

// Extended achievement details
const MOCK_ACHIEVEMENT_DETAILS: Record<string, { howToComplete: string; reward: string }> = {
  "ach-1": {
    howToComplete:
      "Collect unique cards through packs, crafting, or trading. Duplicates don't count.",
    reward: "500 Gold + Exclusive Card Back",
  },
  "ach-2": {
    howToComplete: "Win 10 consecutive matches in ranked or casual mode without losing.",
    reward: '"Unstoppable" Title + 1000 Gold',
  },
  "ach-3": {
    howToComplete: "Send and accept friend requests to build your network of allies.",
    reward: '"Social Star" Badge + 250 Gold',
  },
};

interface PlayerProfile {
  id: string;
  username: string;
  rank: {
    casual: { tier: string; division: number };
    ranked: { tier: string; division: number; lp: number };
  };
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    winStreak: number;
    longestWinStreak: number;
  };
  socials: {
    twitter?: string;
    discord?: string;
    twitch?: string;
  };
  agents: Array<{
    id: string;
    name: string;
    avatar: string;
    wins: number;
    losses: number;
    personality: string;
  }>;
  mostPlayedCard: {
    id: string;
    name: string;
    element: "fire" | "water" | "earth" | "wind";
    timesPlayed: number;
  };
  callingCard: {
    id: string;
    name: string;
    element: "fire" | "water" | "earth" | "wind";
    rarity: "common" | "rare" | "epic" | "legendary";
  } | null;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: number;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    progress?: number;
    maxProgress?: number;
  }>;
  joinedAt: number;
  status: "online" | "in_game" | "idle" | "offline";
}

// Mock profile data
const MOCK_PROFILE: PlayerProfile = {
  id: "1",
  username: "DragonSlayer",
  rank: {
    casual: { tier: "Diamond", division: 2 },
    ranked: { tier: "Master", division: 1, lp: 78 },
  },
  stats: {
    totalGames: 342,
    wins: 198,
    losses: 144,
    winStreak: 5,
    longestWinStreak: 12,
  },
  socials: {
    twitter: "dragonslayer_tcg",
    discord: "DragonSlayer#1234",
    twitch: "dragonslayer_live",
  },
  agents: [
    {
      id: "agent-1",
      name: "Pyro",
      avatar: "🔥",
      wins: 45,
      losses: 23,
      personality: "Aggressive",
    },
  ],
  mostPlayedCard: {
    id: "card-1",
    name: "Inferno Drake",
    element: "fire",
    timesPlayed: 892,
  },
  callingCard: {
    id: "card-2",
    name: "Phoenix Ascendant",
    element: "fire",
    rarity: "legendary",
  },
  badges: [
    {
      id: "badge-1",
      name: "Story Champion",
      description: "Completed the main story campaign",
      icon: "crown",
      earnedAt: Date.now() - 86400000 * 30,
    },
    {
      id: "badge-2",
      name: "Fire Master",
      description: "Win 100 games with fire decks",
      icon: "flame",
      earnedAt: Date.now() - 86400000 * 15,
    },
    {
      id: "badge-3",
      name: "First Blood",
      description: "Win your first ranked match",
      icon: "swords",
      earnedAt: Date.now() - 86400000 * 60,
    },
  ],
  achievements: [
    {
      id: "ach-1",
      name: "Card Collector",
      description: "Collect 500 unique cards",
      icon: "star",
      progress: 423,
      maxProgress: 500,
    },
    {
      id: "ach-2",
      name: "Streak Demon",
      description: "Achieve a 10-game win streak",
      icon: "zap",
    },
    {
      id: "ach-3",
      name: "Social Butterfly",
      description: "Add 50 friends",
      icon: "heart",
      progress: 34,
      maxProgress: 50,
    },
  ],
  joinedAt: Date.now() - 86400000 * 120,
  status: "online",
};

const RANK_COLORS: Record<
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

const ELEMENT_CONFIG = {
  fire: { icon: Flame, color: "text-orange-400", bg: "bg-orange-500/20" },
  water: { icon: Droplets, color: "text-blue-400", bg: "bg-blue-500/20" },
  earth: { icon: Mountain, color: "text-amber-600", bg: "bg-amber-600/20" },
  wind: { icon: Wind, color: "text-emerald-400", bg: "bg-emerald-500/20" },
};

const RARITY_CONFIG = {
  common: { color: "text-gray-400", border: "border-gray-500/30", glow: "" },
  rare: { color: "text-blue-400", border: "border-blue-500/50", glow: "shadow-blue-500/20" },
  epic: { color: "text-purple-400", border: "border-purple-500/50", glow: "shadow-purple-500/20" },
  legendary: {
    color: "text-yellow-400",
    border: "border-yellow-500/50",
    glow: "shadow-yellow-500/30 shadow-lg",
  },
};

const BADGE_ICONS: Record<string, typeof Crown> = {
  crown: Crown,
  flame: Flame,
  swords: Swords,
  star: Star,
  zap: Zap,
  heart: Heart,
  target: Target,
  medal: Medal,
};

interface PlayerProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export function PlayerProfileDialog({ isOpen, onClose, username }: PlayerProfileDialogProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "badges" | "agents">("stats");
  const [selectedDetail, setSelectedDetail] = useState<DetailItem | null>(null);
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);

  // In real implementation, fetch profile by username
  const profile = { ...MOCK_PROFILE, username };

  const handleChallengeConfirm = (mode: "casual" | "ranked") => {
    // TODO: Send challenge via Convex
    console.log(`Challenging ${username} to ${mode} match`);
    setShowChallengeDialog(false);
  };

  // Handlers for opening detail views
  const openCardDetail = (
    card: {
      id: string;
      name: string;
      element: "fire" | "water" | "earth" | "wind";
      rarity?: "common" | "rare" | "epic" | "legendary";
      timesPlayed?: number;
    },
    isCallingCard: boolean
  ) => {
    const details = MOCK_CARD_DETAILS[card.id] || {};
    setSelectedDetail({
      type: "card",
      id: card.id,
      name: card.name,
      description: isCallingCard
        ? "This player's signature card - their calling card that represents their playstyle."
        : "This player's most frequently used card in battle.",
      element: card.element,
      rarity: card.rarity,
      timesPlayed: card.timesPlayed,
      ...details,
    });
  };

  const openBadgeDetail = (badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: number;
  }) => {
    const details = MOCK_BADGE_DETAILS[badge.id] || {
      howToEarn: "Complete the required challenge.",
      rarity: "Common",
    };
    setSelectedDetail({
      type: "badge",
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      earnedAt: badge.earnedAt,
      flavorText: details.howToEarn,
      rarity: details.rarity as "common" | "rare" | "epic" | "legendary",
    });
  };

  const openAchievementDetail = (ach: {
    id: string;
    name: string;
    description: string;
    icon: string;
    progress?: number;
    maxProgress?: number;
  }) => {
    const details = MOCK_ACHIEVEMENT_DETAILS[ach.id] || {
      howToComplete: "Complete the objective.",
      reward: "Gold",
    };
    setSelectedDetail({
      type: "achievement",
      id: ach.id,
      name: ach.name,
      description: ach.description,
      icon: ach.icon,
      progress: ach.progress,
      maxProgress: ach.maxProgress,
      flavorText: details.howToComplete,
      ability: details.reward,
    });
  };

  if (!isOpen) return null;

  const winRate = ((profile.stats.wins / profile.stats.totalGames) * 100).toFixed(1);
  const rankColors =
    RANK_COLORS[profile.rank.ranked.tier as keyof typeof RANK_COLORS] || RANK_COLORS.Bronze;

  return (
    <>
      {/* Backdrop */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Backdrop overlay for modal */}
      <div
        role="presentation"
        className="fixed inset-0 z-80 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-85 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl tcg-chat-leather border border-[#3d2b1f] shadow-2xl pointer-events-auto animate-in zoom-in-95 fade-in duration-300">
          {/* Decorative corners */}
          <div className="ornament-corner ornament-corner-tl" />
          <div className="ornament-corner ornament-corner-tr" />
          <div className="ornament-corner ornament-corner-bl" />
          <div className="ornament-corner ornament-corner-br" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg border border-[#3d2b1f] bg-black/50 text-[#a89f94] hover:text-[#e8e0d5] hover:border-[#d4af37]/50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header - Profile Banner */}
          <div className="relative p-6 pb-4 bg-linear-to-b from-[#1a1614] to-transparent">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative">
                <div
                  className={cn(
                    "w-20 h-20 rounded-xl bg-linear-to-br from-[#8b4513] to-[#3d2b1f] flex items-center justify-center border-2",
                    rankColors.border
                  )}
                >
                  <span className="text-3xl font-black text-[#d4af37]">
                    {profile.username[0]?.toUpperCase()}
                  </span>
                </div>
                {/* Status indicator */}
                <div
                  className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-[#1a1614]",
                    profile.status === "online"
                      ? "bg-green-500"
                      : profile.status === "in_game"
                        ? "bg-amber-500"
                        : profile.status === "idle"
                          ? "bg-gray-500"
                          : "bg-red-500"
                  )}
                />
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-black text-[#e8e0d5] mb-1">{profile.username}</h2>

                {/* Ranks */}
                <div className="flex items-center gap-3 mb-2">
                  {/* Ranked */}
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-lg border",
                      rankColors.bg,
                      rankColors.border
                    )}
                  >
                    <Trophy className={cn("w-3.5 h-3.5", rankColors.text)} />
                    <span className={cn("text-xs font-bold", rankColors.text)}>
                      {profile.rank.ranked.tier} {profile.rank.ranked.division}
                    </span>
                    <span className="text-[10px] text-[#a89f94]">{profile.rank.ranked.lp} LP</span>
                  </div>

                  {/* Casual */}
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-green-500/10 border-green-500/30">
                    <Gamepad2 className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs font-bold text-green-400">
                      {profile.rank.casual.tier} {profile.rank.casual.division}
                    </span>
                  </div>
                </div>

                {/* Socials */}
                {(profile.socials.twitter || profile.socials.discord || profile.socials.twitch) && (
                  <div className="flex items-center gap-2">
                    {profile.socials.twitter && (
                      <a
                        href={`https://twitter.com/${profile.socials.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-black/30 border border-[#3d2b1f] text-[#a89f94] hover:text-white hover:border-[#1DA1F2] transition-all"
                        title={`@${profile.socials.twitter}`}
                      >
                        <TwitterIcon />
                      </a>
                    )}
                    {profile.socials.discord && (
                      <button
                        type="button"
                        className="p-1.5 rounded-lg bg-black/30 border border-[#3d2b1f] text-[#a89f94] hover:text-[#5865F2] hover:border-[#5865F2] transition-all"
                        title={profile.socials.discord}
                      >
                        <DiscordIcon />
                      </button>
                    )}
                    {profile.socials.twitch && (
                      <a
                        href={`https://twitch.tv/${profile.socials.twitch}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-black/30 border border-[#3d2b1f] text-[#a89f94] hover:text-[#9146FF] hover:border-[#9146FF] transition-all"
                        title={profile.socials.twitch}
                      >
                        <TwitchIcon />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Challenge Button */}
              {profile.status === "online" && (
                <button
                  type="button"
                  onClick={() => setShowChallengeDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/30 font-bold uppercase tracking-wide text-sm transition-all"
                >
                  <Swords className="w-4 h-4" />
                  Challenge
                </button>
              )}
            </div>
          </div>

          {/* Calling Card & Most Played */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Calling Card */}
              <div className="relative p-4 rounded-xl bg-black/30 border border-[#3d2b1f]">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-bold text-[#a89f94] uppercase tracking-wider">
                    Calling Card
                  </span>
                </div>
                {profile.callingCard ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (profile.callingCard) {
                        openCardDetail(profile.callingCard, true);
                      }
                    }}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
                      RARITY_CONFIG[profile.callingCard.rarity].border,
                      RARITY_CONFIG[profile.callingCard.rarity].glow,
                      "hover:brightness-110"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          ELEMENT_CONFIG[profile.callingCard.element].bg
                        )}
                      >
                        {(() => {
                          const Icon = ELEMENT_CONFIG[profile.callingCard.element].icon;
                          return (
                            <Icon
                              className={cn(
                                "w-5 h-5",
                                ELEMENT_CONFIG[profile.callingCard.element].color
                              )}
                            />
                          );
                        })()}
                      </div>
                      <div>
                        <p
                          className={cn(
                            "font-bold text-sm",
                            RARITY_CONFIG[profile.callingCard.rarity].color
                          )}
                        >
                          {profile.callingCard.name}
                        </p>
                        <p className="text-[10px] text-[#a89f94] uppercase tracking-wider">
                          {profile.callingCard.rarity}
                        </p>
                      </div>
                    </div>
                  </button>
                ) : (
                  <p className="text-sm text-[#a89f94]/50 italic">No calling card set</p>
                )}
              </div>

              {/* Most Played Card */}
              <div className="relative p-4 rounded-xl bg-black/30 border border-[#3d2b1f]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span className="text-xs font-bold text-[#a89f94] uppercase tracking-wider">
                    Most Played
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openCardDetail(profile.mostPlayedCard, false)}
                  className="w-full p-3 rounded-lg border border-[#3d2b1f] text-left transition-all hover:border-[#d4af37]/50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        ELEMENT_CONFIG[profile.mostPlayedCard.element].bg
                      )}
                    >
                      {(() => {
                        const Icon = ELEMENT_CONFIG[profile.mostPlayedCard.element].icon;
                        return (
                          <Icon
                            className={cn(
                              "w-5 h-5",
                              ELEMENT_CONFIG[profile.mostPlayedCard.element].color
                            )}
                          />
                        );
                      })()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#e8e0d5]">
                        {profile.mostPlayedCard.name}
                      </p>
                      <p className="text-[10px] text-[#a89f94]">
                        Played {profile.mostPlayedCard.timesPlayed.toLocaleString()} times
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6">
            <div className="flex border-b border-[#3d2b1f]">
              {(["stats", "badges", "agents"] as const).map((tab) => (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px",
                    activeTab === tab
                      ? "border-[#d4af37] text-[#d4af37]"
                      : "border-transparent text-[#a89f94] hover:text-[#e8e0d5]"
                  )}
                >
                  {tab === "stats" && <Target className="w-3.5 h-3.5 inline mr-2" />}
                  {tab === "badges" && <Medal className="w-3.5 h-3.5 inline mr-2" />}
                  {tab === "agents" && <Bot className="w-3.5 h-3.5 inline mr-2" />}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#3d2b1f] scrollbar-track-transparent">
            {/* Stats Tab */}
            {activeTab === "stats" && (
              <div className="space-y-4">
                {/* Main Stats */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-xl bg-black/30 border border-[#3d2b1f]">
                    <p className="text-2xl font-black text-[#d4af37]">{profile.stats.totalGames}</p>
                    <p className="text-[10px] text-[#a89f94] uppercase tracking-wider">Games</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-black/30 border border-[#3d2b1f]">
                    <p className="text-2xl font-black text-green-400">{profile.stats.wins}</p>
                    <p className="text-[10px] text-[#a89f94] uppercase tracking-wider">Wins</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-black/30 border border-[#3d2b1f]">
                    <p className="text-2xl font-black text-red-400">{profile.stats.losses}</p>
                    <p className="text-[10px] text-[#a89f94] uppercase tracking-wider">Losses</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-black/30 border border-[#3d2b1f]">
                    <p className="text-2xl font-black text-[#e8e0d5]">{winRate}%</p>
                    <p className="text-[10px] text-[#a89f94] uppercase tracking-wider">Win Rate</p>
                  </div>
                </div>

                {/* Streaks */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-[#3d2b1f]">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-orange-400">
                        {profile.stats.winStreak}
                      </p>
                      <p className="text-[10px] text-[#a89f94] uppercase tracking-wider">
                        Current Streak
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-[#3d2b1f]">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-purple-400">
                        {profile.stats.longestWinStreak}
                      </p>
                      <p className="text-[10px] text-[#a89f94] uppercase tracking-wider">
                        Best Streak
                      </p>
                    </div>
                  </div>
                </div>

                {/* Achievements Progress */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#a89f94] uppercase tracking-wider">
                    Achievements
                  </h4>
                  {profile.achievements.map((ach) => {
                    const Icon = BADGE_ICONS[ach.icon] || Star;
                    const hasProgress = ach.progress !== undefined && ach.maxProgress !== undefined;
                    const progressPercent =
                      hasProgress && ach.progress !== undefined && ach.maxProgress !== undefined
                        ? (ach.progress / ach.maxProgress) * 100
                        : 100;

                    return (
                      <button
                        type="button"
                        key={ach.id}
                        onClick={() => openAchievementDetail(ach)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-[#3d2b1f]/50 text-left hover:border-[#d4af37]/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#d4af37]/20 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-[#d4af37]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-[#e8e0d5]">{ach.name}</p>
                            {hasProgress && (
                              <span className="text-[10px] text-[#a89f94]">
                                {ach.progress}/{ach.maxProgress}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#a89f94] mb-1">{ach.description}</p>
                          {hasProgress && (
                            <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-linear-to-r from-[#d4af37] to-[#f4d03f] transition-all"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Badges Tab */}
            {activeTab === "badges" && (
              <div className="space-y-3">
                {profile.badges.length > 0 ? (
                  profile.badges.map((badge) => {
                    const Icon = BADGE_ICONS[badge.icon] || Star;
                    return (
                      <button
                        type="button"
                        key={badge.id}
                        onClick={() => openBadgeDetail(badge)}
                        className="w-full flex items-center gap-3 p-4 rounded-xl bg-black/30 border border-[#3d2b1f] hover:border-[#d4af37]/30 transition-all text-left hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#d4af37]/30 to-[#8b4513]/30 flex items-center justify-center border border-[#d4af37]/30">
                          <Icon className="w-6 h-6 text-[#d4af37]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[#e8e0d5]">{badge.name}</p>
                          <p className="text-xs text-[#a89f94]">{badge.description}</p>
                          <p className="text-[10px] text-[#a89f94]/60 mt-1">
                            Earned {new Date(badge.earnedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Medal className="w-12 h-12 text-[#a89f94]/30 mx-auto mb-3" />
                    <p className="text-[#a89f94]">No badges earned yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Agents Tab */}
            {activeTab === "agents" && (
              <div className="space-y-3">
                {profile.agents.length > 0 ? (
                  profile.agents.map((agent) => {
                    const agentWinRate = ((agent.wins / (agent.wins + agent.losses)) * 100).toFixed(
                      1
                    );
                    return (
                      <div
                        key={agent.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-black/30 border border-purple-500/30 hover:border-purple-500/50 transition-all"
                      >
                        <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 text-2xl">
                          {agent.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-[#e8e0d5]">{agent.name}</p>
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-400 uppercase">
                              {agent.personality}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-green-400">{agent.wins}W</span>
                            <span className="text-red-400">{agent.losses}L</span>
                            <span className="text-[#a89f94]">{agentWinRate}% WR</span>
                          </div>
                        </div>
                        <Bot className="w-5 h-5 text-purple-400" />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Bot className="w-12 h-12 text-[#a89f94]/30 mx-auto mb-3" />
                    <p className="text-[#a89f94]">No agents created yet</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#3d2b1f] bg-black/30">
            <p className="text-center text-[10px] text-[#a89f94]">
              Member since{" "}
              {new Date(profile.joinedAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Detail Popup */}
      {selectedDetail && (
        <>
          {/* Detail Backdrop */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Backdrop overlay for modal */}
          <div
            role="presentation"
            className="fixed inset-0 z-90 bg-black/50"
            onClick={() => setSelectedDetail(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSelectedDetail(null);
            }}
          />

          {/* Detail Panel */}
          <div className="fixed inset-0 z-95 flex items-center justify-center p-4 pointer-events-none">
            <div className="relative w-full max-w-md rounded-2xl tcg-chat-leather border border-[#3d2b1f] shadow-2xl pointer-events-auto animate-in zoom-in-95 fade-in duration-200">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-lg border border-[#3d2b1f] bg-black/50 text-[#a89f94] hover:text-[#e8e0d5] hover:border-[#d4af37]/50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Card Detail */}
              {selectedDetail.type === "card" && (
                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-xl flex items-center justify-center border-2",
                        selectedDetail.element && ELEMENT_CONFIG[selectedDetail.element].bg,
                        selectedDetail.rarity
                          ? RARITY_CONFIG[selectedDetail.rarity].border
                          : "border-[#3d2b1f]"
                      )}
                    >
                      {selectedDetail.element &&
                        (() => {
                          const Icon = ELEMENT_CONFIG[selectedDetail.element].icon;
                          return (
                            <Icon
                              className={cn(
                                "w-8 h-8",
                                ELEMENT_CONFIG[selectedDetail.element].color
                              )}
                            />
                          );
                        })()}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={cn(
                          "text-xl font-black mb-1",
                          selectedDetail.rarity
                            ? RARITY_CONFIG[selectedDetail.rarity].color
                            : "text-[#e8e0d5]"
                        )}
                      >
                        {selectedDetail.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {selectedDetail.rarity && (
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                              RARITY_CONFIG[selectedDetail.rarity].border,
                              RARITY_CONFIG[selectedDetail.rarity].color
                            )}
                          >
                            {selectedDetail.rarity}
                          </span>
                        )}
                        {selectedDetail.element && (
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              ELEMENT_CONFIG[selectedDetail.element].color
                            )}
                          >
                            {selectedDetail.element}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Stats */}
                  {(selectedDetail.attack !== undefined ||
                    selectedDetail.defense !== undefined ||
                    selectedDetail.cost !== undefined) && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {selectedDetail.cost !== undefined && (
                        <div className="text-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                          <p className="text-lg font-black text-blue-400">{selectedDetail.cost}</p>
                          <p className="text-[9px] text-[#a89f94] uppercase">Cost</p>
                        </div>
                      )}
                      {selectedDetail.attack !== undefined && (
                        <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                          <p className="text-lg font-black text-red-400">{selectedDetail.attack}</p>
                          <p className="text-[9px] text-[#a89f94] uppercase">Attack</p>
                        </div>
                      )}
                      {selectedDetail.defense !== undefined && (
                        <div className="text-center p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                          <p className="text-lg font-black text-green-400">
                            {selectedDetail.defense}
                          </p>
                          <p className="text-[9px] text-[#a89f94] uppercase">Defense</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Ability */}
                  {selectedDetail.ability && (
                    <div className="mb-4 p-3 rounded-lg bg-black/30 border border-[#3d2b1f]">
                      <p className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-1">
                        Ability
                      </p>
                      <p className="text-sm text-[#e8e0d5]">{selectedDetail.ability}</p>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-sm text-[#a89f94] mb-3">{selectedDetail.description}</p>

                  {/* Flavor Text */}
                  {selectedDetail.flavorText && (
                    <p className="text-xs text-[#a89f94]/70 italic border-l-2 border-[#d4af37]/30 pl-3">
                      {selectedDetail.flavorText}
                    </p>
                  )}

                  {/* Times Played */}
                  {selectedDetail.timesPlayed !== undefined && (
                    <div className="mt-4 pt-3 border-t border-[#3d2b1f]">
                      <p className="text-xs text-[#a89f94]">
                        Played{" "}
                        <span className="text-[#d4af37] font-bold">
                          {selectedDetail.timesPlayed.toLocaleString()}
                        </span>{" "}
                        times by this player
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Badge Detail */}
              {selectedDetail.type === "badge" && (
                <div className="p-6">
                  {/* Badge Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-linear-to-br from-[#d4af37]/30 to-[#8b4513]/30 flex items-center justify-center border border-[#d4af37]/30">
                      {(() => {
                        const Icon = BADGE_ICONS[selectedDetail.icon || "star"] || Star;
                        return <Icon className="w-8 h-8 text-[#d4af37]" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-[#e8e0d5] mb-1">
                        {selectedDetail.name}
                      </h3>
                      {selectedDetail.rarity && (
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                            selectedDetail.rarity === "epic"
                              ? "border-purple-500/50 text-purple-400"
                              : selectedDetail.rarity === "rare"
                                ? "border-blue-500/50 text-blue-400"
                                : "border-gray-500/50 text-gray-400"
                          )}
                        >
                          {selectedDetail.rarity} Badge
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-[#e8e0d5] mb-4">{selectedDetail.description}</p>

                  {/* How to Earn */}
                  {selectedDetail.flavorText && (
                    <div className="mb-4 p-3 rounded-lg bg-black/30 border border-[#3d2b1f]">
                      <p className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-1">
                        How to Earn
                      </p>
                      <p className="text-sm text-[#a89f94]">{selectedDetail.flavorText}</p>
                    </div>
                  )}

                  {/* Earned Date */}
                  {selectedDetail.earnedAt && (
                    <div className="pt-3 border-t border-[#3d2b1f]">
                      <p className="text-xs text-[#a89f94]">
                        Earned on{" "}
                        <span className="text-[#d4af37] font-bold">
                          {new Date(selectedDetail.earnedAt).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Achievement Detail */}
              {selectedDetail.type === "achievement" && (
                <div className="p-6">
                  {/* Achievement Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-[#d4af37]/20 flex items-center justify-center border border-[#d4af37]/30">
                      {(() => {
                        const Icon = BADGE_ICONS[selectedDetail.icon || "star"] || Star;
                        return <Icon className="w-8 h-8 text-[#d4af37]" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-[#e8e0d5] mb-1">
                        {selectedDetail.name}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[#d4af37]/30 text-[#d4af37]">
                        Achievement
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-[#e8e0d5] mb-4">{selectedDetail.description}</p>

                  {/* Progress */}
                  {selectedDetail.progress !== undefined &&
                    selectedDetail.maxProgress !== undefined && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-[#a89f94] uppercase tracking-wider">
                            Progress
                          </p>
                          <span className="text-sm font-bold text-[#d4af37]">
                            {selectedDetail.progress} / {selectedDetail.maxProgress}
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-black/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-[#d4af37] to-[#f4d03f] transition-all"
                            style={{
                              width: `${(selectedDetail.progress / selectedDetail.maxProgress) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-[#a89f94] mt-1 text-right">
                          {((selectedDetail.progress / selectedDetail.maxProgress) * 100).toFixed(
                            1
                          )}
                          % Complete
                        </p>
                      </div>
                    )}

                  {/* How to Complete */}
                  {selectedDetail.flavorText && (
                    <div className="mb-4 p-3 rounded-lg bg-black/30 border border-[#3d2b1f]">
                      <p className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-1">
                        How to Complete
                      </p>
                      <p className="text-sm text-[#a89f94]">{selectedDetail.flavorText}</p>
                    </div>
                  )}

                  {/* Reward */}
                  {selectedDetail.ability && (
                    <div className="p-3 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30">
                      <p className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-1">
                        Reward
                      </p>
                      <p className="text-sm text-[#e8e0d5]">{selectedDetail.ability}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Challenge Confirm Dialog */}
      <ChallengeConfirmDialog
        isOpen={showChallengeDialog}
        onClose={() => setShowChallengeDialog(false)}
        onConfirm={handleChallengeConfirm}
        opponentUsername={username}
        opponentRank={profile.rank.ranked.tier}
      />
    </>
  );
}
