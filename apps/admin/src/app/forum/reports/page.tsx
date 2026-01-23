"use client";

/**
 * Forum Reports Queue Page
 *
 * Full interface for reviewing and actioning forum reports.
 */

import { DataTable, StatCard, StatGrid } from "@/components/data";
import { PageWrapper } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdmin } from "@/contexts/AdminContext";
import type { ColumnDef } from "@/types";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Card, Text, Title } from "@tremor/react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";

// =============================================================================
// Types
// =============================================================================

interface ReportRow {
  _id: Id<"forumReports">;
  reportType: string;
  contentPreview: string;
  reporterName: string;
  contentAuthorId: Id<"players"> | null;
  createdAt: number;
  postId?: Id<"forumPosts">;
  threadId?: Id<"forumThreads">;
}

type ReportAction = "hide_content" | "delete_content" | "warn_user" | "mute_user" | "ban_user";
type ReportTypeFilter =
  | "other"
  | "spam"
  | "harassment"
  | "inappropriate"
  | "off_topic"
  | "misinformation"
  | "bug_exploit";

const VALID_REPORT_ACTIONS: ReportAction[] = [
  "hide_content",
  "delete_content",
  "warn_user",
  "mute_user",
  "ban_user",
];

function isValidReportAction(value: string): value is ReportAction {
  return VALID_REPORT_ACTIONS.includes(value as ReportAction);
}

function isValidReportType(value: string): value is ReportTypeFilter {
  const validTypes: ReportTypeFilter[] = [
    "other",
    "spam",
    "harassment",
    "inappropriate",
    "off_topic",
    "misinformation",
    "bug_exploit",
  ];
  return validTypes.includes(value as ReportTypeFilter);
}

function parseReportTypeFilter(value: string): ReportTypeFilter | undefined {
  return isValidReportType(value) ? value : undefined;
}

// =============================================================================
// Column Definitions
// =============================================================================

const reportColumns: ColumnDef<ReportRow>[] = [
  {
    id: "reportType",
    header: "Type",
    accessorKey: "reportType",
    cell: (row) => (
      <Badge variant={getReportVariant(row.reportType)}>{formatReportType(row.reportType)}</Badge>
    ),
  },
  {
    id: "contentPreview",
    header: "Content",
    accessorKey: "contentPreview",
    cell: (row) => (
      <span className="text-sm line-clamp-2 max-w-xs">
        {row.contentPreview || "No preview available"}
      </span>
    ),
  },
  {
    id: "reporterName",
    header: "Reporter",
    accessorKey: "reporterName",
    cell: (row) => <span className="text-sm">{row.reporterName}</span>,
  },
  {
    id: "createdAt",
    header: "Reported",
    accessorKey: "createdAt",
    sortable: true,
    cell: (row) => (
      <span className="text-sm text-muted-foreground">{formatTimeAgo(row.createdAt)}</span>
    ),
  },
];

// =============================================================================
// Component
// =============================================================================

