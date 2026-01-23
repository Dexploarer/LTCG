"use client";

/**
 * MetricTile Component
 *
 * Compact metric display with trend indicators and sparklines.
 * Expert-level design for dense data presentation.
 */

import { BadgeDelta, Card, Flex, SparkAreaChart, Text } from "@tremor/react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// =============================================================================
// Types
// =============================================================================

type DeltaType = "increase" | "decrease" | "unchanged" | "moderateIncrease" | "moderateDecrease";

export interface MetricTileProps {
  /** Metric title */
  title: string;
  /** Current value */
  value: number | string;
  /** Optional icon */
  icon?: ReactNode;
  /** Delta value (e.g., "+12%") */
  delta?: string;
  /** Delta type for coloring */
  deltaType?: DeltaType;
  /** Sparkline data (array of numbers) */
  sparkline?: number[];
  /** Sparkline color */
  sparklineColor?: "emerald" | "blue" | "amber" | "red" | "violet" | "cyan";
  /** Loading state */
  isLoading?: boolean;
  /** Subtitle text */
  subtitle?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional className */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function MetricTile({
  title,
  value,
  icon,
  delta,
  deltaType = "unchanged",
  sparkline,
  sparklineColor = "blue",
  isLoading = false,
  subtitle,
  size = "md",
  className = "",
}: MetricTileProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          {sparkline && <Skeleton className="h-12 w-full" />}
        </div>
      </Card>
    );
  }

  const sizeStyles = {
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
  };

  const metricSize = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <Card className={`${sizeStyles[size]} ${className}`}>
      <Flex justifyContent="between" alignItems="start">
        <div className="flex-1">
          <Flex justifyContent="start" alignItems="center" className="gap-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            <Text className="text-sm font-medium text-muted-foreground">{title}</Text>
          </Flex>
          <Flex justifyContent="start" alignItems="baseline" className="mt-1 gap-2">
            <span className={`font-bold ${metricSize[size]}`}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </span>
            {delta && (
              <BadgeDelta deltaType={deltaType} size="xs">
                {delta}
              </BadgeDelta>
            )}
          </Flex>
          {subtitle && <Text className="mt-1 text-xs text-muted-foreground">{subtitle}</Text>}
        </div>
      </Flex>

      {sparkline && sparkline.length > 0 && (
        <div className="mt-3">
          <SparkAreaChart
            data={sparkline.map((value, index) => ({ index, value }))}
            categories={["value"]}
            index="index"
            colors={[sparklineColor]}
            className="h-12"
          />
        </div>
      )}
    </Card>
  );
}

// =============================================================================
// MetricGrid Component
// =============================================================================

export interface MetricGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function MetricGrid({ children, columns = 4 }: MetricGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  };

  return <div className={`grid gap-4 ${gridCols[columns]}`}>{children}</div>;
}
