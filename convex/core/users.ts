import { v } from "convex/values";
import { query } from "../_generated/server";
import { getCurrentUser } from "../lib/convexAuth";
import { userProfileValidator, userInfoValidator, fullUserValidator } from "../lib/returnValidators";

/**
 * Get current authenticated user
 * Returns null if not authenticated
 *
 * Uses Convex Auth's built-in session management (no token parameter needed)
 */
export const currentUser = query({
  args: {},
  returns: fullUserValidator, // Full user object with all fields
  handler: async (ctx) => {
    const auth = await getCurrentUser(ctx);
    if (!auth) return null;

    const user = await ctx.db.get(auth.userId);
    return user;
  },
});

/**
 * Get user by ID (public profile info only)
 */
export const getUser = query({
  args: {
    userId: v.id("users"),
  },
  returns: userInfoValidator,
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
 * Get user profile by username (public info only)
 */
export const getUserByUsername = query({
  args: {
    username: v.string(),
  },
  returns: userInfoValidator,
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
  returns: userProfileValidator,
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
