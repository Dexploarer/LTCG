import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all active card definitions
 */
export const getAllCardDefinitions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("cardDefinitions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

/**
 * Get a single card definition by ID
 */
export const getCardDefinition = query({
  args: { cardId: v.id("cardDefinitions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.cardId);
  },
});

/**
 * Get all cards owned by the current user (for binder)
 * Returns card definitions joined with ownership data
 */
export const getUserCards = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Get user from session
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return [];
    }

    // Get all player cards for this user
    const playerCards = await ctx.db
      .query("playerCards")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .collect();

    // Join with card definitions
    const cardsWithDefinitions = await Promise.all(
      playerCards.map(async (pc) => {
        const cardDef = await ctx.db.get(pc.cardDefinitionId);
        if (!cardDef || !cardDef.isActive) return null;

        return {
          id: pc._id.toString(),
          cardDefinitionId: pc.cardDefinitionId,
          name: cardDef.name,
          rarity: cardDef.rarity,
          element: cardDef.element,
          cardType: cardDef.cardType,
          attack: cardDef.attack,
          defense: cardDef.defense,
          cost: cardDef.cost,
          ability: cardDef.ability,
          flavorText: cardDef.flavorText,
          imageUrl: cardDef.imageUrl,
          owned: pc.quantity,
          isFavorite: pc.isFavorite,
          acquiredAt: pc.acquiredAt,
        };
      })
    );

    // Filter out nulls and return
    return cardsWithDefinitions.filter((c) => c !== null);
  },
});

/**
 * Get user's favorite cards
 */
export const getUserFavoriteCards = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return [];
    }

    const favoriteCards = await ctx.db
      .query("playerCards")
      .withIndex("by_user_favorite", (q) => q.eq("userId", session.userId).eq("isFavorite", true))
      .collect();

    const cardsWithDefinitions = await Promise.all(
      favoriteCards.map(async (pc) => {
        const cardDef = await ctx.db.get(pc.cardDefinitionId);
        if (!cardDef || !cardDef.isActive) return null;

        return {
          id: pc._id.toString(),
          cardDefinitionId: pc.cardDefinitionId,
          name: cardDef.name,
          rarity: cardDef.rarity,
          element: cardDef.element,
          cardType: cardDef.cardType,
          attack: cardDef.attack,
          defense: cardDef.defense,
          cost: cardDef.cost,
          ability: cardDef.ability,
          flavorText: cardDef.flavorText,
          imageUrl: cardDef.imageUrl,
          owned: pc.quantity,
          isFavorite: pc.isFavorite,
          acquiredAt: pc.acquiredAt,
        };
      })
    );

    return cardsWithDefinitions.filter((c) => c !== null);
  },
});

/**
 * Get collection stats for a user
 */
export const getUserCollectionStats = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return { uniqueCards: 0, totalCards: 0, favoriteCount: 0 };
    }

    const playerCards = await ctx.db
      .query("playerCards")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .collect();

    const uniqueCards = playerCards.length;
    const totalCards = playerCards.reduce((sum, pc) => sum + pc.quantity, 0);
    const favoriteCount = playerCards.filter((pc) => pc.isFavorite).length;

    return { uniqueCards, totalCards, favoriteCount };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Toggle favorite status on a card
 */
export const toggleFavorite = mutation({
  args: {
    token: v.string(),
    playerCardId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const playerCard = await ctx.db.get(args.playerCardId as Id<"playerCards">);

    if (!playerCard || playerCard.userId !== session.userId) {
      throw new Error("Card not found or not owned by user");
    }

    await ctx.db.patch(args.playerCardId as Id<"playerCards">, {
      isFavorite: !playerCard.isFavorite,
      lastUpdatedAt: Date.now(),
    });

    return { success: true, isFavorite: !playerCard.isFavorite };
  },
});

/**
 * Add cards to a player's inventory
 * Used when opening packs, winning rewards, etc.
 */
export const addCardsToInventory = mutation({
  args: {
    token: v.string(),
    cardDefinitionId: v.id("cardDefinitions"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    // Check if card definition exists
    const cardDef = await ctx.db.get(args.cardDefinitionId);
    if (!cardDef || !cardDef.isActive) {
      throw new Error("Card definition not found");
    }

    // Check if player already owns this card
    const existingCard = await ctx.db
      .query("playerCards")
      .withIndex("by_user_card", (q) =>
        q.eq("userId", session.userId).eq("cardDefinitionId", args.cardDefinitionId)
      )
      .first();

    if (existingCard) {
      // Update quantity
      await ctx.db.patch(existingCard._id, {
        quantity: existingCard.quantity + args.quantity,
        lastUpdatedAt: Date.now(),
      });
      return { success: true, newQuantity: existingCard.quantity + args.quantity };
    } else {
      // Create new ownership record
      await ctx.db.insert("playerCards", {
        userId: session.userId,
        cardDefinitionId: args.cardDefinitionId,
        quantity: args.quantity,
        isFavorite: false,
        acquiredAt: Date.now(),
        lastUpdatedAt: Date.now(),
      });
      return { success: true, newQuantity: args.quantity };
    }
  },
});

/**
 * Give a player all cards (for testing/new player setup)
 */
export const giveStarterCollection = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    // Check if user already has cards
    const existingCards = await ctx.db
      .query("playerCards")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .first();

    if (existingCards) {
      throw new Error("User already has cards in their collection");
    }

    // Get all active card definitions
    const allCards = await ctx.db
      .query("cardDefinitions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Give the player copies of each card based on rarity
    const rarityQuantities: Record<string, number> = {
      common: 4,
      uncommon: 3,
      rare: 2,
      epic: 1,
      legendary: 1,
    };

    for (const cardDef of allCards) {
      const quantity = rarityQuantities[cardDef.rarity] || 1;
      await ctx.db.insert("playerCards", {
        userId: session.userId,
        cardDefinitionId: cardDef._id,
        quantity,
        isFavorite: false,
        acquiredAt: Date.now(),
        lastUpdatedAt: Date.now(),
      });
    }

    return { success: true, cardsAdded: allCards.length };
  },
});

// ============================================================================
// INTERNAL MUTATIONS (for seeding)
// ============================================================================

/**
 * Internal mutation to create card definitions (for seeding)
 */
export const createCardDefinition = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    // Check if card with same name already exists
    const existing = await ctx.db
      .query("cardDefinitions")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("cardDefinitions", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});
