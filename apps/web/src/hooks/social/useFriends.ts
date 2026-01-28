"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "../auth/useConvexAuthHook";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

/**
 * useFriends Hook
 *
 * Complete friends management:
 * - View friends list with online status
 * - Send/accept/decline friend requests
 * - Cancel sent requests
 * - Remove friends (unfriend)
 * - Block/unblock users
 * - Search for users
 */
export function useFriends() {
  const { isAuthenticated } = useAuth();

  // Queries
  const friends = useQuery(
    api.friends.getFriends,
    isAuthenticated ? {} : "skip"
  );

  const incomingRequests = useQuery(
    api.friends.getIncomingRequests,
    isAuthenticated ? {} : "skip"
  );

  const outgoingRequests = useQuery(
    api.friends.getOutgoingRequests,
    isAuthenticated ? {} : "skip"
  );

  const blockedUsers = useQuery(
    api.friends.getBlockedUsers,
    isAuthenticated ? {} : "skip"
  );

  // Mutations
  const sendRequestMutation = useMutation(api.friends.sendFriendRequest);
  const acceptRequestMutation = useMutation(api.friends.acceptFriendRequest);
  const declineRequestMutation = useMutation(api.friends.declineFriendRequest);
  const cancelRequestMutation = useMutation(api.friends.cancelFriendRequest);
  const removeFriendMutation = useMutation(api.friends.removeFriend);
  const blockUserMutation = useMutation(api.friends.blockUser);
  const unblockUserMutation = useMutation(api.friends.unblockUser);

  // Actions
  const sendFriendRequest = async (friendUsername: string) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      const result = await sendRequestMutation({ friendUsername });
      if (result.autoAccepted) {
        toast.success(`You are now friends with ${friendUsername}!`);
      } else {
        toast.success(`Friend request sent to ${friendUsername}`);
      }
      return result;
    } catch (error: any) {
      toast.error(error.message || "Failed to send friend request");
      throw error;
    }
  };

  const acceptFriendRequest = async (friendId: Id<"users">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await acceptRequestMutation({ friendId });
      toast.success("Friend request accepted!");
    } catch (error: any) {
      toast.error(error.message || "Failed to accept friend request");
      throw error;
    }
  };

  const declineFriendRequest = async (friendId: Id<"users">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await declineRequestMutation({ friendId });
      toast.info("Friend request declined");
    } catch (error: any) {
      toast.error(error.message || "Failed to decline friend request");
      throw error;
    }
  };

  const cancelFriendRequest = async (friendId: Id<"users">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await cancelRequestMutation({ friendId });
      toast.info("Friend request cancelled");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel friend request");
      throw error;
    }
  };

  const removeFriend = async (friendId: Id<"users">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await removeFriendMutation({ friendId });
      toast.info("Friend removed");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove friend");
      throw error;
    }
  };

  const blockUser = async (friendId: Id<"users">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await blockUserMutation({ friendId });
      toast.success("User blocked");
    } catch (error: any) {
      toast.error(error.message || "Failed to block user");
      throw error;
    }
  };

  const unblockUser = async (friendId: Id<"users">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await unblockUserMutation({ friendId });
      toast.success("User unblocked");
    } catch (error: any) {
      toast.error(error.message || "Failed to unblock user");
      throw error;
    }
  };

  // Helper function for searching users
  const searchUsers = (query: string, limit?: number) => {
    if (!isAuthenticated) return null;
    return useQuery(
      api.friends.searchUsers,
      query.length > 0 ? { query, limit } : "skip"
    );
  };

  return {
    // Data
    friends,
    incomingRequests,
    outgoingRequests,
    blockedUsers,

    // Counts
    friendCount: friends?.length || 0,
    incomingRequestCount: incomingRequests?.length || 0,
    outgoingRequestCount: outgoingRequests?.length || 0,

    // Online friends
    onlineFriends: friends?.filter((f: NonNullable<typeof friends>[number]) => f.isOnline) || [],
    onlineCount: friends?.filter((f: NonNullable<typeof friends>[number]) => f.isOnline).length || 0,

    // Loading states
    isLoading: friends === undefined,

    // Actions
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
    searchUsers,
  };
}
