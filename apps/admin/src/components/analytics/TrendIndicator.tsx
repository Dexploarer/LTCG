"use client";

/**
 * TrendIndicator Component
 *
 * Visual indicators for trends and changes in metrics.
 * Supports various display modes and color schemes.
 */

import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

type TrendDirection = "up" | "down" | "neutral";

export interface TrendIndicatorProps {
  /** The change value (can be percentage or absolute) */
  value: number | string;
  /** Direction of the trend */
  direction?: TrendDirection;
  /** Whether higher is better (affects coloring) */
  higherIsBetter?: boolean;
  /** Display format */
  format?: "percentage" | "absolute" | "raw";
  /** Size of the indicator */
  size?: "sm" | "md" | "lg";
  /** Show arrow icon */
  showArrow?: boolean;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatValue(value: number | string, format: string): string {
  if (typeof value === "string") return value;

  switch (format) {
    case "percentage":
      return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
    case "absolute":
      return `${value >= 0 ? "+" : ""}${value.toLocaleString()}`;
    default:
      return String(value);
  }
}

function getDirection(value: number | string): TrendDirection {
  if (typeof value === "string") return "neutral";
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "neutral";
}

function getTrendColor(direction: TrendDirection, higherIsBetter: boolean): string {
  if (direction === "neutral") return "text-muted-foreground";

  const isPositive =
    (direction === "up" && higherIsBetter) || (direction === "down" && !higherIsBetter);

  return isPositive ? "text-emerald-500" : "text-red-500";
}

function getTrendBgColor(direction: TrendDirection, higherIsBetter: boolean): string {
  if (direction === "neutral") return "bg-muted";

  const isPositive =
    (direction === "up" && higherIsBetter) || (direction === "down" && !higherIsBetter);

  return isPositive ? "bg-emerald-500/10" : "bg-red-500/10";
}

// =============================================================================
// Component
// =============================================================================

export function TrendIndicator({
  value,
  direction: directionOverride,
  higherIsBetter = true,
  format = "percentage",
  size = "md",
  showArrow = true,
  className = "",
}: TrendIndicatorProps) {
  const direction = directionOverride ?? getDirection(value);
  const displayValue = formatValue(value, format);
  const textColor = getTrendColor(direction, higherIsBetter);
  const bgColor = getTrendBgColor(direction, higherIsBetter);

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const arrowIcon = {
    up: "↑",
    down: "↓",
    neutral: "→",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium",
        sizeClasses[size],
        textColor,
        bgColor,
        className
      )}
    >
      {showArrow && <span className="font-bold">{arrowIcon[direction]}</span>}
      {displayValue}
    </span>
  );
}

// =============================================================================
// ComparisonBadge Component
// =============================================================================

export interface ComparisonBadgeProps {
  /** Current value */
  current: number;
  /** Previous value for comparison */
  previous: number;
  /** Label for the comparison period */
  label?: string;
  /** Whether higher is better */
  higherIsBetter?: boolean;
  /** Additional className */
  className?: string;
}

export function ComparisonBadge({
  current,
  previous,
  label = "vs last period",
  higherIsBetter = true,
  className = "",
}: ComparisonBadgeProps) {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TrendIndicator
        value={change}
        higherIsBetter={higherIsBetter}
        format="percentage"
        size="sm"
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
