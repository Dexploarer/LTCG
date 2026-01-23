"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Calendar,
  Crown,
  Flame,
  Loader2,
  Medal,
  Minus,
  Swords,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/ConvexAuthProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type LeaderboardType = "ranked" | "wins" | "winstreak" | "weekly";

interface LeaderboardPlayer {
  rank: number;
  id: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  winStreak: number;
  change: "up" | "down" | "same";
  changeAmount?: number;
  isCurrentUser?: boolean;
}

// Mock leaderboard data
const MOCK_LEADERBOARD: LeaderboardPlayer[] = [
  {
    rank: 1,
    id: "p1",
    username: "DragonMaster",
    rating: 2450,
    wins: 156,
    losses: 32,
    winStreak: 12,
    change: "same",
  },
  {
    rank: 2,
    id: "p2",
    username: "ShadowKnight",
    rating: 2380,
    wins: 142,
    losses: 45,
    winStreak: 5,
    change: "up",
    changeAmount: 1,
  },
  {
    rank: 3,
    id: "p3",
    username: "PhoenixRider",
    rating: 2340,
    wins: 138,
    losses: 52,
    winStreak: 3,
    change: "down",
    changeAmount: 1,
  },
  {
    rank: 4,
    id: "p4",
    username: "StormBringer",
    rating: 2290,
    wins: 129,
    losses: 48,
    winStreak: 7,
    change: "up",
    changeAmount: 2,
  },
  {
    rank: 5,
    id: "p5",
    username: "IceQueen",
    rating: 2250,
    wins: 124,
    losses: 56,
    winStreak: 2,
    change: "same",
  },
  {
    rank: 6,
    id: "p6",
    username: "FlameWarden",
    rating: 2210,
    wins: 118,
    losses: 62,
    winStreak: 4,
    change: "up",
    changeAmount: 3,
  },
  {
    rank: 7,
    id: "p7",
    username: "NightHunter",
    rating: 2180,
    wins: 112,
    losses: 58,
    winStreak: 1,
    change: "down",
    changeAmount: 2,
  },
  {
    rank: 8,
    id: "p8",
    username: "ThunderGod",
    rating: 2150,
    wins: 108,
    losses: 64,
    winStreak: 6,
    change: "same",
  },
  {
    rank: 9,
    id: "p9",
    username: "EarthShaker",
    rating: 2120,
    wins: 105,
    losses: 68,
    winStreak: 0,
    change: "down",
    changeAmount: 1,
  },
  {
    rank: 10,
    id: "p10",
    username: "WindWalker",
    rating: 2090,
    wins: 98,
    losses: 72,
    winStreak: 3,
    change: "up",
    changeAmount: 1,
  },
];

const rankColors: Record<number, string> = {
  1: "from-yellow-500/30 to-amber-600/20 border-yellow-500/50",
  2: "from-gray-300/30 to-slate-400/20 border-gray-400/50",
  3: "from-amber-600/30 to-orange-700/20 border-amber-600/50",
};

const rankIcons: Record<number, typeof Trophy> = {
  1: Crown,
  2: Medal,
  3: Medal,
};

