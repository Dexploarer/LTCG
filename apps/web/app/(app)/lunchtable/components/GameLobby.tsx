"use client";

import {
  ChevronRight,
  Clock,
  Eye,
  Flame,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Waves,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CreateGameModal } from "./CreateGameModal";
import { JoinConfirmDialog } from "./JoinConfirmDialog";

type GameStatus = "waiting" | "active";
type TabType = "join" | "watch";
type GameMode = "all" | "casual" | "ranked";

interface GameLobbyEntry {
  id: string;
  hostName: string;
  hostRank: string;
  hostAvatar?: string;
  deckArchetype: "fire" | "water" | "earth" | "wind";
  mode: "casual" | "ranked";
  createdAt: number;
  status: GameStatus;
  opponentName?: string;
  opponentRank?: string;
  turnNumber?: number;
}

// Mock data for UI
const MOCK_WAITING_GAMES: GameLobbyEntry[] = [
  {
    id: "1",
    hostName: "DragonSlayer",
    hostRank: "Diamond",
    deckArchetype: "fire",
    mode: "ranked",
    createdAt: Date.now() - 120000,
    status: "waiting",
  },
  {
    id: "2",
    hostName: "TideWalker",
    hostRank: "Platinum",
    deckArchetype: "water",
    mode: "casual",
    createdAt: Date.now() - 300000,
    status: "waiting",
  },
  {
    id: "3",
    hostName: "IronGuard",
    hostRank: "Gold",
    deckArchetype: "earth",
    mode: "ranked",
    createdAt: Date.now() - 60000,
    status: "waiting",
  },
  {
    id: "7",
    hostName: "CasualKing",
    hostRank: "Silver",
    deckArchetype: "wind",
    mode: "casual",
    createdAt: Date.now() - 180000,
    status: "waiting",
  },
];

const MOCK_ACTIVE_GAMES: GameLobbyEntry[] = [
  {
    id: "4",
    hostName: "StormBringer",
    hostRank: "Master",
    deckArchetype: "wind",
    mode: "ranked",
    createdAt: Date.now() - 600000,
    status: "active",
    opponentName: "PhoenixRise",
    opponentRank: "Diamond",
    turnNumber: 8,
  },
  {
    id: "5",
    hostName: "FlameHeart",
    hostRank: "Legend",
    deckArchetype: "fire",
    mode: "ranked",
    createdAt: Date.now() - 900000,
    status: "active",
    opponentName: "DeepSeaDiver",
    opponentRank: "Master",
    turnNumber: 15,
  },
  {
    id: "6",
    hostName: "GaleForce",
    hostRank: "Platinum",
    deckArchetype: "wind",
    mode: "casual",
    createdAt: Date.now() - 450000,
    status: "active",
    opponentName: "RockSolid",
    opponentRank: "Diamond",
    turnNumber: 5,
  },
];

