"use client";

/**
 * ChartCard Component
 *
 * Reusable chart container with consistent styling and loading states.
 * Wraps Tremor charts with admin dashboard styling.
 */

import { Card, Flex, Text, Title } from "@tremor/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// =============================================================================
// Types
// =============================================================================

export interface ChartCardProps {
  /** Card title */
  title: string;
  /** Optional description */
  description?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Chart content */
  children: ReactNode;
  /** Optional link for "View Details" button */
  detailsLink?: string;
  /** Details link text */
  detailsLinkText?: string;
  /** Optional className */
  className?: string;
  /** Chart height class */
  chartHeight?: string;
  /** Optional header actions */
  headerActions?: ReactNode;
}

// =============================================================================
// Component
// =============================================================================

export function ChartCard({
  title,
  description,
  isLoading = false,
  children,
  detailsLink,
  detailsLinkText = "View Details",
  className = "",
  chartHeight = "h-64",
  headerActions,
}: ChartCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <Flex justifyContent="between" alignItems="center">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            {description && <Skeleton className="h-4 w-48" />}
          </div>
          {detailsLink && <Skeleton className="h-8 w-24" />}
        </Flex>
        <Skeleton className={`mt-4 w-full ${chartHeight}`} />
      </Card>
    );
  }

  return (
    <Card className={className}>
      <Flex justifyContent="between" alignItems="center">
        <div>
          <Title>{title}</Title>
          {description && <Text className="text-muted-foreground">{description}</Text>}
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
          {detailsLink && (
            <Button variant="outline" size="sm" asChild>
              <Link href={detailsLink}>{detailsLinkText}</Link>
            </Button>
          )}
        </div>
      </Flex>
      <div className={`mt-4 ${chartHeight}`}>{children}</div>
    </Card>
  );
}
