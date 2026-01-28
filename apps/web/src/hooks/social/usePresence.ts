"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "../auth/useConvexAuthHook";

/**
 * usePresence Hook
 *
 * Online user tracking.
 * Simple hook for getting online user count.
 */
export function usePresence() {
  const { isAuthenticated } = useAuth();

  const onlineUsers = useQuery(api.globalChat.getOnlineUsers, {});

  const updateMutation = useMutation(api.globalChat.updatePresence);

  return {
    onlineUsers,
    onlineCount: onlineUsers?.length || 0,
    updatePresence: async () => {
      if (!isAuthenticated) return;
      try {
        await updateMutation({});
      } catch (error) {
        console.error("Presence update failed:", error);
      }
    },
  };
}
