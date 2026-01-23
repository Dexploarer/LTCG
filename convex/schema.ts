import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    bio: v.optional(v.string()),
    activeDeckId: v.optional(v.id("userDecks")),
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

  // Admin roles for protected operations
  adminRoles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("moderator")),
    grantedBy: v.optional(v.id("users")),
    grantedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["role", "isActive"]),

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
  })
    .index("by_created", ["createdAt"])
    .index("by_user", ["userId"]),

  // User presence tracking (for online users list)
  userPresence: defineTable({
    userId: v.id("users"),
    username: v.string(),
    lastActiveAt: v.number(),
    status: v.union(
      v.literal("online"),
      v.literal("in_game"),
      v.literal("idle")
    ),
  })
    .index("by_user", ["userId"])
    .index("by_last_active", ["lastActiveAt"]),

  // Game lobbies for matchmaking
  gameLobbies: defineTable({
    hostId: v.id("users"),
    hostUsername: v.string(),
    hostRank: v.string(),
    hostRating: v.number(),
    deckArchetype: v.string(), // "fire", "water", "earth", "wind"
    mode: v.string(), // "casual" | "ranked"
    status: v.string(), // "waiting" | "active" | "completed" | "cancelled" | "forfeited"
    isPrivate: v.boolean(), // true for private matches
    joinCode: v.optional(v.string()), // 6-char code for private matches
    maxRatingDiff: v.optional(v.number()), // rating window for ranked (e.g., 200)
    opponentId: v.optional(v.id("users")),
    opponentUsername: v.optional(v.string()),
    opponentRank: v.optional(v.string()),
    gameId: v.optional(v.string()),
    turnNumber: v.optional(v.number()),
    currentTurnPlayerId: v.optional(v.id("users")), // Whose turn it is
    turnStartedAt: v.optional(v.number()), // When current turn started
    lastMoveAt: v.optional(v.number()), // Last time a move was made
    winnerId: v.optional(v.id("users")), // Winner of the game
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_mode_status", ["mode", "status"])
    .index("by_host", ["hostId"])
    .index("by_created", ["createdAt"])
    .index("by_join_code", ["joinCode"])
    .index("by_last_move", ["lastMoveAt"]),

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
    archetype: v.union(
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
    imageStorageId: v.optional(v.id("_storage")),
    thumbnailStorageId: v.optional(v.id("_storage")),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_rarity", ["rarity"])
    .index("by_archetype", ["archetype"])
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

  // User-created decks - custom deck builds
  userDecks: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    deckArchetype: v.optional(
      v.union(
        v.literal("fire"),
        v.literal("water"),
        v.literal("earth"),
        v.literal("wind"),
        v.literal("neutral")
      )
    ),
    isActive: v.boolean(), // for soft deletes
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_updated", ["updatedAt"]),

  // Cards within each user deck
  deckCards: defineTable({
    deckId: v.id("userDecks"),
    cardDefinitionId: v.id("cardDefinitions"),
    quantity: v.number(), // 1-3 copies per card
    position: v.optional(v.number()), // for card ordering
  })
    .index("by_deck", ["deckId"])
    .index("by_deck_card", ["deckId", "cardDefinitionId"]),

  // Analytics: Event tracking for user actions and system metrics
  events: defineTable({
    userId: v.id("users"),
    category: v.union(
      v.literal("user_action"),
      v.literal("game_event"),
      v.literal("system"),
      v.literal("error"),
      v.literal("performance")
    ),
    eventName: v.string(),
    properties: v.any(), // JSON object with event-specific data
    timestamp: v.number(),
  })
    .index("by_user_timestamp", ["userId", "timestamp"])
    .index("by_timestamp", ["timestamp"])
    .index("by_category", ["category", "timestamp"]),

  // File Storage: Metadata for uploaded files (images, documents, etc.)
  fileMetadata: defineTable({
    userId: v.id("users"),
    storageId: v.string(), // Reference to Convex storage
    fileName: v.string(),
    contentType: v.string(),
    size: v.number(),
    category: v.union(
      v.literal("profile_picture"),
      v.literal("card_image"),
      v.literal("document"),
      v.literal("other")
    ),
    uploadedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_category", ["userId", "category"])
    .index("by_uploaded_at", ["uploadedAt"])
    .index("by_storage_id", ["storageId"]),

  // ============================================================================
  // ECONOMY SYSTEM
  // ============================================================================

  // Player currency balances (Gold/Gems)
  playerCurrency: defineTable({
    userId: v.id("users"),
    gold: v.number(),
    gems: v.number(),
    lifetimeGoldEarned: v.number(),
    lifetimeGoldSpent: v.number(),
    lifetimeGemsEarned: v.number(),
    lifetimeGemsSpent: v.number(),
    lastUpdatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Currency transaction ledger (audit trail)
  currencyTransactions: defineTable({
    userId: v.id("users"),
    transactionType: v.union(
      v.literal("purchase"),
      v.literal("reward"),
      v.literal("sale"),
      v.literal("gift"),
      v.literal("refund"),
      v.literal("conversion"),
      v.literal("marketplace_fee"),
      v.literal("auction_bid"),
      v.literal("auction_refund")
    ),
    currencyType: v.union(v.literal("gold"), v.literal("gems")),
    amount: v.number(),
    balanceAfter: v.number(),
    referenceId: v.optional(v.string()),
    description: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user_time", ["userId", "createdAt"])
    .index("by_type", ["transactionType", "createdAt"])
    .index("by_reference", ["referenceId"]),

  // Shop product catalog
  shopProducts: defineTable({
    productId: v.string(),
    name: v.string(),
    description: v.string(),
    productType: v.union(
      v.literal("pack"),
      v.literal("box"),
      v.literal("currency")
    ),
    goldPrice: v.optional(v.number()),
    gemPrice: v.optional(v.number()),
    packConfig: v.optional(
      v.object({
        cardCount: v.number(),
        guaranteedRarity: v.optional(
          v.union(
            v.literal("common"),
            v.literal("uncommon"),
            v.literal("rare"),
            v.literal("epic"),
            v.literal("legendary")
          )
        ),
        archetype: v.optional(
          v.union(
            v.literal("fire"),
            v.literal("water"),
            v.literal("earth"),
            v.literal("wind"),
            v.literal("neutral")
          )
        ),
      })
    ),
    boxConfig: v.optional(
      v.object({
        packProductId: v.string(),
        packCount: v.number(),
        bonusCards: v.optional(v.number()),
      })
    ),
    currencyConfig: v.optional(
      v.object({
        currencyType: v.union(v.literal("gold"), v.literal("gems")),
        amount: v.number(),
      })
    ),
    isActive: v.boolean(),
    sortOrder: v.number(),
    createdAt: v.number(),
  })
    .index("by_type", ["productType", "isActive"])
    .index("by_active", ["isActive", "sortOrder"])
    .index("by_product_id", ["productId"]),

  // Pack opening history (analytics)
  packOpeningHistory: defineTable({
    userId: v.id("users"),
    productId: v.string(),
    packType: v.string(),
    cardsReceived: v.array(
      v.object({
        cardDefinitionId: v.id("cardDefinitions"),
        name: v.string(),
        rarity: v.string(),
      })
    ),
    currencyUsed: v.union(v.literal("gold"), v.literal("gems")),
    amountPaid: v.number(),
    openedAt: v.number(),
  })
    .index("by_user_time", ["userId", "openedAt"])
    .index("by_time", ["openedAt"]),

  // ============================================================================
  // MARKETPLACE
  // ============================================================================

  // Player-to-player marketplace listings
  marketplaceListings: defineTable({
    sellerId: v.id("users"),
    sellerUsername: v.string(),
    listingType: v.union(v.literal("fixed"), v.literal("auction")),
    cardDefinitionId: v.id("cardDefinitions"),
    quantity: v.number(),
    price: v.number(),
    currentBid: v.optional(v.number()),
    highestBidderId: v.optional(v.id("users")),
    highestBidderUsername: v.optional(v.string()),
    endsAt: v.optional(v.number()),
    bidCount: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("sold"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    soldTo: v.optional(v.id("users")),
    soldFor: v.optional(v.number()),
    soldAt: v.optional(v.number()),
    platformFee: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status", "createdAt"])
    .index("by_seller", ["sellerId", "status"])
    .index("by_card", ["cardDefinitionId", "status"])
    .index("by_type", ["listingType", "status"])
    .index("by_ends_at", ["endsAt"]),

  // Auction bid history
  auctionBids: defineTable({
    listingId: v.id("marketplaceListings"),
    bidderId: v.id("users"),
    bidderUsername: v.string(),
    bidAmount: v.number(),
    bidStatus: v.union(
      v.literal("active"),
      v.literal("outbid"),
      v.literal("won"),
      v.literal("refunded"),
      v.literal("cancelled")
    ),
    refundedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_listing", ["listingId", "createdAt"])
    .index("by_bidder", ["bidderId", "bidStatus"]),

  // ============================================================================
  // PROMOTIONAL CODES
  // ============================================================================

  // Redeemable promo codes
  promoCodes: defineTable({
    code: v.string(),
    description: v.string(),
    rewardType: v.union(
      v.literal("gold"),
      v.literal("gems"),
      v.literal("pack")
    ),
    rewardAmount: v.number(),
    rewardPackId: v.optional(v.string()),
    maxRedemptions: v.optional(v.number()),
    redemptionCount: v.number(),
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"]),

  // Promo code redemption history
  promoRedemptions: defineTable({
    userId: v.id("users"),
    promoCodeId: v.id("promoCodes"),
    code: v.string(),
    rewardReceived: v.string(),
    redeemedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_code", ["promoCodeId", "redeemedAt"])
    .index("by_user_code", ["userId", "promoCodeId"]),
});
