import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { STARTER_DECKS, VALID_DECK_CODES } from "./seeds/starterDecks";

const MAX_AGENTS_PER_USER = 3;

// Generate a cryptographically secure API key
function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = new Uint8Array(32);
  crypto.getRandomValues(randomValues);
  const key = Array.from(randomValues)
    .map((byte) => chars[byte % chars.length])
    .join("");
  return `ltcg_${key}`;
}

// Hash API key using a deterministic hash function
function hashApiKey(key: string): string {
  // Simple but effective hash for API key storage
  let hash1 = 0;
  let hash2 = 0;
  let hash3 = 0;
  let hash4 = 0;

  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1 + char) | 0;
    hash2 = ((hash2 << 7) - hash2 + char * 31) | 0;
    hash3 = ((hash3 << 11) - hash3 + char * 37) | 0;
    hash4 = ((hash4 << 13) - hash4 + char * 41) | 0;
  }

  return [
    Math.abs(hash1).toString(16).padStart(8, "0"),
    Math.abs(hash2).toString(16).padStart(8, "0"),
    Math.abs(hash3).toString(16).padStart(8, "0"),
    Math.abs(hash4).toString(16).padStart(8, "0"),
  ].join("");
}

// Get key prefix for display (first 12 chars including "ltcg_")
function getKeyPrefix(key: string): string {
  return `${key.substring(0, 12)}...`;
}

// ============================================
// QUERIES
// ============================================

/**
 * Get all available starter decks
 */
export const getStarterDecks = query({
  args: {},
  handler: async (ctx) => {
    // First check if we have seeded data in the database
    const dbDecks = await ctx.db
      .query("starterDeckDefinitions")
      .withIndex("by_available", (q) => q.eq("isAvailable", true))
      .collect();

    if (dbDecks.length > 0) {
      return dbDecks;
    }

    // Fall back to static definitions if not seeded
    return STARTER_DECKS.map((deck) => ({
      ...deck,
      isAvailable: true,
      createdAt: Date.now(),
    }));
  },
});

/**
 * Get all agents for the authenticated user
 */
export const getUserAgents = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return [];
    }

    // Get all active agents for this user
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .collect();

    // Filter to only active agents and get their API key prefixes
    const activeAgents = agents.filter((a) => a.isActive);

    const agentsWithKeys = await Promise.all(
      activeAgents.map(async (agent) => {
        const apiKey = await ctx.db
          .query("apiKeys")
          .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
          .filter((q) => q.eq(q.field("isActive"), true))
          .first();

        return {
          ...agent,
          keyPrefix: apiKey?.keyPrefix || null,
        };
      })
    );

    return agentsWithKeys;
  },
});

/**
 * Get the count of active agents for a user
 */
export const getAgentCount = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return 0;
    }

    const agents = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .collect();

    return agents.filter((a) => a.isActive).length;
  },
});

/**
 * Get a single agent by ID (for the owner)
 */
export const getAgent = query({
  args: {
    token: v.string(),
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const agent = await ctx.db.get(args.agentId);

    if (!agent || agent.userId !== session.userId || !agent.isActive) {
      return null;
    }

    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return {
      ...agent,
      keyPrefix: apiKey?.keyPrefix || null,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Register a new AI agent
 */
export const registerAgent = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    profilePictureUrl: v.optional(v.string()),
    socialLink: v.optional(v.string()),
    starterDeckCode: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Validate session
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    // 2. Check agent limit
    const existingAgents = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .collect();

    const activeCount = existingAgents.filter((a) => a.isActive).length;

    if (activeCount >= MAX_AGENTS_PER_USER) {
      throw new Error(`Maximum ${MAX_AGENTS_PER_USER} agents allowed per account`);
    }

    // 3. Validate agent name
    const trimmedName = args.name.trim();

    if (trimmedName.length < 3 || trimmedName.length > 32) {
      throw new Error("Agent name must be between 3 and 32 characters");
    }

    // Check for valid characters (alphanumeric, spaces, underscores, hyphens)
    if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmedName)) {
      throw new Error(
        "Agent name can only contain letters, numbers, spaces, underscores, and hyphens"
      );
    }

    // Check uniqueness per user
    const duplicateName = existingAgents.find(
      (a) => a.isActive && a.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicateName) {
      throw new Error("You already have an agent with this name");
    }

    // 4. Validate starter deck code
    if (!VALID_DECK_CODES.includes(args.starterDeckCode as any)) {
      throw new Error("Invalid starter deck selection");
    }

    // 5. Validate optional URLs
    if (args.profilePictureUrl) {
      try {
        new URL(args.profilePictureUrl);
      } catch {
        throw new Error("Invalid profile picture URL");
      }
    }

    if (args.socialLink) {
      try {
        new URL(args.socialLink);
      } catch {
        throw new Error("Invalid social link URL");
      }
    }

    // 6. Create agent record
    const agentId = await ctx.db.insert("agents", {
      userId: session.userId,
      name: trimmedName,
      profilePictureUrl: args.profilePictureUrl,
      socialLink: args.socialLink,
      starterDeckCode: args.starterDeckCode,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
      },
      createdAt: Date.now(),
      isActive: true,
    });

    // 7. Generate and store API key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);
    const keyPrefix = getKeyPrefix(apiKey);

    await ctx.db.insert("apiKeys", {
      agentId,
      userId: session.userId,
      keyHash,
      keyPrefix,
      isActive: true,
      createdAt: Date.now(),
    });

    return {
      agentId,
      apiKey, // Full key - shown only once!
      keyPrefix,
      message: "Agent registered successfully",
    };
  },
});

