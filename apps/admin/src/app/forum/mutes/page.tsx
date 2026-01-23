"use client";

/**
 * Forum Mutes Management Page
 *
 * Search for players and manage their forum mutes.
 */

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdmin } from "@/contexts/AdminContext";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Card, Text, Title } from "@tremor/react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";

// =============================================================================
// Types
// =============================================================================

type MuteType = "post" | "react" | "full";

interface Mute {
  _id: Id<"forumMutes">;
  playerId: Id<"players">;
  categoryId?: Id<"forumCategories">;
  muteType: MuteType;
  mutedAt: number;
  mutedUntil?: number;
  isPermanent: boolean;
  reason: string;
  mutedById: Id<"players">;
  isActive: boolean;
}

interface PlayerSearchResult {
  playerId: Id<"players">;
  name: string;
  type: string;
  eloRating: number;
}

// Duration options in milliseconds
const DURATION_OPTIONS = [
  { label: "1 hour", value: 60 * 60 * 1000 },
  { label: "6 hours", value: 6 * 60 * 60 * 1000 },
  { label: "24 hours", value: 24 * 60 * 60 * 1000 },
  { label: "3 days", value: 3 * 24 * 60 * 60 * 1000 },
  { label: "7 days", value: 7 * 24 * 60 * 60 * 1000 },
  { label: "30 days", value: 30 * 24 * 60 * 60 * 1000 },
  { label: "Permanent", value: 0 },
];

// =============================================================================
// Component
// =============================================================================

