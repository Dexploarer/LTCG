import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { internalMutation, mutation, query } from "../_generated/server";
import { requireAuthQuery, requireAuthMutation } from "../lib/convexAuth";
import { ErrorCode, createError } from "../lib/errorCodes";
import { cardWithOwnershipValidator } from "../lib/returnValidators";

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
// Helper function to map archetype to element for frontend compatibility
function archetypeToElement(archetype: string): "fire" | "water" | "earth" | "wind" | "neutral" {
  const mapping: Record<string, "fire" | "water" | "earth" | "wind" | "neutral"> = {
    infernal_dragons: "fire",
    abyssal_horrors: "water",
    nature_spirits: "earth",
    storm_elementals: "wind",
    fire: "fire",
    water: "water",
    earth: "earth",
    wind: "wind",
  };
  return mapping[archetype] || "neutral";
}

export const getUserCards = query({
  args: {},
  returns: v.array(cardWithOwnershipValidator), // Card with ownership info
  handler: async (ctx) => {
    const { userId } = await requireAuthQuery(ctx);

    // Get all player cards for this user
    const playerCards = await ctx.db
      .query("playerCards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
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
          archetype: cardDef.archetype,
          element: archetypeToElement(cardDef.archetype),
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
  args: {},
  returns: v.array(cardWithOwnershipValidator), // Card with ownership info
  handler: async (ctx) => {
    const { userId } = await requireAuthQuery(ctx);

    const favoriteCards = await ctx.db
      .query("playerCards")
      .withIndex("by_user_favorite", (q) => q.eq("userId", userId).eq("isFavorite", true))
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
          archetype: cardDef.archetype,
          element: archetypeToElement(cardDef.archetype),
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
  args: {},
  returns: v.object({
    uniqueCards: v.number(),
    totalCards: v.number(),
    favoriteCount: v.number(),
  }),
  handler: async (ctx) => {
    const { userId } = await requireAuthQuery(ctx);

    const playerCards = await ctx.db
      .query("playerCards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
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
    playerCardId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    isFavorite: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { userId } = await requireAuthMutation(ctx);

    const playerCard = await ctx.db.get(args.playerCardId as Id<"playerCards">);

    if (!playerCard || playerCard.userId !== userId) {
      throw createError(ErrorCode.AUTHZ_RESOURCE_FORBIDDEN, {
        reason: "Card not found or not owned by user",
      });
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
    cardDefinitionId: v.id("cardDefinitions"),
    quantity: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    newQuantity: v.number(),
  }),
  handler: async (ctx, args) => {
    const { userId } = await requireAuthMutation(ctx);

    // Check if card definition exists
    const cardDef = await ctx.db.get(args.cardDefinitionId);
    if (!cardDef || !cardDef.isActive) {
      throw createError(ErrorCode.VALIDATION_INVALID_INPUT, {
        reason: "Card definition not found or inactive",
      });
    }

    // Check if player already owns this card
    const existingCard = await ctx.db
      .query("playerCards")
      .withIndex("by_user_card", (q) =>
        q.eq("userId", userId).eq("cardDefinitionId", args.cardDefinitionId)
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
        userId,
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
  args: {},
  returns: v.object({
    success: v.boolean(),
    cardsAdded: v.number(),
  }),
  handler: async (ctx) => {
    const { userId } = await requireAuthMutation(ctx);

    // Check if user already has cards
    const existingCards = await ctx.db
      .query("playerCards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingCards) {
      throw createError(ErrorCode.VALIDATION_INVALID_INPUT, {
        reason: "User already has cards in their collection",
      });
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
        userId,
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
    archetype: v.union(
      v.literal("infernal_dragons"),
      v.literal("abyssal_horrors"),
      v.literal("nature_spirits"),
      v.literal("storm_elementals"),
      v.literal("shadow_assassins"),
      v.literal("celestial_guardians"),
      v.literal("undead_legion"),
      v.literal("divine_knights"),
      v.literal("arcane_mages"),
      v.literal("mechanical_constructs"),
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

    const cardId = await ctx.db.insert("cardDefinitions", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });

    return cardId;
  },
});
