import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireAuthQuery, requireAuthMutation } from "../lib/convexAuth";
import { ErrorCode, createError } from "../lib/errorCodes";
import {
  friendOperationValidator,
  friendInfoValidator,
  friendRequestValidator,
  successResponseValidator,
} from "../lib/returnValidators";

/**
 * Send a friend request to another user
 */
export const sendFriendRequest = mutation({
  args: {
    
    friendUsername: v.string(),
  },
  returns: friendOperationValidator,
  handler: async (ctx, args) => {
    const { userId } = await requireAuthMutation(ctx);

    // Find the friend by username
    const friend = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.friendUsername))
      .first();

    if (!friend) {
      throw createError(ErrorCode.NOT_FOUND_USER);
    }

    if (friend._id === userId) {
      throw createError(ErrorCode.SOCIAL_CANNOT_SELF_FRIEND);
    }

    // Check if friendship already exists
    const existingFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", userId).eq("friendId", friend._id)
      )
      .first();

    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        throw createError(ErrorCode.SOCIAL_ALREADY_FRIENDS);
      }
      if (existingFriendship.status === "pending" && existingFriendship.requestedBy === userId) {
        throw createError(ErrorCode.SOCIAL_REQUEST_PENDING);
      }
      if (existingFriendship.status === "pending" && existingFriendship.requestedBy !== userId) {
        // This is an incoming request! Auto-accept it
        await ctx.db.patch(existingFriendship._id, {
          status: "accepted",
          respondedAt: Date.now(),
        });

        // Update the reciprocal friendship
        const reciprocalFriendship = await ctx.db
          .query("friendships")
          .withIndex("by_user_friend", (q) =>
            q.eq("userId", friend._id).eq("friendId", userId)
          )
          .first();

        if (reciprocalFriendship) {
          await ctx.db.patch(reciprocalFriendship._id, {
            status: "accepted",
            respondedAt: Date.now(),
          });
        }

        return { success: true, autoAccepted: true };
      }
      if (existingFriendship.status === "blocked") {
        throw createError(ErrorCode.SOCIAL_USER_BLOCKED);
      }
    }

    // Check if the friend has blocked the user
    const blockedByFriend = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", friend._id).eq("friendId", userId)
      )
      .first();

    if (blockedByFriend && blockedByFriend.status === "blocked") {
      throw createError(ErrorCode.SOCIAL_USER_BLOCKED);
    }

    // No existing friendship or incoming request - this check is now redundant but kept for clarity
    const incomingRequest = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", friend._id).eq("friendId", userId)
      )
      .first();

    if (incomingRequest && incomingRequest.status === "pending") {
      // Auto-accept the incoming request instead of creating a new one
      await ctx.db.patch(incomingRequest._id, {
        status: "accepted",
        respondedAt: Date.now(),
      });

      // Create the reciprocal friendship
      await ctx.db.insert("friendships", {
        userId,
        friendId: friend._id,
        status: "accepted",
        requestedBy: friend._id,
        createdAt: incomingRequest.createdAt,
        respondedAt: Date.now(),
      });

      return { success: true, autoAccepted: true };
    }

    // Create friend request
    await ctx.db.insert("friendships", {
      userId,
      friendId: friend._id,
      status: "pending",
      requestedBy: userId,
      createdAt: Date.now(),
    });

    // Create reciprocal pending entry for the friend
    await ctx.db.insert("friendships", {
      userId: friend._id,
      friendId: userId,
      status: "pending",
      requestedBy: userId,
      createdAt: Date.now(),
    });

    return { success: true, autoAccepted: false };
  },
});

/**
 * Accept a friend request
 */
