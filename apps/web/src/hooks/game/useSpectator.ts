"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

/**
 * useSpectator Hook
 *
 * Provides spectator features for watching active games.
 * Should only be used inside <Authenticated> component.
 */
export function useSpectator(lobbyId?: Id<"gameLobbies">) {
  // No auth check needed - use inside <Authenticated>
  const activeGames = useQuery(api.games.listActiveGames, {
    mode: "all",
    limit: 50,
  });

  const spectatorView = useQuery(
    api.games.getGameSpectatorView,
    lobbyId ? { lobbyId } : "skip"
  );

  // Join/leave as spectator
  const joinMutation = useMutation(api.games.joinAsSpectator);
  const leaveMutation = useMutation(api.games.leaveAsSpectator);

  const joinAsSpectator = async (lobbyId: Id<"gameLobbies">) => {
    try {
      await joinMutation({ lobbyId });
      toast.success("Now spectating game");
    } catch (error: any) {
      toast.error(error.message || "Failed to join as spectator");
      throw error;
    }
  };

  const leaveAsSpectator = async (lobbyId: Id<"gameLobbies">) => {
    try {
      await leaveMutation({ lobbyId });
      toast.info("Stopped spectating");
    } catch (error: any) {
      toast.error(error.message || "Failed to leave spectator mode");
      throw error;
    }
  };

  return {
    activeGames,
    spectatorView,
    isLoading: activeGames === undefined,
    joinAsSpectator,
    leaveAsSpectator,
  };
}