export default function ForumReportsPage() {
  const { playerId } = useAdmin();

  // State
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ReportAction>("hide_content");
  const [actionReason, setActionReason] = useState("");
  const [dismissReason, setDismissReason] = useState("");
  const [filterType, setFilterType] = useState<ReportTypeFilter | undefined>(undefined);

  // Queries
  const reportStats = useQuery(api.admin.forumModeration.getReportStats);
  const pendingReportsQueryArgs = filterType
    ? { limit: 100, reportType: filterType }
    : { limit: 100 };
  const pendingReports = useQuery(
    api.admin.forumModeration.getPendingReports,
    pendingReportsQueryArgs
  );

  // Mutations
  const reviewReport = useMutation(api.admin.forumModeration.reviewReport);
  const dismissReport = useMutation(api.admin.forumModeration.dismissReport);
  const takeReportAction = useMutation(api.admin.forumModeration.takeReportAction);

  const isLoading = pendingReports === undefined;

  // Handlers
  const handleReviewOnly = async (report: ReportRow) => {
    if (!playerId) return;
    try {
      await reviewReport({
        reportId: report._id,
        moderatorId: playerId,
        notes: "Reviewed, no action required",
      });
    } catch (error) {
      console.error("Failed to review report:", error);
    }
  };

  const handleDismiss = async () => {
    if (!playerId || !selectedReport) return;
    try {
      await dismissReport({
        reportId: selectedReport._id,
        moderatorId: playerId,
        reason: dismissReason,
      });
      setDismissDialogOpen(false);
      setSelectedReport(null);
      setDismissReason("");
    } catch (error) {
      console.error("Failed to dismiss report:", error);
    }
  };

  const handleTakeAction = async () => {
    if (!playerId || !selectedReport) return;
    try {
      await takeReportAction({
        reportId: selectedReport._id,
        moderatorId: playerId,
        action: selectedAction,
        actionReason: actionReason,
      });
      setActionDialogOpen(false);
      setSelectedReport(null);
      setActionReason("");
    } catch (error) {
      console.error("Failed to take action:", error);
    }
  };

  const openActionDialog = (report: ReportRow) => {
    setSelectedReport(report);
    setActionDialogOpen(true);
  };

  const openDismissDialog = (report: ReportRow) => {
    setSelectedReport(report);
    setDismissDialogOpen(true);
  };

  return (
    <PageWrapper
      title="Report Review Queue"
      description="Review and action pending forum reports"
      actions={
        <Button variant="outline" asChild>
          <Link href="/forum">
            <span className="mr-2">←</span>
            Back to Forum Overview
          </Link>
        </Button>
      }
    >
      {/* Stats */}
      <StatGrid columns={4}>
        <StatCard
          title="Pending"
          value={reportStats?.pending ?? 0}
          icon={<span className="text-lg">🚩</span>}
          isLoading={reportStats === undefined}
        />
        <StatCard
          title="Today"
          value={reportStats?.todayReports ?? 0}
          icon={<span className="text-lg">📅</span>}
          isLoading={reportStats === undefined}
        />
        <StatCard
          title="Actioned"
          value={reportStats?.actionTaken ?? 0}
          icon={<span className="text-lg">⚡</span>}
          isLoading={reportStats === undefined}
        />
        <StatCard
          title="Total"
          value={reportStats?.total ?? 0}
          icon={<span className="text-lg">📊</span>}
          isLoading={reportStats === undefined}
        />
      </StatGrid>

      {/* Filter */}
      <Card className="mt-6">
        <div className="flex items-center gap-4">
          <Text className="font-medium">Filter by type:</Text>
          <Select
            value={filterType || "all"}
            onValueChange={(v: string) =>
              setFilterType(v === "all" ? undefined : parseReportTypeFilter(v))
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
              <SelectItem value="harassment">Harassment</SelectItem>
              <SelectItem value="inappropriate">Inappropriate</SelectItem>
              <SelectItem value="off_topic">Off-Topic</SelectItem>
              <SelectItem value="misinformation">Misinformation</SelectItem>
              <SelectItem value="bug_exploit">Bug/Exploit</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Reports Table */}
      <Card className="mt-6">
        <Title>Pending Reports</Title>
        <DataTable<ReportRow>
          data={pendingReports as ReportRow[] | undefined}
          columns={reportColumns}
          rowKey="_id"
          isLoading={isLoading}
          pageSize={20}
          emptyMessage="No pending reports. Great job!"
          rowActions={(row) => (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleReviewOnly(row)}>
                Review
              </Button>
              <Button size="sm" variant="outline" onClick={() => openDismissDialog(row)}>
                Dismiss
              </Button>
              <Button size="sm" variant="destructive" onClick={() => openActionDialog(row)}>
                Action
              </Button>
            </div>
          )}
        />
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Moderation Action</DialogTitle>
            <DialogDescription>
              Choose an action to take on this reported content.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3">
                <Text className="text-sm font-medium">Reported Content:</Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                  {selectedReport.contentPreview || "No preview"}
                </Text>
                <div className="mt-2 flex gap-2">
                  <Badge variant={getReportVariant(selectedReport.reportType)}>
                    {formatReportType(selectedReport.reportType)}
                  </Badge>
                  <Badge variant="outline">{selectedReport.postId ? "Post" : "Thread"}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Text className="text-sm font-medium">Action to take:</Text>
                <Select
                  value={selectedAction}
                  onValueChange={(v: string) => {
                    if (isValidReportAction(v)) {
                      setSelectedAction(v);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hide_content">Hide Content</SelectItem>
                    <SelectItem value="delete_content">Delete Content</SelectItem>
                    <SelectItem value="warn_user">Warn User</SelectItem>
                    <SelectItem value="mute_user">Mute User</SelectItem>
                    <SelectItem value="ban_user">Ban User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Text className="text-sm font-medium">Reason:</Text>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Explain why this action is being taken..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleTakeAction}
              disabled={!actionReason.trim()}
            >
              Take Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dismiss Dialog */}
      <Dialog open={dismissDialogOpen} onOpenChange={setDismissDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dismiss Report</DialogTitle>
            <DialogDescription>Dismiss this report as invalid or unwarranted.</DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3">
                <Text className="text-sm text-muted-foreground">
                  {selectedReport.contentPreview || "No preview"}
                </Text>
              </div>

              <div className="space-y-2">
                <Text className="text-sm font-medium">Reason for dismissal:</Text>
                <Textarea
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  placeholder="Explain why this report is being dismissed..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDismissDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDismiss} disabled={!dismissReason.trim()}>
              Dismiss Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function formatReportType(type: string): string {
  const map: Record<string, string> = {
    spam: "Spam",
    harassment: "Harassment",
    inappropriate: "Inappropriate",
    off_topic: "Off-Topic",
    misinformation: "Misinformation",
    bug_exploit: "Bug/Exploit",
    other: "Other",
  };
  return map[type] || type;
}

function getReportVariant(type: string): "destructive" | "default" | "secondary" | "outline" {
  if (type === "harassment" || type === "spam") return "destructive";
  if (type === "inappropriate" || type === "bug_exploit") return "default";
  return "secondary";
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
