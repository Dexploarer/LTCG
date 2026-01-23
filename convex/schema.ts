import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    bio: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("email", ["email"])
    .index("username", ["username"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("token", ["token"])
    .index("userId", ["userId"]),

  // AI Agents registered by users
  agents: defineTable({
    userId: v.id("users"),
    name: v.string(),
    profilePictureUrl: v.optional(v.string()),
    socialLink: v.optional(v.string()),
    starterDeckCode: v.string(),
    stats: v.object({
      gamesPlayed: v.number(),
      gamesWon: v.number(),
      totalScore: v.number(),
    }),
    createdAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_name", ["name"]),

  // API keys for agents (hashed, never store plaintext)
  apiKeys: defineTable({
    agentId: v.id("agents"),
    userId: v.id("users"),
    keyHash: v.string(),
    keyPrefix: v.string(),
    lastUsedAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_key_hash", ["keyHash"])
    .index("by_agent", ["agentId"])
    .index("by_user", ["userId"]),

  // Reference data for the 4 starter decks
  starterDeckDefinitions: defineTable({
    name: v.string(),
    deckCode: v.string(),
    archetype: v.string(),
    description: v.string(),
    playstyle: v.string(),
    cardCount: v.number(),
    isAvailable: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_code", ["deckCode"])
    .index("by_available", ["isAvailable"]),

  // Global chat messages
  globalChatMessages: defineTable({
    userId: v.id("users"),
    username: v.string(),
    message: v.string(),
    createdAt: v.number(),
    isSystem: v.boolean(),
  }).index("by_created", ["createdAt"]),

  // Game lobbies for matchmaking
  gameLobbies: defineTable({
    hostId: v.id("users"),
    hostUsername: v.string(),
    hostRank: v.string(),
    hostRating: v.number(),
    deckArchetype: v.string(), // "fire", "water", "earth", "wind"
    mode: v.string(), // "casual" | "ranked"
    status: v.string(), // "waiting" | "active" | "completed" | "cancelled"
    opponentId: v.optional(v.id("users")),
    opponentUsername: v.optional(v.string()),
    opponentRank: v.optional(v.string()),
    gameId: v.optional(v.string()),
    turnNumber: v.optional(v.number()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_mode_status", ["mode", "status"])
    .index("by_host", ["hostId"])
    .index("by_created", ["createdAt"]),

  // Matchmaking queue for quick match
  matchmakingQueue: defineTable({
    userId: v.id("users"),
    username: v.string(),
    rating: v.number(),
    deckArchetype: v.string(),
    mode: v.string(), // "ranked" only for now
    joinedAt: v.number(),
  })
    .index("by_rating", ["rating"])
    .index("by_user", ["userId"]),

  // Master card definitions - all cards available in the game
  cardDefinitions: defineTable({
    name: v.string(),
    rarity: v.union(
      v.literal("common"),
      v.literal("uncommon"),
      v.literal("rare"),
      v.literal("epic"),
      v.literal("legendary")
    ),
    element: v.union(
      v.literal("fire"),
      v.literal("water"),
      v.literal("earth"),
      v.literal("wind"),
      v.literal("neutral")
    ),
    cardType: v.union(
      v.literal("creature"),
      v.literal("spell"),
      v.literal("trap"),
      v.literal("equipment")
    ),
    attack: v.optional(v.number()),
    defense: v.optional(v.number()),
    cost: v.number(),
    ability: v.optional(v.string()),
    flavorText: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_rarity", ["rarity"])
    .index("by_element", ["element"])
    .index("by_type", ["cardType"])
    .index("by_name", ["name"]),

  // Player's card inventory - tracks owned cards and quantities
  playerCards: defineTable({
    userId: v.id("users"),
    cardDefinitionId: v.id("cardDefinitions"),
    quantity: v.number(),
    isFavorite: v.boolean(),
    acquiredAt: v.number(),
    lastUpdatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_card", ["userId", "cardDefinitionId"])
    .index("by_user_favorite", ["userId", "isFavorite"]),
});