const ARCHETYPE_CONFIG = {
  fire: {
    icon: Flame,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
  water: {
    icon: Waves,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  earth: {
    icon: Shield,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-400/30",
  },
  wind: {
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
  },
};

const RANK_COLORS: Record<string, string> = {
  Bronze: "text-orange-400",
  Silver: "text-gray-300",
  Gold: "text-yellow-500",
  Platinum: "text-blue-400",
  Diamond: "text-cyan-400",
  Master: "text-purple-400",
  Legend: "text-yellow-400",
};

function formatWaitTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1 min";
  return `${minutes} mins`;
}

export function GameLobby() {
  const [activeTab, setActiveTab] = useState<TabType>("join");
  const [modeFilter, setModeFilter] = useState<GameMode>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [joiningGame, setJoiningGame] = useState<GameLobbyEntry | null>(null);

  // Filter games by mode
  const waitingGames = MOCK_WAITING_GAMES.filter(
    (g) => modeFilter === "all" || g.mode === modeFilter
  );
  const activeGames = MOCK_ACTIVE_GAMES.filter(
    (g) => modeFilter === "all" || g.mode === modeFilter
  );

  const handleQuickMatch = () => {
    setIsSearching(true);
    // Simulate search
    setTimeout(() => setIsSearching(false), 3000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleJoinGame = (game: GameLobbyEntry) => {
    setJoiningGame(game);
  };

  const confirmJoin = () => {
    // TODO: Actually join the game
    setJoiningGame(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-[#e8e0d5] uppercase tracking-tight flex items-center gap-3">
            <Swords className="w-7 h-7 text-[#d4af37]" />
            Battle Arena
          </h2>
          <p className="text-xs text-[#a89f94] mt-1 uppercase tracking-widest">
            Challenge opponents or spectate live matches
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Match Button */}
          <button
            type="button"
            onClick={handleQuickMatch}
            disabled={isSearching}
            className={cn(
              "h-12 px-5 rounded-lg font-bold uppercase tracking-wide text-sm flex items-center gap-2 transition-all",
              isSearching
                ? "bg-purple-600/50 text-white/70 cursor-wait"
                : "bg-linear-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg hover:shadow-xl"
            )}
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Quick Match
              </>
            )}
          </button>

          {/* Create Game Button */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="tcg-button-primary h-12 px-6 font-black uppercase tracking-wider text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus className="w-5 h-5" />
            Create Game
          </button>
        </div>
      </div>

      {/* Mode Filter */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex rounded-lg overflow-hidden border border-[#3d2b1f] bg-black/30">
          {(["all", "casual", "ranked"] as GameMode[]).map((mode) => (
            <button
              type="button"
              key={mode}
              onClick={() => setModeFilter(mode)}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
                modeFilter === mode
                  ? mode === "ranked"
                    ? "bg-linear-to-r from-amber-600 to-yellow-500 text-[#1a1614]"
                    : mode === "casual"
                      ? "bg-linear-to-r from-green-600 to-green-500 text-white"
                      : "bg-[#d4af37] text-[#1a1614]"
                  : "text-[#a89f94] hover:text-[#e8e0d5] hover:bg-white/5"
              )}
            >
              {mode === "all" ? "All Games" : mode}
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg border border-[#3d2b1f] bg-black/30 text-[#a89f94] hover:text-[#e8e0d5] hover:border-[#d4af37]/50 transition-all"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("join")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold uppercase tracking-wide text-sm transition-all",
            activeTab === "join"
              ? "bg-[#d4af37] text-[#1a1614] shadow-lg"
              : "bg-black/30 text-[#a89f94] border border-[#3d2b1f] hover:border-[#d4af37]/50 hover:text-[#e8e0d5]"
          )}
        >
          <Users className="w-4 h-4" />
          Join Game
          <span
            className={cn(
              "ml-1 px-2 py-0.5 rounded-full text-[10px] font-black",
              activeTab === "join"
                ? "bg-[#1a1614]/20 text-[#1a1614]"
                : "bg-[#d4af37]/20 text-[#d4af37]"
            )}
          >
            {waitingGames.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("watch")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold uppercase tracking-wide text-sm transition-all",
            activeTab === "watch"
              ? "bg-[#d4af37] text-[#1a1614] shadow-lg"
              : "bg-black/30 text-[#a89f94] border border-[#3d2b1f] hover:border-[#d4af37]/50 hover:text-[#e8e0d5]"
          )}
        >
          <Eye className="w-4 h-4" />
          Watch
          <span
            className={cn(
              "ml-1 px-2 py-0.5 rounded-full text-[10px] font-black",
              activeTab === "watch"
                ? "bg-[#1a1614]/20 text-[#1a1614]"
                : "bg-[#d4af37]/20 text-[#d4af37]"
            )}
          >
            {activeGames.length}
          </span>
        </button>
      </div>

      {/* Game List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-[#3d2b1f] scrollbar-track-transparent">
        {activeTab === "join" ? (
          waitingGames.length > 0 ? (
            waitingGames.map((game) => (
              <WaitingGameCard key={game.id} game={game} onJoin={() => handleJoinGame(game)} />
            ))
          ) : (
            <EmptyState
              icon={Users}
              title="No Games Available"
              description={
                modeFilter === "all"
                  ? "Be the first to create a game!"
                  : `No ${modeFilter} games available`
              }
            />
          )
        ) : activeGames.length > 0 ? (
          activeGames.map((game) => <ActiveGameCard key={game.id} game={game} />)
        ) : (
          <EmptyState
            icon={Eye}
            title="No Active Games"
            description="No battles are currently in progress"
          />
        )}
      </div>

      {/* Create Game Modal */}
      <CreateGameModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => {
          console.log("Creating game:", data);
          setIsCreateModalOpen(false);
        }}
      />

      {/* Join Confirm Dialog */}
      {joiningGame && (
        <JoinConfirmDialog
          game={joiningGame}
          onConfirm={confirmJoin}
          onCancel={() => setJoiningGame(null)}
        />
      )}
    </div>
  );
}

function WaitingGameCard({ game, onJoin }: { game: GameLobbyEntry; onJoin: () => void }) {
  const archetype = ARCHETYPE_CONFIG[game.deckArchetype];
  const ArchetypeIcon = archetype.icon;

  return (
    <div className="group relative p-4 rounded-xl tcg-chat-leather border border-[#3d2b1f] hover:border-[#d4af37]/50 transition-all shadow-lg hover:shadow-xl overflow-hidden">
      <div className="ornament-corner ornament-corner-tl opacity-30" />
      <div className="ornament-corner ornament-corner-tr opacity-30" />

      <div className="flex items-center justify-between gap-4 relative z-10">
        {/* Host Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Archetype Icon */}
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center border shrink-0",
              archetype.bg,
              archetype.border
            )}
          >
            <ArchetypeIcon className={cn("w-6 h-6", archetype.color)} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-[#e8e0d5] truncate">{game.hostName}</span>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  RANK_COLORS[game.hostRank] || "text-[#a89f94]"
                )}
              >
                {game.hostRank}
              </span>
              {/* Mode Badge */}
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                  game.mode === "ranked"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-green-500/20 text-green-400 border border-green-500/30"
                )}
              >
                {game.mode}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#a89f94]">
              <Clock className="w-3 h-3" />
              <span>Waiting {formatWaitTime(game.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Join Button */}
        <button
          type="button"
          onClick={onJoin}
          className="shrink-0 h-10 px-5 rounded-lg bg-linear-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold uppercase tracking-wide text-sm flex items-center gap-2 shadow-lg transition-all group-hover:scale-105"
        >
          Join
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ActiveGameCard({ game }: { game: GameLobbyEntry }) {
  const archetype = ARCHETYPE_CONFIG[game.deckArchetype];
  const ArchetypeIcon = archetype.icon;

  return (
    <div className="group relative p-4 rounded-xl tcg-chat-leather border border-[#3d2b1f] hover:border-[#d4af37]/50 transition-all shadow-lg hover:shadow-xl overflow-hidden">
      <div className="ornament-corner ornament-corner-tl opacity-30" />
      <div className="ornament-corner ornament-corner-tr opacity-30" />

      <div className="flex items-center justify-between gap-4 relative z-10">
        {/* Match Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* VS Display */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center border",
                archetype.bg,
                archetype.border
              )}
            >
              <ArchetypeIcon className={cn("w-5 h-5", archetype.color)} />
            </div>
            <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/30 flex items-center justify-center">
              <span className="text-[10px] font-black text-[#d4af37]">VS</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-black/30 border border-[#3d2b1f] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#a89f94]" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1 text-sm">
              <span className="font-black text-[#e8e0d5] truncate">{game.hostName}</span>
              <span className="text-[#a89f94] font-bold">vs</span>
              <span className="font-black text-[#e8e0d5] truncate">{game.opponentName}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#a89f94]">
              <span
                className={cn("uppercase tracking-wider font-bold", RANK_COLORS[game.hostRank])}
              >
                {game.hostRank}
              </span>
              <span>vs</span>
              <span
                className={cn(
                  "uppercase tracking-wider font-bold",
                  RANK_COLORS[game.opponentRank || "Bronze"]
                )}
              >
                {game.opponentRank}
              </span>
            </div>
          </div>
        </div>

        {/* Turn Counter & Watch */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-center">
            <p className="text-lg font-black text-[#d4af37]">{game.turnNumber}</p>
            <p className="text-[9px] text-[#a89f94] uppercase tracking-widest">Turn</p>
          </div>
          <button
            type="button"
            className="h-10 px-5 rounded-lg bg-linear-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold uppercase tracking-wide text-sm flex items-center gap-2 shadow-lg transition-all group-hover:scale-105"
          >
            <Eye className="w-4 h-4" />
            Watch
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#3d2b1f]/30 border border-[#3d2b1f] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#a89f94]/50" />
      </div>
      <h4 className="text-lg font-black text-[#e8e0d5] uppercase tracking-wide mb-1">{title}</h4>
      <p className="text-sm text-[#a89f94]">{description}</p>
    </div>
  );
}