export const acceptFriendRequest = mutation({
  args: {
    
    friendId: v.id("users"),
  },
  returns: successResponseValidator,
  handler: async (ctx, args) => {
    const { userId } = await requireAuthMutation(ctx);

    // Find the pending friendship
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", userId).eq("friendId", args.friendId)
      )
      .first();

    if (!friendship) {
      throw createError(ErrorCode.NOT_FOUND_USER);
    }

    if (friendship.status !== "pending") {
      throw createError(ErrorCode.VALIDATION_INVALID_INPUT, {
        message: "This friend request is not pending",
      });
    }

    if (friendship.requestedBy === userId) {
      throw createError(ErrorCode.VALIDATION_INVALID_INPUT, {
        message: "You cannot accept your own friend request",
      });
    }

    // Update both friendship entries to accepted
    await ctx.db.patch(friendship._id, {
      status: "accepted",
      respondedAt: Date.now(),
    });

    // Update the reciprocal friendship
    const reciprocalFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", args.friendId).eq("friendId", userId)
      )
      .first();

    if (reciprocalFriendship) {
      await ctx.db.patch(reciprocalFriendship._id, {
        status: "accepted",
        respondedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Decline a friend request
 */
export const declineFriendRequest = mutation({
  args: {
    
    friendId: v.id("users"),
  },
  returns: successResponseValidator,
  handler: async (ctx, args) => {
    const { userId } = await requireAuthMutation(ctx);

    // Find the pending friendship
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", userId).eq("friendId", args.friendId)
      )
      .first();

    if (!friendship) {
      throw createError(ErrorCode.NOT_FOUND_USER);
    }

    if (friendship.status !== "pending") {
      throw createError(ErrorCode.VALIDATION_INVALID_INPUT, {
        message: "This friend request is not pending",
      });
    }

    // Delete both friendship entries
    await ctx.db.delete(friendship._id);

    const reciprocalFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", args.friendId).eq("friendId", userId)
      )
      .first();

    if (reciprocalFriendship) {
      await ctx.db.delete(reciprocalFriendship._id);
    }

    return { success: true };
  },
});

/**
 * Cancel a sent friend request
 */
export const cancelFriendRequest = mutation({
  args: {
    
    friendId: v.id("users"),
  },
  returns: successResponseValidator,
  handler: async (ctx, args) => {
    const { userId } = await requireAuthMutation(ctx);

    // Find the pending friendship
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", userId).eq("friendId", args.friendId)
      )
      .first();

    if (!friendship) {
      throw createError(ErrorCode.NOT_FOUND_USER);
    }

    if (friendship.status !== "pending") {
      throw createError(ErrorCode.VALIDATION_INVALID_INPUT, {
        message: "This friend request is not pending",
      });
    }

    if (friendship.requestedBy !== userId) {
      throw createError(ErrorCode.VALIDATION_INVALID_INPUT, {
        message: "You did not send this friend request",
      });
    }

    // Delete both friendship entries
    await ctx.db.delete(friendship._id);

    const reciprocalFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", args.friendId).eq("friendId", userId)
      )
      .first();

    if (reciprocalFriendship) {
      await ctx.db.delete(reciprocalFriendship._id);
    }

    return { success: true };
  },
});

/**
 * Remove a friend (unfriend)
 */
export const removeFriend = mutation({
  args: {
    
    friendId: v.id("users"),
  },
  returns: successResponseValidator,
  handler: async (ctx, args) => {
    const { userId } = await requireAuthMutation(ctx);

    // Find the accepted friendship
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", userId).eq("friendId", args.friendId)
      )
      .first();

    if (!friendship || friendship.status !== "accepted") {
      throw createError(ErrorCode.VALIDATION_INVALID_INPUT, {
        message: "You are not friends with this user",
      });
    }

    // Delete both friendship entries
    await ctx.db.delete(friendship._id);

    const reciprocalFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", args.friendId).eq("friendId", userId)
      )
      .first();

    if (reciprocalFriendship) {
      await ctx.db.delete(reciprocalFriendship._id);
    }

    return { success: true };
  },
});

/**
 * Block a user
 */
export const blockUser = mutation({
  args: {
    
    friendId: v.id("users"),
  },
  returns: successResponseValidator,
  handler: async (ctx, args) => {
    const { userId } = await requireAuthMutation(ctx);

    if (args.friendId === userId) {
      throw createError(ErrorCode.SOCIAL_CANNOT_SELF_FRIEND);
    }

    // Check if friendship exists
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", userId).eq("friendId", args.friendId)
      )
      .first();

    if (friendship) {
      // Update existing friendship to blocked
      await ctx.db.patch(friendship._id, {
        status: "blocked",
        respondedAt: Date.now(),
      });

      // Remove the reciprocal friendship
      const reciprocalFriendship = await ctx.db
        .query("friendships")
        .withIndex("by_user_friend", (q) =>
          q.eq("userId", args.friendId).eq("friendId", userId)
        )
        .first();

      if (reciprocalFriendship) {
        await ctx.db.delete(reciprocalFriendship._id);
      }
    } else {
      // Create new blocked entry
      await ctx.db.insert("friendships", {
        userId,
        friendId: args.friendId,
        status: "blocked",
        requestedBy: userId,
        createdAt: Date.now(),
        respondedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Unblock a user
 */
export const unblockUser = mutation({
  args: {
    
    friendId: v.id("users"),
  },
  returns: successResponseValidator,
  handler: async (ctx, args) => {
    const { userId } = await requireAuthMutation(ctx);

    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", userId).eq("friendId", args.friendId)
      )
      .first();

    if (!friendship || friendship.status !== "blocked") {
      throw createError(ErrorCode.VALIDATION_INVALID_INPUT, {
        message: "This user is not blocked",
      });
    }

    // Delete the block entry
    await ctx.db.delete(friendship._id);

    return { success: true };
  },
});

/**
 * Get list of friends
 */
export const getFriends = query({
  args: {
    
  },
  returns: v.array(friendInfoValidator),
  handler: async (ctx, args) => {
    const { userId } = await requireAuthQuery(ctx);

    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "accepted")
      )
      .collect();

    // Fetch friend details with online status
    const friends = await Promise.all(
      friendships.map(async (friendship) => {
        const friend = await ctx.db.get(friendship.friendId);
        if (!friend) return null;

        // Check if friend is online (active in last 2 minutes)
        const presence = await ctx.db
          .query("userPresence")
          .withIndex("by_user", (q) => q.eq("userId", friendship.friendId))
          .first();

        const isOnline = presence && Date.now() - presence.lastActiveAt < 120000; // 2 minutes

        return {
          userId: friend._id,
          username: friend.username,
          level: friend.level || 1,
          rankedElo: friend.rankedElo || 1000,
          isOnline,
          friendsSince: friendship.createdAt,
          lastInteraction: friendship.lastInteraction,
        };
      })
    );

    return friends.filter((f) => f !== null) as Array<{
      userId: any;
      username: string | undefined;
      level: number;
      rankedElo: number;
      isOnline: boolean;
      friendsSince: number;
      lastInteraction: number | undefined;
    }>;
  },
});

/**
 * Get pending friend requests (incoming)
 */
export const getIncomingRequests = query({
  args: {
    
  },
  returns: v.array(friendRequestValidator),
  handler: async (ctx, args) => {
    const { userId } = await requireAuthQuery(ctx);

    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "pending")
      )
      .collect();

    // Filter to only incoming requests (where requestedBy is the friendId)
    const incomingRequests = friendships.filter(
      (f) => f.requestedBy !== userId
    );

    // Fetch requester details
    const requests = await Promise.all(
      incomingRequests.map(async (friendship) => {
        const requester = await ctx.db.get(friendship.friendId);
        if (!requester) return null;

        return {
          userId: requester._id,
          username: requester.username,
          level: requester.level || 1,
          rankedElo: requester.rankedElo || 1000,
          requestedAt: friendship.createdAt,
        };
      })
    );

    return requests.filter((r) => r !== null) as Array<{
      userId: any;
      username: string | undefined;
      level: number;
      rankedElo: number;
      requestedAt: number;
    }>;
  },
});

