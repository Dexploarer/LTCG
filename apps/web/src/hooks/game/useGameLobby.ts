"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

/**
 * useGameLobby Hook
 *
 * Complete lobby lifecycle management including:
 * - Creating lobbies (casual/ranked/private)
 * - Joining lobbies (public list or join code)
 * - Cancelling and leaving lobbies
 * - Real-time lobby discovery
 */
export function useGameLobby() {
  // No auth check needed - this hook should only be used inside <Authenticated>
  const waitingLobbies = useQuery(api.games.listWaitingLobbies, {});
  const myLobby = useQuery(api.games.getActiveLobby, {});
  const privateLobby = useQuery(api.games.getMyPrivateLobby, {});

  // Mutations
  const createMutation = useMutation(api.games.createLobby);
  const joinMutation = useMutation(api.games.joinLobby);
  const joinByCodeMutation = useMutation(api.games.joinLobbyByCode);
  const cancelMutation = useMutation(api.games.cancelLobby);
  const leaveMutation = useMutation(api.games.leaveLobby);

  // Actions
  const createLobby = async (
    mode: "casual" | "ranked",
    isPrivate = false
  ) => {
    try {
      const result = await createMutation({ mode, isPrivate });
      const modeText = mode === "casual" ? "Casual" : "Ranked";
      if (isPrivate && result.joinCode) {
        toast.success(
          `${modeText} lobby created! Share code: ${result.joinCode}`
        );
      } else {
        toast.success(`${modeText} lobby created! Waiting for opponent...`);
      }
      return result;
    } catch (error: any) {
      toast.error(error.message || "Failed to create lobby");
      throw error;
    }
  };

  const joinLobby = async (
    lobbyId: Id<"gameLobbies">,
    joinCode?: string
  ) => {
    try {
      const result = await joinMutation({ lobbyId, joinCode });
      toast.success(`Joined game vs ${result.opponentUsername}`);
      return result;
    } catch (error: any) {
      toast.error(error.message || "Failed to join lobby");
      throw error;
    }
  };

  const joinByCode = async (joinCode: string) => {
    try {
      const result = await joinByCodeMutation({ joinCode });
      toast.success("Joined private game!");
      return result;
    } catch (error: any) {
      toast.error(error.message || "Failed to join with code");
      throw error;
    }
  };

  const cancelLobby = async () => {
    try {
      await cancelMutation({});
      toast.success("Lobby cancelled");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel lobby");
      throw error;
    }
  };

  const leaveLobby = async () => {
    try {
      await leaveMutation({});
      toast.success("Left lobby");
    } catch (error: any) {
      toast.error(error.message || "Failed to leave lobby");
      throw error;
    }
  };

  return {
    // Data
    waitingLobbies,
    myLobby,
    privateLobby,
    isLoading: waitingLobbies === undefined,
    hasActiveLobby: !!myLobby,

    // Actions
    createLobby,
    joinLobby,
    joinByCode,
    cancelLobby,
    leaveLobby,
  };
}
