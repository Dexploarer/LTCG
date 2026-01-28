/**
 * Admin Mutations
 *
 * Protected admin operations requiring admin authentication.
 * Includes user management and analytics.
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireAuthQuery, requireAuthMutation } from "../lib/convexAuth";
import { ErrorCode, createError } from "../lib/errorCodes";
import type { SharedCtx } from "../lib/types";
import type { Id } from "../_generated/dataModel";

/**
 * Check if user has admin role
 */
async function requireAdmin(ctx: SharedCtx, userId: Id<"users">) {
  const adminRole = await ctx.db
    .query("adminRoles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!adminRole) {
    throw createError(ErrorCode.AUTHZ_INSUFFICIENT_PERMISSIONS, {
      reason: "Admin role required",
    });
  }

  return adminRole;
}

/**
 * Delete a user by email (admin operation)
 * For testing and moderation purposes
 */
export const deleteUserByEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate admin session
    const { userId } = await requireAuthMutation(ctx);
    await requireAdmin(ctx, userId);

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      return { success: false, message: `User ${args.email} not found` };
    }

    // Delete auth sessions for this user
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete user
    await ctx.db.delete(user._id);

    return { success: true, message: `Deleted user ${args.email}` };
  },
});

/**
 * Delete all test users (emails containing "testuser")
 */
export const deleteTestUsers = mutation({
  args: {
  },
  handler: async (ctx, args) => {
    // Validate admin session
    const { userId } = await requireAuthMutation(ctx);
    await requireAdmin(ctx, userId);

    const allUsers = await ctx.db.query("users").collect();

    let deletedCount = 0;
    for (const user of allUsers) {
      if (user.email?.includes("testuser")) {
        // Delete auth sessions
        const sessions = await ctx.db
          .query("authSessions")
          .withIndex("userId", (q) => q.eq("userId", user._id))
          .collect();

        for (const session of sessions) {
          await ctx.db.delete(session._id);
        }

        await ctx.db.delete(user._id);
        deletedCount++;
      }
    }

    return {
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} test users`,
    };
  },
});

/**
 * Get user analytics (admin operation)
 */
export const getUserAnalytics = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Validate admin session
    const { userId: adminId } = await requireAuthQuery(ctx);
    await requireAdmin(ctx, adminId);

    const targetUserId = args.userId;

    if (targetUserId) {
      // Get specific user analytics
      const user = await ctx.db.get(targetUserId);
      if (!user) {
        throw new Error("User not found");
      }

      const currency = await ctx.db
        .query("playerCurrency")
        .withIndex("by_user", (q) => q.eq("userId", targetUserId))
        .first();

      const cards = await ctx.db
        .query("playerCards")
        .withIndex("by_user", (q) => q.eq("userId", targetUserId))
        .collect();

      const transactions = await ctx.db
        .query("currencyTransactions")
        .withIndex("by_user_time", (q) => q.eq("userId", targetUserId))
        .collect();

      return {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt,
        },
        currency: currency
          ? {
              gold: currency.gold,
              gems: currency.gems,
              lifetimeGoldEarned: currency.lifetimeGoldEarned,
              lifetimeGoldSpent: currency.lifetimeGoldSpent,
              lifetimeGemsEarned: currency.lifetimeGemsEarned,
              lifetimeGemsSpent: currency.lifetimeGemsSpent,
            }
          : null,
        cards: {
          totalCards: cards.reduce((sum, c) => sum + c.quantity, 0),
          uniqueCards: cards.length,
        },
        transactions: {
          total: transactions.length,
          recentTransactions: transactions.slice(0, 10),
        },
      };
    }

    // Get overall platform analytics
    const allUsers = await ctx.db.query("users").collect();
    const allCurrency = await ctx.db.query("playerCurrency").collect();
    const allTransactions = await ctx.db.query("currencyTransactions").collect();

    const totalGold = allCurrency.reduce((sum, c) => sum + c.gold, 0);
    const totalGems = allCurrency.reduce((sum, c) => sum + c.gems, 0);

    return {
      platform: {
        totalUsers: allUsers.length,
        totalGoldInCirculation: totalGold,
        totalGemsInCirculation: totalGems,
        totalTransactions: allTransactions.length,
      },
    };
  },
});

/**
 * Get all test users for validation
 */
export const getAllTestUsers = query({
  args: {
  },
  handler: async (ctx, args) => {
    // Validate admin session
    const { userId } = await requireAuthQuery(ctx);
    await requireAdmin(ctx, userId);

    const allUsers = await ctx.db.query("users").collect();

    const testUsers = allUsers.filter((user) =>
      user.email?.includes("testuser")
    );

    return testUsers.map((user) => ({
      _id: user._id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    }));
  },
});

/**
 * Add gold to current user (dev operation)
 * For development and testing purposes
 */
export const addGoldToCurrentUser = mutation({
  args: {
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthMutation(ctx);

    // Get or create user's gold field
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user's gold field
    const currentGold = user.gold ?? 0;
    await ctx.db.patch(userId, {
      gold: currentGold + args.amount,
    });

    return {
      success: true,
      previousGold: currentGold,
      newGold: currentGold + args.amount,
      amountAdded: args.amount,
    };
  },
});

/**
 * Force close any active game for current user (dev operation)
 */
export const forceCloseMyGame = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuthMutation(ctx);

    // Find user's active lobby
    const lobbies = await ctx.db
      .query("gameLobbies")
      .filter((q) =>
        q.and(
          q.or(q.eq(q.field("hostId"), userId), q.eq(q.field("opponentId"), userId)),
          q.or(q.eq(q.field("status"), "active"), q.eq(q.field("status"), "waiting"))
        )
      )
      .collect();

    for (const lobby of lobbies) {
      await ctx.db.patch(lobby._id, {
        status: "completed",
      });
    }

    // Update user presence to online
    const presence = await ctx.db
      .query("userPresence")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (presence) {
      await ctx.db.patch(presence._id, {
        status: "online",
      });
    }

    return { success: true, closedLobbies: lobbies.length };
  },
});