/**
 * Get outgoing friend requests (sent)
 */
export const getOutgoingRequests = query({
  args: {
    
  },
  returns: v.array(friendRequestValidator),
  handler: async (ctx, args) => {
    const { userId } = await requireAuthQuery(ctx);

    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "pending")
      )
      .collect();

    // Filter to only outgoing requests (where requestedBy is the user)
    const outgoingRequests = friendships.filter(
      (f) => f.requestedBy === userId
    );

    // Fetch friend details
    const requests = await Promise.all(
      outgoingRequests.map(async (friendship) => {
        const friend = await ctx.db.get(friendship.friendId);
        if (!friend) return null;

        return {
          userId: friend._id,
          username: friend.username,
          level: friend.level || 1,
          rankedElo: friend.rankedElo || 1000,
          requestedAt: friendship.createdAt,
        };
      })
    );

    return requests.filter((r) => r !== null) as Array<{
      userId: any;
      username: string | undefined;
      level: number;
      rankedElo: number;
      requestedAt: number;
    }>;
  },
});

/**
 * Get blocked users list
 */
export const getBlockedUsers = query({
  args: {
    
  },
  returns: v.array(
    v.object({
      userId: v.id("users"),
      username: v.optional(v.string()),
      blockedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const { userId } = await requireAuthQuery(ctx);

    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "blocked")
      )
      .collect();

    // Fetch blocked user details
    const blockedUsers = await Promise.all(
      friendships.map(async (friendship) => {
        const blockedUser = await ctx.db.get(friendship.friendId);
        if (!blockedUser) return null;

        return {
          userId: blockedUser._id,
          username: blockedUser.username,
          blockedAt: friendship.respondedAt || friendship.createdAt,
        };
      })
    );

    return blockedUsers.filter((u) => u !== null) as Array<{
      userId: any;
      username: string | undefined;
      blockedAt: number;
    }>;
  },
});

/**
 * Search for users to add as friends
 */
export const searchUsers = query({
  args: {
    
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      userId: v.id("users"),
      username: v.optional(v.string()),
      level: v.number(),
      rankedElo: v.number(),
      friendshipStatus: v.union(
        v.null(),
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("blocked")
      ),
      isSentRequest: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const { userId } = await requireAuthQuery(ctx);
    const limit = args.limit || 20;

    // Search for users by username (case-insensitive prefix match)
    const allUsers = await ctx.db.query("users").collect();

    const matchingUsers = allUsers
      .filter((user) =>
        (user.username || user.name || "").toLowerCase().startsWith(args.query.toLowerCase()) &&
        user._id !== userId
      )
      .slice(0, limit);

    // Get friendship status for each user
    const results = await Promise.all(
      matchingUsers.map(async (user) => {
        const friendship = await ctx.db
          .query("friendships")
          .withIndex("by_user_friend", (q) =>
            q.eq("userId", userId).eq("friendId", user._id)
          )
          .first();

        return {
          userId: user._id,
          username: user.username,
          level: user.level || 1,
          rankedElo: user.rankedElo || 1000,
          friendshipStatus: friendship?.status || null,
          isSentRequest: friendship?.requestedBy === userId,
        };
      })
    );

    return results;
  },
});