export default function LeaderboardsPage() {
  const { token } = useAuth();
  const currentUser = useQuery(api.users.currentUser, token ? { token } : "skip");

  const [activeTab, setActiveTab] = useState<LeaderboardType>("ranked");

  // Add current user to leaderboard for demo
  const leaderboardData: LeaderboardPlayer[] = MOCK_LEADERBOARD.map((p, i) => ({
    ...p,
    isCurrentUser: i === 4 && currentUser?.username === p.username,
  }));

  // Mock current user rank if not in top 10
  const currentUserRank: LeaderboardPlayer | null = currentUser
    ? {
        rank: 42,
        id: currentUser._id,
        username: currentUser.username || "You",
        rating: 1250,
        wins: 28,
        losses: 22,
        winStreak: 2,
        change: "up",
        changeAmount: 3,
        isCurrentUser: true,
      }
    : null;

  const tabs: { id: LeaderboardType; label: string; icon: typeof Trophy }[] = [
    { id: "ranked", label: "Ranked", icon: Trophy },
    { id: "wins", label: "Most Wins", icon: Swords },
    { id: "winstreak", label: "Win Streak", icon: Flame },
    { id: "weekly", label: "Weekly", icon: Calendar },
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0d0a09] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0a09] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-yellow-900/10 via-[#0d0a09] to-[#0d0a09]" />

      <div className="container mx-auto px-4 pt-28 pb-16 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-[#d4af37]" />
            <h1 className="text-3xl font-bold text-[#e8e0d5]">Leaderboards</h1>
          </div>
          <p className="text-[#a89f94]">See how you rank against other players</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1 bg-black/40 rounded-xl border border-[#3d2b1f] w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all",
                  isActive
                    ? "bg-[#d4af37] text-[#1a1614]"
                    : "text-[#a89f94] hover:text-[#e8e0d5] hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
          {[2, 1, 3].map((position) => {
            const player = leaderboardData[position - 1];
            if (!player) return null;
            const Icon = rankIcons[position] || Medal;
            const isFirst = position === 1;

            return (
              <div
                key={position}
                className={cn(
                  "flex flex-col items-center p-4 rounded-xl border bg-linear-to-b",
                  rankColors[position],
                  isFirst && "order-2 -mt-4"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-3",
                    position === 1
                      ? "bg-yellow-500/30"
                      : position === 2
                        ? "bg-gray-400/30"
                        : "bg-amber-600/30"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6",
                      position === 1
                        ? "text-yellow-400"
                        : position === 2
                          ? "text-gray-300"
                          : "text-amber-500"
                    )}
                  />
                </div>
                <Avatar className="w-16 h-16 border-2 border-[#3d2b1f] mb-2">
                  <AvatarFallback className="bg-[#1a1614] text-[#d4af37] text-xl font-bold">
                    {player.username[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="font-bold text-[#e8e0d5] text-center truncate w-full">
                  {player.username}
                </p>
                <p
                  className={cn(
                    "text-lg font-black",
                    position === 1
                      ? "text-yellow-400"
                      : position === 2
                        ? "text-gray-300"
                        : "text-amber-500"
                  )}
                >
                  {player.rating}
                </p>
                <p className="text-xs text-[#a89f94]">
                  {player.wins}W / {player.losses}L
                </p>
              </div>
            );
          })}
        </div>

        {/* Leaderboard Table */}
        <div className="rounded-xl bg-black/40 border border-[#3d2b1f] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#3d2b1f] text-xs font-bold text-[#a89f94] uppercase tracking-wider">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-2 text-center">Rating</div>
            <div className="col-span-2 text-center">W/L</div>
            <div className="col-span-2 text-center">Streak</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#3d2b1f]">
            {leaderboardData.map((player) => (
              <div
                key={player.id}
                className={cn(
                  "grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors",
                  player.isCurrentUser && "bg-[#d4af37]/10"
                )}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center gap-2">
                  <span
                    className={cn(
                      "font-bold",
                      player.rank <= 3 ? "text-[#d4af37]" : "text-[#e8e0d5]"
                    )}
                  >
                    #{player.rank}
                  </span>
                  {player.change === "up" && <TrendingUp className="w-3 h-3 text-green-400" />}
                  {player.change === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
                  {player.change === "same" && <Minus className="w-3 h-3 text-[#a89f94]" />}
                </div>

                {/* Player */}
                <div className="col-span-5 flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-[#3d2b1f]">
                    <AvatarFallback className="bg-[#1a1614] text-[#d4af37] font-bold">
                      {player.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p
                      className={cn(
                        "font-medium",
                        player.isCurrentUser ? "text-[#d4af37]" : "text-[#e8e0d5]"
                      )}
                    >
                      {player.username}
                      {player.isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div className="col-span-2 text-center">
                  <span className="font-bold text-[#e8e0d5]">{player.rating}</span>
                </div>

                {/* W/L */}
                <div className="col-span-2 text-center">
                  <span className="text-green-400">{player.wins}</span>
                  <span className="text-[#a89f94] mx-1">/</span>
                  <span className="text-red-400">{player.losses}</span>
                </div>

                {/* Streak */}
                <div className="col-span-2 text-center">
                  {player.winStreak > 0 ? (
                    <span className="flex items-center justify-center gap-1 text-orange-400">
                      <Flame className="w-4 h-4" />
                      {player.winStreak}
                    </span>
                  ) : (
                    <span className="text-[#a89f94]">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Current User (if not in top 10) */}
          {currentUserRank && !leaderboardData.some((p) => p.isCurrentUser) && (
            <>
              <div className="p-2 text-center text-[#a89f94] text-sm border-t border-[#3d2b1f]">
                • • •
              </div>
              <div className="grid grid-cols-12 gap-4 p-4 items-center bg-[#d4af37]/10 border-t border-[#d4af37]/30">
                <div className="col-span-1 flex items-center gap-2">
                  <span className="font-bold text-[#d4af37]">#{currentUserRank.rank}</span>
                  {currentUserRank.change === "up" && (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  )}
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-[#d4af37]/50">
                    <AvatarFallback className="bg-[#1a1614] text-[#d4af37] font-bold">
                      {currentUserRank.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-[#d4af37]">
                    {currentUserRank.username} <span className="text-xs">(You)</span>
                  </p>
                </div>
                <div className="col-span-2 text-center font-bold text-[#e8e0d5]">
                  {currentUserRank.rating}
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-green-400">{currentUserRank.wins}</span>
                  <span className="text-[#a89f94] mx-1">/</span>
                  <span className="text-red-400">{currentUserRank.losses}</span>
                </div>
                <div className="col-span-2 text-center">
                  {currentUserRank.winStreak > 0 ? (
                    <span className="flex items-center justify-center gap-1 text-orange-400">
                      <Flame className="w-4 h-4" />
                      {currentUserRank.winStreak}
                    </span>
                  ) : (
                    <span className="text-[#a89f94]">-</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
