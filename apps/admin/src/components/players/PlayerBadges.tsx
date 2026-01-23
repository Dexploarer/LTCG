"use client";

/**
 * PlayerBadges Component
 *
 * Reusable badge components for displaying player status.
 */

import { Badge } from "@/components/ui/badge";
import type { PlayerType } from "@/types";

// =============================================================================
// Types
// =============================================================================

interface PlayerTypeBadgeProps {
  type: PlayerType;
}

interface ModerationStatusBadgeProps {
  isBanned?: boolean;
  isSuspended?: boolean;
  warningCount?: number;
}

interface RatingBadgeProps {
  rating?: number;
  showLabel?: boolean;
}

// =============================================================================
// PlayerTypeBadge
// =============================================================================

/**
 * Displays player type (Human/AI) with appropriate styling
 */
export function PlayerTypeBadge({ type }: PlayerTypeBadgeProps) {
  return (
    <Badge variant={type === "human" ? "default" : "secondary"}>
      {type === "human" ? "👤 Human" : "🤖 AI"}
    </Badge>
  );
}

// =============================================================================
// ModerationStatusBadge
// =============================================================================

/**
 * Displays moderation status with severity-based styling
 */
export function ModerationStatusBadge({
  isBanned,
  isSuspended,
  warningCount = 0,
}: ModerationStatusBadgeProps) {
  if (isBanned) {
    return <Badge variant="destructive">🚫 Banned</Badge>;
  }

  if (isSuspended) {
    return (
      <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
        ⏸️ Suspended
      </Badge>
    );
  }

  if (warningCount > 0) {
    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-500">
        ⚠️ {warningCount} Warning{warningCount > 1 ? "s" : ""}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-green-500 text-green-500">
      ✓ Good Standing
    </Badge>
  );
}

// =============================================================================
// RatingBadge
// =============================================================================

/**
 * Displays ELO rating with tier-based styling
 */
export function RatingBadge({ rating, showLabel = true }: RatingBadgeProps) {
  if (rating === undefined) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Unrated
      </Badge>
    );
  }

  // Determine tier based on rating
  const getTier = (r: number): { name: string; color: string } => {
    if (r >= 2000) return { name: "Master", color: "bg-purple-500 hover:bg-purple-600" };
    if (r >= 1800) return { name: "Diamond", color: "bg-cyan-500 hover:bg-cyan-600" };
    if (r >= 1600) return { name: "Platinum", color: "bg-emerald-500 hover:bg-emerald-600" };
    if (r >= 1400) return { name: "Gold", color: "bg-yellow-500 hover:bg-yellow-600" };
    if (r >= 1200) return { name: "Silver", color: "bg-gray-400 hover:bg-gray-500" };
    return { name: "Bronze", color: "bg-orange-700 hover:bg-orange-800" };
  };

  const tier = getTier(rating);

  return (
    <Badge className={tier.color}>
      {showLabel && `${tier.name}: `}
      {rating}
    </Badge>
  );
}

// =============================================================================
// Combined Status Display
// =============================================================================

interface PlayerStatusProps {
  type: PlayerType;
  isBanned?: boolean;
  isSuspended?: boolean;
  warningCount?: number;
  rating?: number;
}

/**
 * Combined display of player type, moderation status, and rating
 */
export function PlayerStatus({
  type,
  isBanned,
  isSuspended,
  warningCount,
  rating,
}: PlayerStatusProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <PlayerTypeBadge type={type} />
      <ModerationStatusBadge
        isBanned={isBanned}
        isSuspended={isSuspended}
        warningCount={warningCount}
      />
      <RatingBadge rating={rating} />
    </div>
  );
}
