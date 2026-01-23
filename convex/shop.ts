import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { validateSession } from "./lib/validators";
import {
  weightedRandomRarity,
  getRandomCard,
  addCardsToInventory,
  openPack,
  type Rarity,
  type Archetype,
} from "./lib/helpers";
import { PAGINATION } from "./lib/constants";
import type { CardResult } from "./lib/types";

// ============================================================================
// PUBLIC QUERIES
// ============================================================================

/**
 * Get all active shop products
 */
export const getShopProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("shopProducts")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Sort by sortOrder
    return products.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Get player's pack opening history
 */
export const getPackOpeningHistory = query({
  args: {
    token: v.string(),
    page: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);
    const page = args.page ?? 1;
    const pageSize = PAGINATION.PACK_HISTORY_PAGE_SIZE;

    const allHistory = await ctx.db
      .query("packOpeningHistory")
      .withIndex("by_user_time", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginated = allHistory.slice(startIdx, endIdx);

    return {
      history: paginated,
      page,
      pageSize,
      total: allHistory.length,
      hasMore: endIdx < allHistory.length,
    };
  },
});

// ============================================================================
// PUBLIC MUTATIONS
// ============================================================================

/**
 * Purchase a card pack
 */
export const purchasePack = mutation({
  args: {
    token: v.string(),
    productId: v.string(),
    useGems: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);

    // Get product
    const product = await ctx.db
      .query("shopProducts")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .first();

    if (!product || !product.isActive) {
      throw new Error("Product not found or unavailable");
    }

    if (product.productType !== "pack") {
      throw new Error("This endpoint is only for pack purchases");
    }

    if (!product.packConfig) {
      throw new Error("Invalid pack configuration");
    }

    // Determine price
    const price = args.useGems ? product.gemPrice : product.goldPrice;
    const currencyType = args.useGems ? "gems" : "gold";

    if (!price || price <= 0) {
      throw new Error(`This pack cannot be purchased with ${currencyType}`);
    }

    // Deduct currency
    await ctx.runMutation(internal.economy.adjustPlayerCurrency, {
      userId,
      goldDelta: args.useGems ? 0 : -price,
      gemsDelta: args.useGems ? -price : 0,
      transactionType: "purchase",
      description: `Purchased ${product.name}`,
      referenceId: product._id,
      metadata: { productId: args.productId },
    });

    // Open pack and generate cards
    const cards = await openPack(ctx, product.packConfig, userId);

    // Record pack opening
    await ctx.db.insert("packOpeningHistory", {
      userId,
      productId: args.productId,
      packType: product.name,
      cardsReceived: cards.map((c) => ({
        cardDefinitionId: c.cardDefinitionId,
        name: c.name,
        rarity: c.rarity,
      })),
      currencyUsed: currencyType,
      amountPaid: price,
      openedAt: Date.now(),
    });

    return {
      success: true,
      productName: product.name,
      cardsReceived: cards,
      currencyUsed: currencyType,
      amountPaid: price,
    };
  },
});

/**
 * Purchase a box (multiple packs)
 */
export const purchaseBox = mutation({
  args: {
    token: v.string(),
    productId: v.string(),
    useGems: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);

    // Get product
    const product = await ctx.db
      .query("shopProducts")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .first();

    if (!product || !product.isActive) {
      throw new Error("Product not found or unavailable");
    }

    if (product.productType !== "box") {
      throw new Error("This endpoint is only for box purchases");
    }

    if (!product.boxConfig) {
      throw new Error("Invalid box configuration");
    }

    // Determine price
    const price = args.useGems ? product.gemPrice : product.goldPrice;
    const currencyType = args.useGems ? "gems" : "gold";

    if (!price || price <= 0) {
      throw new Error(`This box cannot be purchased with ${currencyType}`);
    }

    // Get pack definition
    const packProduct = await ctx.db
      .query("shopProducts")
      .withIndex("by_product_id", (q) =>
        q.eq("productId", product.boxConfig!.packProductId)
      )
      .first();

    if (!packProduct || !packProduct.packConfig) {
      throw new Error("Pack configuration not found for this box");
    }

    // Deduct currency
    await ctx.runMutation(internal.economy.adjustPlayerCurrency, {
      userId,
      goldDelta: args.useGems ? 0 : -price,
      gemsDelta: args.useGems ? -price : 0,
      transactionType: "purchase",
      description: `Purchased ${product.name}`,
      referenceId: product._id,
      metadata: { productId: args.productId },
    });

    // Open all packs
    const allCards: CardResult[] = [];
    const packCount = product.boxConfig.packCount;

    for (let i = 0; i < packCount; i++) {
      const cards = await openPack(ctx, packProduct.packConfig, userId);
      allCards.push(...cards);
    }

    // Add bonus cards if configured
    if (product.boxConfig.bonusCards && product.boxConfig.bonusCards > 0) {
      for (let i = 0; i < product.boxConfig.bonusCards; i++) {
        const rarity = weightedRandomRarity();
        const card = await getRandomCard(ctx, rarity);
        await addCardsToInventory(ctx, userId, card._id, 1);
        allCards.push({
          cardDefinitionId: card._id,
          name: card.name,
          rarity: card.rarity,
          archetype: card.archetype,
          cardType: card.cardType,
          attack: card.attack,
          defense: card.defense,
          cost: card.cost,
          imageUrl: card.imageUrl,
        });
      }
    }

    // Record box opening
    await ctx.db.insert("packOpeningHistory", {
      userId,
      productId: args.productId,
      packType: `${product.name} (${packCount} packs)`,
      cardsReceived: allCards.map((c) => ({
        cardDefinitionId: c.cardDefinitionId,
        name: c.name,
        rarity: c.rarity,
      })),
      currencyUsed: currencyType,
      amountPaid: price,
      openedAt: Date.now(),
    });

    return {
      success: true,
      productName: product.name,
      packsOpened: packCount,
      bonusCards: product.boxConfig.bonusCards ?? 0,
      cardsReceived: allCards,
      currencyUsed: currencyType,
      amountPaid: price,
    };
  },
});

/**
 * Purchase currency bundle (Gems → Gold conversion)
 */
export const purchaseCurrencyBundle = mutation({
  args: {
    token: v.string(),
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);

    // Get product
    const product = await ctx.db
      .query("shopProducts")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .first();

    if (!product || !product.isActive) {
      throw new Error("Product not found or unavailable");
    }

    if (product.productType !== "currency") {
      throw new Error("This endpoint is only for currency purchases");
    }

    if (!product.currencyConfig) {
      throw new Error("Invalid currency configuration");
    }

    // Currency bundles always cost gems
    if (!product.gemPrice || product.gemPrice <= 0) {
      throw new Error("Invalid currency bundle price");
    }

    // Deduct gems, add gold
    await ctx.runMutation(internal.economy.adjustPlayerCurrency, {
      userId,
      gemsDelta: -product.gemPrice,
      transactionType: "purchase",
      description: `Purchased ${product.name} (spent gems)`,
      referenceId: product._id,
    });

    await ctx.runMutation(internal.economy.adjustPlayerCurrency, {
      userId,
      goldDelta: product.currencyConfig.amount,
      transactionType: "conversion",
      description: `Purchased ${product.name} (received gold)`,
      referenceId: product._id,
    });

    return {
      success: true,
      productName: product.name,
      gemsSpent: product.gemPrice,
      goldReceived: product.currencyConfig.amount,
    };
  },
});