export default function ForumMutesPage() {
  const { playerId } = useAdmin();

  // State
  const [selectedPlayerId, setSelectedPlayerId] = useState<Id<"players"> | null>(null);
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [unmuteDialogOpen, setUnmuteDialogOpen] = useState(false);
  const [selectedMute, setSelectedMute] = useState<Mute | null>(null);
  const [unmuteReason, setUnmuteReason] = useState("");

  // Mute form state
  const [muteType, setMuteType] = useState<MuteType>("post");
  const [muteDuration, setMuteDuration] = useState<number>(24 * 60 * 60 * 1000);
  const [muteReason, setMuteReason] = useState("");
  const [muteNotes, setMuteNotes] = useState("");

  // Query for player list (to search/select)
  const players = useQuery(api.players.players.getLeaderboardRanked, {
    limit: 100,
  });

  // Query for selected player's mutes
  const playerMutes = useQuery(
    api.admin.forumModeration.getUserMutes,
    selectedPlayerId ? { playerId: selectedPlayerId } : "skip"
  );

  // Mutations
  const muteUser = useMutation(api.admin.forumModeration.muteUser);
  const unmuteUser = useMutation(api.admin.forumModeration.unmuteUser);

  // Handlers
  const handleMute = async () => {
    if (!playerId || !selectedPlayerId) return;
    try {
      await muteUser({
        moderatorId: playerId,
        playerId: selectedPlayerId,
        muteType,
        durationMs: muteDuration === 0 ? undefined : muteDuration,
        reason: muteReason,
        notes: muteNotes || undefined,
      });
      setMuteDialogOpen(false);
      resetMuteForm();
    } catch (error) {
      console.error("Failed to mute user:", error);
    }
  };

  const handleUnmute = async () => {
    if (!playerId || !selectedMute) return;
    try {
      await unmuteUser({
        moderatorId: playerId,
        muteId: selectedMute._id,
        reason: unmuteReason,
      });
      setUnmuteDialogOpen(false);
      setSelectedMute(null);
      setUnmuteReason("");
    } catch (error) {
      console.error("Failed to unmute user:", error);
    }
  };

  const openUnmuteDialog = (mute: Mute) => {
    setSelectedMute(mute);
    setUnmuteDialogOpen(true);
  };

  const resetMuteForm = () => {
    setMuteType("post");
    setMuteDuration(24 * 60 * 60 * 1000);
    setMuteReason("");
    setMuteNotes("");
  };

  const selectedPlayer = players?.find((p: PlayerSearchResult) => p.playerId === selectedPlayerId);

  return (
    <PageWrapper
      title="Forum Mutes"
      description="Manage user forum mutes and restrictions"
      actions={
        <Button variant="outline" asChild>
          <Link href="/forum">
            <span className="mr-2">←</span>
            Back to Forum
          </Link>
        </Button>
      }
    >
      {/* Player Selection */}
      <Card>
        <Title>Select Player</Title>
        <Text className="text-muted-foreground">
          Search for a player to view or manage their forum mutes.
        </Text>
        <div className="mt-4">
          <Select
            value={selectedPlayerId || ""}
            onValueChange={(v) => setSelectedPlayerId(v as Id<"players">)}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a player..." />
            </SelectTrigger>
            <SelectContent>
              {players?.map((player: PlayerSearchResult) => (
                <SelectItem key={player.playerId} value={player.playerId}>
                  {player.name} ({player.type}) - {player.eloRating} ELO
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Selected Player Info & Mutes */}
      {selectedPlayerId && (
        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <Title>{selectedPlayer?.name || "Player"}</Title>
              <Text className="text-muted-foreground">
                {selectedPlayer?.type} - {selectedPlayer?.eloRating} ELO
              </Text>
            </div>
            <Button onClick={() => setMuteDialogOpen(true)}>
              <span className="mr-2">🔇</span>
              Mute User
            </Button>
          </div>

          <div className="mt-6">
            <Text className="font-medium mb-3">Active Mutes</Text>
            {playerMutes === undefined ? (
              <div className="py-4 text-center text-muted-foreground">Loading...</div>
            ) : playerMutes.length === 0 ? (
              <div className="py-8 text-center rounded-lg bg-muted/30">
                <span className="text-3xl">✅</span>
                <Text className="mt-2">No active mutes for this player.</Text>
              </div>
            ) : (
              <div className="space-y-3">
                {playerMutes.map((mute: Mute) => (
                  <div
                    key={mute._id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getMuteVariant(mute.muteType)}>
                          {formatMuteType(mute.muteType)}
                        </Badge>
                        {mute.isPermanent ? (
                          <Badge variant="destructive">Permanent</Badge>
                        ) : (
                          <Badge variant="outline">Expires {formatDate(mute.mutedUntil)}</Badge>
                        )}
                        {mute.categoryId && <Badge variant="secondary">Category-specific</Badge>}
                      </div>
                      <Text className="mt-2 text-sm text-muted-foreground">{mute.reason}</Text>
                      <Text className="mt-1 text-xs text-muted-foreground">
                        Muted on {formatDate(mute.mutedAt)}
                      </Text>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openUnmuteDialog(mute)}>
                      Unmute
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Quick Info */}
      {!selectedPlayerId && (
        <Card className="mt-6">
          <Title>Mute Types</Title>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="default">Post</Badge>
              <Text className="text-sm text-muted-foreground">
                User cannot create new threads or reply to threads
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">React</Badge>
              <Text className="text-sm text-muted-foreground">User cannot react to posts</Text>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="destructive">Full</Badge>
              <Text className="text-sm text-muted-foreground">
                User cannot post, reply, or react - full forum restriction
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* Mute Dialog */}
      <Dialog open={muteDialogOpen} onOpenChange={setMuteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mute User from Forums</DialogTitle>
            <DialogDescription>
              Restrict {selectedPlayer?.name || "this user"} from forum activities.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mute Type</Label>
              <Select value={muteType} onValueChange={(v) => setMuteType(v as MuteType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Post - Cannot post or reply</SelectItem>
                  <SelectItem value="react">React - Cannot react to posts</SelectItem>
                  <SelectItem value="full">Full - All forum restrictions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={muteDuration.toString()}
                onValueChange={(v) => setMuteDuration(Number.parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason (visible to user)</Label>
              <Textarea
                value={muteReason}
                onChange={(e) => setMuteReason(e.target.value)}
                placeholder="Explain why this user is being muted..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Internal Notes (optional)</Label>
              <Textarea
                value={muteNotes}
                onChange={(e) => setMuteNotes(e.target.value)}
                placeholder="Additional context for moderators..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMuteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleMute} disabled={!muteReason.trim()}>
              Mute User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unmute Dialog */}
      <Dialog open={unmuteDialogOpen} onOpenChange={setUnmuteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unmute User</DialogTitle>
            <DialogDescription>Remove this mute from the user.</DialogDescription>
          </DialogHeader>

          {selectedMute && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center gap-2">
                  <Badge variant={getMuteVariant(selectedMute.muteType)}>
                    {formatMuteType(selectedMute.muteType)}
                  </Badge>
                  {selectedMute.isPermanent && <Badge variant="destructive">Permanent</Badge>}
                </div>
                <Text className="mt-2 text-sm">{selectedMute.reason}</Text>
              </div>

              <div className="space-y-2">
                <Label>Reason for unmuting</Label>
                <Textarea
                  value={unmuteReason}
                  onChange={(e) => setUnmuteReason(e.target.value)}
                  placeholder="Explain why this mute is being removed..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUnmuteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUnmute} disabled={!unmuteReason.trim()}>
              Unmute User
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

function formatMuteType(type: MuteType): string {
  const map: Record<MuteType, string> = {
    post: "Post Mute",
    react: "React Mute",
    full: "Full Mute",
  };
  return map[type] || type;
}

function getMuteVariant(type: MuteType): "default" | "secondary" | "destructive" {
  const map: Record<MuteType, "default" | "secondary" | "destructive"> = {
    post: "default",
    react: "secondary",
    full: "destructive",
  };
  return map[type] || "default";
}

function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return "Never";
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
