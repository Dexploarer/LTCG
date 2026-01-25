import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get current user by session token
 */
export const currentUser = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    return user;
  },
});

/**
 * Get user by ID
 */
export const getUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) return null;

    return {
      _id: user._id,
      username: user.username,
      bio: user.bio,
      createdAt: user.createdAt,
    };
  },
});

/**
 * Get user profile by username
 */
export const getUserByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username.toLowerCase()))
      .first();

    if (!user) return null;

    return {
      _id: user._id,
      username: user.username,
      bio: user.bio,
      createdAt: user.createdAt,
    };
  },
});

/**
 * Get comprehensive user profile with stats for profile dialog
 */
export const getUserProfile = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username.toLowerCase()))
      .first();

    if (!user) return null;

    return {
      _id: user._id,
      username: user.username,
      bio: user.bio,
      createdAt: user.createdAt,
      // Stats
      totalWins: user.totalWins ?? 0,
      totalLosses: user.totalLosses ?? 0,
      rankedWins: user.rankedWins ?? 0,
      rankedLosses: user.rankedLosses ?? 0,
      casualWins: user.casualWins ?? 0,
      casualLosses: user.casualLosses ?? 0,
      storyWins: user.storyWins ?? 0,
      // Ratings
      rankedElo: user.rankedElo ?? 1000,
      casualRating: user.casualRating ?? 1000,
      // Progression
      xp: user.xp ?? 0,
      level: user.level ?? 1,
      // Player type
      isAiAgent: user.isAiAgent ?? false,
    };
  },
});
