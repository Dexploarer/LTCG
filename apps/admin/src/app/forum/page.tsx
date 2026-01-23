"use client";

/**
 * Forum Moderation Overview Page
 *
 * Central hub for forum moderation with report stats,
 * pending reports queue, and quick access to moderation tools.
 */

import { api } from "@convex/_generated/api";
import { BarList, Card, DonutChart, Text, Title } from "@tremor/react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatCard, StatGrid } from "@/components/data";
import { PageWrapper } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// =============================================================================
// Types
// =============================================================================

interface ReportByType {
  name: string;
  value: number;
}

interface PendingReport {
  _id: string;
  reportType: string;
  contentPreview: string;
  reporterName: string;
  createdAt: number;
}

interface ModerationLogEntry {
  _id: string;
  moderatorName: string;
  action: string;
  targetType: string;
  reason?: string;
  createdAt: number;
}

interface TopModerator {
  moderatorName: string;
  actionCount: number;
}

// =============================================================================
// Component
// =============================================================================

export default function ForumModerationPage() {
  const router = useRouter();

  // Fetch forum moderation data
  const reportStats = useQuery(api.admin.forumModeration.getReportStats);
  const pendingReports = useQuery(api.admin.forumModeration.getPendingReports, { limit: 10 });
  const moderationLog = useQuery(api.admin.forumModeration.getModerationLog, { limit: 10 });
  const moderationStats = useQuery(api.admin.forumModeration.getModerationStats, { days: 30 });

  const isLoading = reportStats === undefined;

  // Transform report types for chart
  const reportTypeData: ReportByType[] = reportStats?.byType
    ? Object.entries(reportStats.byType).map(([name, value]) => ({
        name: formatReportType(name),
        value: value as number,
      }))
    : [];

  // Transform moderation actions for chart
  const actionTypeData: ReportByType[] = moderationStats?.byAction
    ? Object.entries(moderationStats.byAction).map(([name, value]) => ({
        name: formatAction(name),
        value: value as number,
      }))
    : [];

  return (
    <PageWrapper
      title="Forum Moderation"
      description="Manage forum reports, categories, and user mutes"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/forum/categories">
              <span className="mr-2">📁</span>
              Categories
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/forum/mutes">
              <span className="mr-2">🔇</span>
              Mutes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/forum/reports">
              <span className="mr-2">🚩</span>
              Review Reports ({reportStats?.pending ?? 0})
            </Link>
          </Button>
        </div>
      }
    >
      {/* Overview Stats */}
      <StatGrid columns={4}>
        <StatCard
          title="Pending Reports"
          value={reportStats?.pending ?? 0}
          icon={<span className="text-lg">🚩</span>}
          subtitle={reportStats?.todayReports ? `+${reportStats.todayReports} today` : undefined}
          isLoading={isLoading}
        />
        <StatCard
          title="Reviewed"
          value={reportStats?.reviewed ?? 0}
          icon={<span className="text-lg">👁️</span>}
          subtitle="No action needed"
          isLoading={isLoading}
        />
        <StatCard
          title="Actions Taken"
          value={reportStats?.actionTaken ?? 0}
          icon={<span className="text-lg">⚡</span>}
          subtitle="Content moderated"
          isLoading={isLoading}
        />
        <StatCard
          title="Dismissed"
          value={reportStats?.dismissed ?? 0}
          icon={<span className="text-lg">❌</span>}
          subtitle="Invalid reports"
          isLoading={isLoading}
        />
      </StatGrid>

      {/* Alert for pending reports */}
      {reportStats?.pending && reportStats.pending > 5 && (
        <Card className="mt-6 border-yellow-500/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <Title>Reports Require Attention</Title>
            </div>
            <Button size="sm" asChild>
              <Link href="/forum/reports">Review Now</Link>
            </Button>
          </div>
          <Text className="mt-2 text-muted-foreground">
            {reportStats.pending} reports are pending review. Please review them promptly to
            maintain community standards.
          </Text>
        </Card>
      )}

      {/* Charts Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Report Types Distribution */}
        <Card>
          <Title>Reports by Type</Title>
          <Text className="text-muted-foreground">Distribution of report categories</Text>
          {reportTypeData.length > 0 ? (
            <DonutChart
              className="mt-4 h-52"
              data={reportTypeData}
              category="value"
              index="name"
              colors={["red", "orange", "amber", "yellow", "lime", "emerald", "cyan"]}
              showAnimation
            />
          ) : (
            <div className="mt-4 flex h-52 items-center justify-center text-muted-foreground">
              No reports to display
            </div>
          )}
        </Card>

        {/* Moderation Actions */}
        <Card>
          <Title>Recent Mod Actions (30d)</Title>
          <Text className="text-muted-foreground">
            {moderationStats?.totalActions ?? 0} total actions
          </Text>
          {actionTypeData.length > 0 ? (
            <BarList data={actionTypeData} className="mt-4" color="blue" />
          ) : (
            <div className="mt-4 flex h-52 items-center justify-center text-muted-foreground">
              No moderation actions yet
            </div>
          )}
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="pending" className="mt-6">
        <TabsList>
          <TabsTrigger value="pending">Pending Reports ({reportStats?.pending ?? 0})</TabsTrigger>
          <TabsTrigger value="recent">Recent Actions</TabsTrigger>
          <TabsTrigger value="moderators">Top Moderators</TabsTrigger>
        </TabsList>

        {/* Pending Reports Tab */}
        <TabsContent value="pending" className="mt-4">
          <Card>
            <div className="flex items-center justify-between">
              <Title>Pending Reports</Title>
              <Button variant="outline" size="sm" asChild>
                <Link href="/forum/reports">View All</Link>
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {pendingReports === undefined ? (
                <div className="py-8 text-center text-muted-foreground">Loading...</div>
              ) : pendingReports.length === 0 ? (
                <div className="py-8 text-center">
                  <span className="text-3xl">✅</span>
                  <Text className="mt-2">No pending reports. Great job!</Text>
                </div>
              ) : (
                pendingReports.map((report: PendingReport) => (
                  <div
                    key={report._id}
                    role="button"
                    tabIndex={0}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/forum/reports?id=${report._id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/forum/reports?id=${report._id}`);
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={getReportVariant(report.reportType)}>
                          {formatReportType(report.reportType)}
                        </Badge>
                        <Text className="text-sm text-muted-foreground">
                          by {report.reporterName}
                        </Text>
                      </div>
                      <Text className="mt-1 truncate text-sm">
                        {report.contentPreview || "No preview available"}
                      </Text>
                    </div>
                    <Text className="text-xs text-muted-foreground ml-4">
                      {formatTimeAgo(report.createdAt)}
                    </Text>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Recent Actions Tab */}
        <TabsContent value="recent" className="mt-4">
          <Card>
            <div className="flex items-center justify-between">
              <Title>Recent Moderation Actions</Title>
              <Button variant="outline" size="sm" asChild>
                <Link href="/forum/log">View Full Log</Link>
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {moderationLog === undefined ? (
                <div className="py-8 text-center text-muted-foreground">Loading...</div>
              ) : moderationLog.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No recent moderation actions
                </div>
              ) : (
                moderationLog.map((log: ModerationLogEntry) => (
                  <div
                    key={log._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{log.moderatorName}</span>
                        <Badge variant="outline">{formatAction(log.action)}</Badge>
                        <Badge variant="secondary">{log.targetType}</Badge>
                      </div>
                      {log.reason && (
                        <Text className="mt-1 truncate text-sm text-muted-foreground">
                          {log.reason}
                        </Text>
                      )}
                    </div>
                    <Text className="text-xs text-muted-foreground ml-4">
                      {formatTimeAgo(log.createdAt)}
                    </Text>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Top Moderators Tab */}
        <TabsContent value="moderators" className="mt-4">
          <Card>
            <Title>Top Moderators (30 Days)</Title>
            <Text className="text-muted-foreground">
              Avg. {moderationStats?.averageActionsPerDay?.toFixed(1) ?? 0} actions/day
            </Text>
            <div className="mt-4 space-y-3">
              {moderationStats?.topModerators?.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No moderation activity in the last 30 days
                </div>
              ) : (
                moderationStats?.topModerators?.map((mod: TopModerator, idx: number) => (
                  <div
                    key={mod.moderatorName}
                    className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </span>
                      <span className="font-medium">{mod.moderatorName}</span>
                    </div>
                    <Badge variant="secondary">{mod.actionCount} actions</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Card>
          <Title>Review Reports</Title>
          <Text className="text-muted-foreground">Process pending user reports</Text>
          <Button className="mt-4" asChild>
            <Link href="/forum/reports">
              <span className="mr-2">🚩</span>
              Open Reports Queue
            </Link>
          </Button>
        </Card>

        <Card>
          <Title>Manage Categories</Title>
          <Text className="text-muted-foreground">Create, edit, or lock forum categories</Text>
          <Button className="mt-4" variant="outline" asChild>
            <Link href="/forum/categories">
              <span className="mr-2">📁</span>
              Category Manager
            </Link>
          </Button>
        </Card>

        <Card>
          <Title>User Mutes</Title>
          <Text className="text-muted-foreground">View and manage forum mutes</Text>
          <Button className="mt-4" variant="outline" asChild>
            <Link href="/forum/mutes">
              <span className="mr-2">🔇</span>
              Mute Manager
            </Link>
          </Button>
        </Card>
      </div>
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

function formatAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
