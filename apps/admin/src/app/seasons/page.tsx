"use client";

/**
 * Season Management Page
 *
 * Create, view, and manage ranked seasons.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { BarList, Card, Flex, Text, Title } from "@tremor/react";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable, StatCard, StatGrid } from "@/components/data";
import { CreateSeasonDialog } from "@/components/forms";
import { PageWrapper } from "@/components/layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleGuard } from "@/contexts/AdminContext";
import type { ColumnDef, Season } from "@/types";

// =============================================================================
// Types
// =============================================================================

interface SeasonRow extends Season {
  _id: Id<"seasons">;
}

interface TopPlayer {
  name: string;
  rating: number;
}

// =============================================================================
// Column Definitions
// =============================================================================

const columns: ColumnDef<SeasonRow>[] = [
  {
    id: "seasonId",
    header: "ID",
    accessorKey: "seasonId",
    cell: (row) => <code className="font-mono text-sm">{row.seasonId}</code>,
  },
  {
    id: "name",
    header: "Name",
    accessorKey: "name",
    sortable: true,
    cell: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <Badge variant={row.isActive ? "default" : "secondary"}>
        {row.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "startDate",
    header: "Start",
    accessorKey: "startDate",
    sortable: true,
    cell: (row) => <span className="text-sm">{new Date(row.startDate).toLocaleDateString()}</span>,
  },
  {
    id: "endDate",
    header: "End",
    accessorKey: "endDate",
    sortable: true,
    cell: (row) => <span className="text-sm">{new Date(row.endDate).toLocaleDateString()}</span>,
  },
  {
    id: "duration",
    header: "Duration",
    cell: (row) => {
      const days = Math.ceil((row.endDate - row.startDate) / (1000 * 60 * 60 * 24));
      return <span className="text-muted-foreground">{days} days</span>;
    },
  },
];

// =============================================================================
// Component
// =============================================================================

export default function SeasonsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<SeasonRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch seasons
  const seasons = useQuery(api.admin.admin.listSeasons, { limit: 50 });
  const activeSeason = seasons?.find((s: Season) => s.isActive);
  const activeSeasonStats = useQuery(
    api.admin.admin.getSeasonStats,
    activeSeason ? { seasonId: activeSeason.seasonId } : "skip"
  );

  // Mutations
  const activateSeason = useMutation(api.admin.admin.activateSeason);
  const endSeason = useMutation(api.admin.admin.endSeason);
  const updateSeason = useMutation(api.admin.admin.updateSeason);

  const isLoading = seasons === undefined;

  // Handlers
  const handleActivate = async () => {
    if (!selectedSeason) return;

    try {
      await activateSeason({ seasonId: selectedSeason.seasonId });
      toast.success(`Season "${selectedSeason.name}" activated`);
      setActivateDialogOpen(false);
      setSelectedSeason(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to activate season");
    }
  };

  const handleEnd = async () => {
    if (!selectedSeason) return;

    try {
      await endSeason({ seasonId: selectedSeason.seasonId });
      toast.success(`Season "${selectedSeason.name}" ended`);
      setEndDialogOpen(false);
      setSelectedSeason(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to end season");
    }
  };

  const handleOpenEdit = (season: SeasonRow) => {
    setSelectedSeason(season);
    setEditName(season.name);
    setEditEndDate(new Date(season.endDate).toISOString().split("T")[0]);
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedSeason) return;

    setIsUpdating(true);
    try {
      await updateSeason({
        seasonId: selectedSeason.seasonId,
        name: editName !== selectedSeason.name ? editName : undefined,
        endDate:
          new Date(editEndDate).getTime() !== selectedSeason.endDate
            ? new Date(editEndDate).getTime()
            : undefined,
      });
      toast.success(`Season "${editName}" updated`);
      setEditDialogOpen(false);
      setSelectedSeason(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update season");
    } finally {
      setIsUpdating(false);
    }
  };

  // Stats
  const totalSeasons = seasons?.length ?? 0;
  const daysRemaining = activeSeasonStats?.daysRemaining ?? 0;

  // Top players for bar list
  const topPlayersData =
    activeSeasonStats?.topPlayers.slice(0, 5).map((p: TopPlayer) => ({
      name: p.name,
      value: p.rating,
    })) ?? [];

  return (
    <PageWrapper
      title="Seasons"
      description="Manage ranked seasons and track leaderboards"
      actions={
        <RoleGuard permission="season.create">
          <Button onClick={() => setCreateOpen(true)}>
            <span className="mr-2">➕</span>
            New Season
          </Button>
        </RoleGuard>
      }
    >
      {/* Active Season Overview */}
      {activeSeason && (
        <Card className="mb-6 border-green-500/50">
          <Flex justifyContent="between" alignItems="start">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-500">
                  Active
                </Badge>
                <Title>{activeSeason.name}</Title>
              </div>
              <Text className="text-muted-foreground mt-1">
                {new Date(activeSeason.startDate).toLocaleDateString()} -{" "}
                {new Date(activeSeason.endDate).toLocaleDateString()}
              </Text>
            </div>
            <RoleGuard permission="season.edit">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSeason(activeSeason as SeasonRow);
                  setEndDialogOpen(true);
                }}
              >
                End Season
              </Button>
            </RoleGuard>
          </Flex>

          {activeSeasonStats && (
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Text className="text-2xl font-bold">{activeSeasonStats.uniquePlayers}</Text>
                <Text className="text-sm text-muted-foreground">Players</Text>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Text className="text-2xl font-bold">{activeSeasonStats.totalGames}</Text>
                <Text className="text-sm text-muted-foreground">Total Games</Text>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Text className="text-2xl font-bold">{activeSeasonStats.rankedGames}</Text>
                <Text className="text-sm text-muted-foreground">Ranked Games</Text>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Text className="text-2xl font-bold">{daysRemaining}</Text>
                <Text className="text-sm text-muted-foreground">Days Left</Text>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Stats Grid */}
      <StatGrid columns={3}>
        <StatCard
          title="Total Seasons"
          value={totalSeasons}
          icon={<span className="text-lg">🏆</span>}
          isLoading={isLoading}
        />
        <StatCard
          title="Average Rating"
          value={activeSeasonStats?.averageRating ?? 1200}
          icon={<span className="text-lg">📊</span>}
          isLoading={activeSeasonStats === undefined && !!activeSeason}
        />
        <StatCard
          title="Days Remaining"
          value={daysRemaining}
          icon={<span className="text-lg">⏳</span>}
          subtitle={activeSeason ? "Current season" : "No active season"}
          isLoading={isLoading}
        />
      </StatGrid>

      {/* Top Players */}
      {activeSeasonStats && topPlayersData.length > 0 && (
        <Card className="mt-6">
          <Title>Top Players - {activeSeason?.name}</Title>
          <BarList data={topPlayersData} className="mt-4" />
        </Card>
      )}

      {/* Seasons Table */}
      <Card className="mt-6">
        <Title>All Seasons</Title>
        <div className="mt-4">
          <DataTable<SeasonRow>
            data={seasons as SeasonRow[] | undefined}
            columns={columns}
            rowKey="_id"
            isLoading={isLoading}
            searchable
            searchPlaceholder="Search seasons..."
            searchColumns={["name", "seasonId"]}
            pageSize={10}
            emptyMessage="No seasons created yet"
            rowActions={(row) => (
              <div className="flex gap-2">
                <RoleGuard permission="season.edit">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(row)}>
                    Edit
                  </Button>
                </RoleGuard>
                {!row.isActive && (
                  <RoleGuard permission="season.edit">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSeason(row);
                        setActivateDialogOpen(true);
                      }}
                    >
                      Activate
                    </Button>
                  </RoleGuard>
                )}
                {row.isActive && (
                  <RoleGuard permission="season.edit">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSeason(row);
                        setEndDialogOpen(true);
                      }}
                    >
                      End
                    </Button>
                  </RoleGuard>
                )}
              </div>
            )}
          />
        </div>
      </Card>

      {/* Create Season Dialog */}
      <CreateSeasonDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Activate Confirmation Dialog */}
      <AlertDialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Season</AlertDialogTitle>
            <AlertDialogDescription>
              This will activate &ldquo;{selectedSeason?.name}&rdquo; and end the current active
              season. All players&apos; season ratings will be reset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate}>Activate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Season Confirmation Dialog */}
      <AlertDialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Season</AlertDialogTitle>
            <AlertDialogDescription>
              This will end &ldquo;{selectedSeason?.name}&rdquo; and archive the final leaderboard.
              A new season will need to be activated for ranked play to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnd}>End Season</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Season Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Season</DialogTitle>
            <DialogDescription>Update the season name or end date.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Season Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Season name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-end-date">End Date</Label>
              <Input
                id="edit-end-date"
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Season"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
