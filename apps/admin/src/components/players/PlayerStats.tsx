"use client";

/**
 * PlayerStats Component
 *
 * Reusable player statistics display components.
 */

import { RatioStat, StatCard, StatGrid } from "@/components/data";
import { Badge } from "@/components/ui/badge";
import type { PlayerStats as PlayerStatsType } from "@/types";
import { DonutChart, Flex } from "@tremor/react";

// =============================================================================
// Types
// =============================================================================

interface PlayerStatsDisplayProps {
  stats: PlayerStatsType;
  eloRating?: number;
  seasonRating?: number;
  isLoading?: boolean;
}

interface RecentGame {
  gameId: string;
  gameName: string;
  won: boolean;
  endedAt?: number;
}

interface RecentGamesProps {
  games: RecentGame[];
}

interface ApiKeyInfo {
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt?: number;
}

interface ApiKeysPreviewProps {
  apiKeys: ApiKeyInfo[];
}

// =============================================================================
// PlayerStatsDisplay
// =============================================================================

/**
 * Displays player statistics in a grid layout
 */
export function PlayerStatsDisplay({
  stats,
  eloRating,
  seasonRating,
  isLoading = false,
}: PlayerStatsDisplayProps) {
  const winRate =
    stats.gamesPlayed > 0 ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1) : "0.0";

  return (
    <StatGrid columns={4}>
      <StatCard
        title="Games Played"
        value={stats.gamesPlayed}
        icon={<span className="text-lg">🎮</span>}
        isLoading={isLoading}
      />
      <StatCard
        title="Games Won"
        value={stats.gamesWon}
        icon={<span className="text-lg">🏆</span>}
        subtitle={`${winRate}% win rate`}
        isLoading={isLoading}
      />
      <StatCard
        title="ELO Rating"
        value={eloRating ?? 1200}
        icon={<span className="text-lg">📊</span>}
        subtitle={seasonRating ? `Season: ${seasonRating}` : undefined}
        isLoading={isLoading}
      />
      <StatCard
        title="Total Score"
        value={stats.totalScore.toLocaleString()}
        icon={<span className="text-lg">⭐</span>}
        isLoading={isLoading}
      />
    </StatGrid>
  );
}

// =============================================================================
// WinLossChart
// =============================================================================

interface WinLossChartProps {
  gamesWon: number;
  gamesPlayed: number;
}

/**
 * Donut chart showing win/loss ratio
 */
export function WinLossChart({ gamesWon, gamesPlayed }: WinLossChartProps) {
  const gamesLost = gamesPlayed - gamesWon;
  const data = [
    { name: "Won", value: gamesWon },
    { name: "Lost", value: gamesLost },
  ];

  if (gamesPlayed === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        No games played yet
      </div>
    );
  }

  return (
    <div>
      <DonutChart
        className="h-48"
        data={data}
        category="value"
        index="name"
        colors={["emerald", "rose"]}
        showAnimation
      />
      <Flex className="mt-4" justifyContent="center">
        <RatioStat label="Win Rate" current={gamesWon} total={gamesPlayed} showPercentage />
      </Flex>
    </div>
  );
}

// =============================================================================
// RecentGames
// =============================================================================

/**
 * Displays a list of recent games with results
 */
export function RecentGames({ games }: RecentGamesProps) {
  if (games.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No recent games</div>;
  }

  return (
    <div className="space-y-2">
      {games.map((game) => (
        <div
          key={game.gameId}
          className="flex items-center justify-between p-2 rounded-md bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <Badge
              variant={game.won ? "default" : "secondary"}
              className={game.won ? "bg-green-500" : ""}
            >
              {game.won ? "W" : "L"}
            </Badge>
            <span className="text-sm">{game.gameName}</span>
          </div>
          {game.endedAt && (
            <span className="text-xs text-muted-foreground">
              {new Date(game.endedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// ApiKeysPreview
// =============================================================================

/**
 * Displays a preview of player's API keys
 */
export function ApiKeysPreview({ apiKeys }: ApiKeysPreviewProps) {
  if (apiKeys.length === 0) {
    return <div className="text-center text-muted-foreground py-4">No API keys</div>;
  }

  return (
    <div className="space-y-2">
      {apiKeys.map((key) => (
        <div
          key={key.keyPrefix}
          className="flex items-center justify-between p-2 rounded-md bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <Badge variant={key.isActive ? "default" : "secondary"}>
              {key.isActive ? "Active" : "Revoked"}
            </Badge>
            <code className="text-sm font-mono">{key.keyPrefix}...</code>
          </div>
          {key.lastUsedAt && (
            <span className="text-xs text-muted-foreground">
              Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// ModerationTimeline
// =============================================================================

interface ModerationEntry {
  action: string;
  reason?: string;
  createdAt: number;
}

interface ModerationTimelineProps {
  entries: ModerationEntry[];
}

/**
 * Timeline display of moderation history
 */
export function ModerationTimeline({ entries }: ModerationTimelineProps) {
  if (entries.length === 0) {
    return <div className="text-center text-muted-foreground py-4">No moderation history</div>;
  }

  const getActionStyle = (action: string) => {
    switch (action) {
      case "ban":
        return { icon: "🚫", color: "border-red-500" };
      case "unban":
        return { icon: "🔓", color: "border-green-500" };
      case "suspend":
        return { icon: "⏸️", color: "border-orange-500" };
      case "unsuspend":
        return { icon: "▶️", color: "border-blue-500" };
      case "warn":
        return { icon: "⚠️", color: "border-yellow-500" };
      case "note":
        return { icon: "📝", color: "border-gray-500" };
      default:
        return { icon: "•", color: "border-gray-500" };
    }
  };

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => {
        const style = getActionStyle(entry.action);
        return (
          <div key={index} className={`relative pl-6 pb-4 border-l-2 ${style.color} last:pb-0`}>
            <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-background border-2 border-current flex items-center justify-center text-xs">
              {style.icon}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium capitalize">{entry.action}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{entry.reason}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