/**
 * Regenerate API key for an agent
 */
export const regenerateApiKey = mutation({
  args: {
    token: v.string(),
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    // Verify agent ownership
    const agent = await ctx.db.get(args.agentId);

    if (!agent || agent.userId !== session.userId) {
      throw new Error("Agent not found");
    }

    if (!agent.isActive) {
      throw new Error("Agent has been deleted");
    }

    // Deactivate all existing keys for this agent
    const existingKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    for (const key of existingKeys) {
      if (key.isActive) {
        await ctx.db.patch(key._id, { isActive: false });
      }
    }

    // Generate new key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);
    const keyPrefix = getKeyPrefix(apiKey);

    await ctx.db.insert("apiKeys", {
      agentId: args.agentId,
      userId: session.userId,
      keyHash,
      keyPrefix,
      isActive: true,
      createdAt: Date.now(),
    });

    return {
      apiKey, // Full key - shown only once!
      keyPrefix,
    };
  },
});

/**
 * Update agent profile
 */
export const updateAgent = mutation({
  args: {
    token: v.string(),
    agentId: v.id("agents"),
    name: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
    socialLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    // Verify agent ownership
    const agent = await ctx.db.get(args.agentId);

    if (!agent || agent.userId !== session.userId) {
      throw new Error("Agent not found");
    }

    if (!agent.isActive) {
      throw new Error("Agent has been deleted");
    }

    const updates: Partial<{
      name: string;
      profilePictureUrl: string;
      socialLink: string;
    }> = {};

    // Validate and set name if provided
    if (args.name !== undefined) {
      const trimmedName = args.name.trim();

      if (trimmedName.length < 3 || trimmedName.length > 32) {
        throw new Error("Agent name must be between 3 and 32 characters");
      }

      if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmedName)) {
        throw new Error(
          "Agent name can only contain letters, numbers, spaces, underscores, and hyphens"
        );
      }

      // Check uniqueness (excluding current agent)
      const existingAgents = await ctx.db
        .query("agents")
        .withIndex("by_user", (q) => q.eq("userId", session.userId))
        .collect();

      const duplicateName = existingAgents.find(
        (a) =>
          a._id !== args.agentId && a.isActive && a.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (duplicateName) {
        throw new Error("You already have an agent with this name");
      }

      updates.name = trimmedName;
    }

    // Validate URLs if provided
    if (args.profilePictureUrl !== undefined) {
      if (args.profilePictureUrl) {
        try {
          new URL(args.profilePictureUrl);
        } catch {
          throw new Error("Invalid profile picture URL");
        }
      }
      updates.profilePictureUrl = args.profilePictureUrl;
    }

    if (args.socialLink !== undefined) {
      if (args.socialLink) {
        try {
          new URL(args.socialLink);
        } catch {
          throw new Error("Invalid social link URL");
        }
      }
      updates.socialLink = args.socialLink;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.agentId, updates);
    }

    return { success: true };
  },
});

/**
 * Delete (deactivate) an agent
 */
export const deleteAgent = mutation({
  args: {
    token: v.string(),
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    // Verify agent ownership
    const agent = await ctx.db.get(args.agentId);

    if (!agent || agent.userId !== session.userId) {
      throw new Error("Agent not found");
    }

    // Soft delete - deactivate agent
    await ctx.db.patch(args.agentId, { isActive: false });

    // Deactivate all API keys for this agent
    const apiKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    for (const key of apiKeys) {
      if (key.isActive) {
        await ctx.db.patch(key._id, { isActive: false });
      }
    }

    return { success: true };
  },
});
