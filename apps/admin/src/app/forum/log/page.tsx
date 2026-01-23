"use client";

/**
 * Forum Moderation Log Page
 *
 * Full audit trail of all forum moderation actions.
 */

import { DataTable, StatCard, StatGrid } from "@/components/data";
import { PageWrapper } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ColumnDef } from "@/types";
import { api } from "@convex/_generated/api";
import { BarList, Card, Text, Title } from "@tremor/react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";

// =============================================================================
// Types
// =============================================================================

interface LogEntry {
  _id: string;
  moderatorId: string;
  moderatorName: string;
  targetType: string;
  targetId: string;
  action: string;
  reason?: string;
  previousState?: string;
  newState?: string;
  createdAt: number;
}

// =============================================================================
// Column Definitions
// =============================================================================

const logColumns: ColumnDef<LogEntry>[] = [
  {
    id: "createdAt",
    header: "Time",
    accessorKey: "createdAt",
    sortable: true,
    cell: (row) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDateTime(row.createdAt)}
      </span>
    ),
  },
  {
    id: "moderatorName",
    header: "Moderator",
    accessorKey: "moderatorName",
    cell: (row) => <span className="font-medium">{row.moderatorName}</span>,
  },
  {
    id: "action",
    header: "Action",
    accessorKey: "action",
    cell: (row) => <Badge variant={getActionVariant(row.action)}>{formatAction(row.action)}</Badge>,
  },
  {
    id: "targetType",
    header: "Target",
    accessorKey: "targetType",
    cell: (row) => <Badge variant="outline">{row.targetType}</Badge>,
  },
  {
    id: "reason",
    header: "Reason",
    accessorKey: "reason",
    cell: (row) => (
      <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
        {row.reason || "-"}
      </span>
    ),
  },
];

// =============================================================================
// Type Guards
// =============================================================================

type TargetTypeFilter = "thread" | "post" | "category" | "user" | "report";

function parseTargetTypeFilter(value: string): TargetTypeFilter | undefined {
  const validTypes: TargetTypeFilter[] = ["thread", "post", "category", "user", "report"];
  return validTypes.includes(value as TargetTypeFilter) ? (value as TargetTypeFilter) : undefined;
}

// =============================================================================
// Component
// =============================================================================

export default function ForumModerationLogPage() {
  // State
  const [filterAction, setFilterAction] = useState<string | undefined>(undefined);
  const [filterTargetType, setFilterTargetType] = useState<
    "thread" | "post" | "category" | "user" | "report" | undefined
  >(undefined);

  // Queries
  const moderationLog = useQuery(
    api.admin.forumModeration.getModerationLog,
    filterTargetType
      ? { limit: 100, action: filterAction ?? undefined, targetType: filterTargetType }
      : { limit: 100, action: filterAction ?? undefined }
  );
  const moderationStats = useQuery(api.admin.forumModeration.getModerationStats, { days: 30 });

  const isLoading = moderationLog === undefined;

  // Extract unique actions for filter
  const uniqueActions = moderationStats?.byAction ? Object.keys(moderationStats.byAction) : [];

  // Transform actions for bar chart
  const actionData = moderationStats?.byAction
    ? Object.entries(moderationStats.byAction).map(([name, value]) => ({
        name: formatAction(name),
        value: typeof value === "number" ? value : 0,
      }))
    : [];

  return (
    <PageWrapper
      title="Forum Moderation Log"
      description="Complete audit trail of forum moderation actions"
      actions={
        <Button variant="outline" asChild>
          <Link href="/forum">
            <span className="mr-2">←</span>
            Back to Forum
          </Link>
        </Button>
      }
    >
      {/* Stats */}
      <StatGrid columns={4}>
        <StatCard
          title="Total Actions (30d)"
          value={moderationStats?.totalActions ?? 0}
          icon={<span className="text-lg">📊</span>}
          isLoading={moderationStats === undefined}
        />
        <StatCard
          title="Avg/Day"
          value={moderationStats?.averageActionsPerDay?.toFixed(1) ?? "0"}
          icon={<span className="text-lg">📅</span>}
          isLoading={moderationStats === undefined}
        />
        <StatCard
          title="Action Types"
          value={uniqueActions.length}
          icon={<span className="text-lg">🔧</span>}
          isLoading={moderationStats === undefined}
        />
        <StatCard
          title="Moderators Active"
          value={moderationStats?.topModerators?.length ?? 0}
          icon={<span className="text-lg">👥</span>}
          isLoading={moderationStats === undefined}
        />
      </StatGrid>

      {/* Charts Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Action Distribution */}
        <Card>
          <Title>Actions by Type (30d)</Title>
          {actionData.length > 0 ? (
            <BarList
              data={actionData.sort((a, b) => b.value - a.value)}
              className="mt-4"
              color="blue"
            />
          ) : (
            <div className="mt-4 py-8 text-center text-muted-foreground">
              No actions in the last 30 days
            </div>
          )}
        </Card>

        {/* Top Moderators */}
        <Card>
          <Title>Top Moderators (30d)</Title>
          {moderationStats?.topModerators?.length ? (
            <div className="mt-4 space-y-3">
              {moderationStats.topModerators.map(
                (mod: { moderatorName: string; actionCount: number }, idx: number) => (
                  <div key={mod.moderatorName} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span>
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </span>
                      <span className="font-medium">{mod.moderatorName}</span>
                    </div>
                    <Badge variant="secondary">{mod.actionCount}</Badge>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="mt-4 py-8 text-center text-muted-foreground">
              No moderation activity yet
            </div>
          )}
        </Card>
      </div>

      {/* Filters */}
      <Card className="mt-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Text className="font-medium">Action:</Text>
            <Select
              value={filterAction || "all"}
              onValueChange={(v) => setFilterAction(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {formatAction(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Text className="font-medium">Target:</Text>
            <Select
              value={filterTargetType || "all"}
              onValueChange={(v: string) =>
                setFilterTargetType(v === "all" ? undefined : parseTargetTypeFilter(v))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All targets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                <SelectItem value="thread">Thread</SelectItem>
                <SelectItem value="post">Post</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="report">Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(filterAction || filterTargetType) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterAction(undefined);
                setFilterTargetType(undefined);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Log Table */}
      <Card className="mt-6">
        <Title>Moderation Log</Title>
        <DataTable<LogEntry>
          data={moderationLog as LogEntry[] | undefined}
          columns={logColumns}
          rowKey="_id"
          isLoading={isLoading}
          pageSize={25}
          emptyMessage="No moderation actions found"
        />
      </Card>
    </PageWrapper>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function formatAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getActionVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action.includes("delete") || action.includes("ban")) return "destructive";
  if (action.includes("hide") || action.includes("mute")) return "default";
  if (action.includes("create") || action.includes("restore")) return "secondary";
  return "outline";
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
