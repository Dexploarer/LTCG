/**
 * Admin utilities for testing
 * TEMPORARY - for development only
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Delete a user by email (admin operation)
 * For testing purposes only
 */
export const deleteUserByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      return { success: false, message: `User ${args.email} not found` };
    }

    // Delete sessions for this user
    const sessions = await ctx.db
      .query("sessions")
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
export const deleteAllTestUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();

    let deletedCount = 0;
    for (const user of allUsers) {
      if (user.email?.includes("testuser")) {
        // Delete sessions
        const sessions = await ctx.db
          .query("sessions")
          .withIndex("userId", (q) => q.eq("userId", user._id))
          .collect();

        for (const session of sessions) {
          await ctx.db.delete(session._id);
        }

        await ctx.db.delete(user._id);
        deletedCount++;
      }
    }

    return { success: true, deletedCount, message: `Deleted ${deletedCount} test users` };
  },
});

/**
 * Get all test users for validation
 */
export const getAllTestUsers = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();

    const testUsers = allUsers.filter((user) => user.email?.includes("testuser"));

    return testUsers.map((user) => ({
      _id: user._id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    }));
  },
});
