import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { requireAuthQuery, requireAuthMutation } from "../lib/convexAuth";
import { ErrorCode, createError } from "../lib/errorCodes";
import {
  shopProductValidator,
  packOpeningHistoryValidator,
  cardResultValidator,
} from "../lib/returnValidators";
import { adjustPlayerCurrencyHelper } from "./economy";
import { packPurchaseValidator } from "../lib/returnValidators";
import {
  weightedRandomRarity,
  getRandomCard,
  addCardsToInventory,
  openPack,
  type Rarity,
  type Archetype,
} from "../lib/helpers";
import { PAGINATION } from "../lib/constants";
import type { CardResult } from "../lib/types";

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
    page: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthQuery(ctx);
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
 * SECURITY: Rate limited to prevent pack opening spam
 */
export const purchasePack = mutation({
  args: {
    productId: v.string(),
    useGems: v.boolean(),
  },
  returns: packPurchaseValidator,
  handler: async (ctx, args) => {
    const { userId } = await requireAuthMutation(ctx);

    // SECURITY: Rate limit pack purchases to prevent spam/abuse
    // Note: Uncomment when @convex-dev/ratelimiter is fully configured
    // const { checkRateLimit } = await import("../lib/rateLimit");
    // await checkRateLimit(ctx, "PACK_PURCHASE", userId);

    // Get product
    const product = await ctx.db
      .query("shopProducts")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .first();

    if (!product || !product.isActive) {
      throw createError(ErrorCode.NOT_FOUND_PRODUCT);
    }

    if (product.productType !== "pack") {
      throw createError(ErrorCode.VALIDATION_INVALID_INPUT, {
        reason: "This endpoint is only for pack purchases",
      });
    }

    if (!product.packConfig) {
      throw createError(ErrorCode.ECONOMY_INVALID_PRODUCT, {
        reason: "Invalid pack configuration",
      });
    }

    // Determine price
    const price = args.useGems ? product.gemPrice : product.goldPrice;
    const currencyType: "gold" | "gems" = args.useGems ? "gems" : "gold";

    if (!price || price <= 0) {
      throw createError(ErrorCode.ECONOMY_INVALID_PRODUCT, {
        reason: `This pack cannot be purchased with ${currencyType}`,
      });
    }

    // Deduct currency
    await adjustPlayerCurrencyHelper(ctx, {
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
    productId: v.string(),
    useGems: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    productName: v.string(),
    packsOpened: v.number(),
    bonusCards: v.number(),
    cardsReceived: v.array(cardResultValidator), // CardResult array
    currencyUsed: v.union(v.literal("gold"), v.literal("gems")),
    amountPaid: v.number(),
  }),
  handler: async (ctx, args) => {
    const { userId } = await requireAuthMutation(ctx);

    // Get product
    const product = await ctx.db
      .query("shopProducts")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .first();

    if (!product || !product.isActive) {
      throw createError(ErrorCode.NOT_FOUND_PRODUCT);
    }

    if (product.productType !== "box") {
      throw createError(ErrorCode.VALIDATION_INVALID_INPUT, {
        reason: "This endpoint is only for box purchases",
      });
    }

    if (!product.boxConfig) {
      throw createError(ErrorCode.ECONOMY_INVALID_PRODUCT, {
        reason: "Invalid box configuration",
      });
    }

    // Determine price
    const price = args.useGems ? product.gemPrice : product.goldPrice;
    const currencyType: "gold" | "gems" = args.useGems ? "gems" : "gold";

    if (!price || price <= 0) {
      throw createError(ErrorCode.ECONOMY_INVALID_PRODUCT, {
        reason: `This box cannot be purchased with ${currencyType}`,
      });
    }

    // Get pack definition
    const packProduct = await ctx.db
      .query("shopProducts")
      .withIndex("by_product_id", (q) =>
        q.eq("productId", product.boxConfig!.packProductId)
      )
      .first();

    if (!packProduct || !packProduct.packConfig) {
      throw createError(ErrorCode.ECONOMY_INVALID_PRODUCT, {
        reason: "Pack configuration not found for this box",
      });
    }

    // Deduct currency
    await adjustPlayerCurrencyHelper(ctx, {
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
    productId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    productName: v.string(),
    gemsSpent: v.number(),
    goldReceived: v.number(),
  }),
  handler: async (ctx, args) => {
    const { userId } = await requireAuthMutation(ctx);

    // Get product
    const product = await ctx.db
      .query("shopProducts")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .first();

    if (!product || !product.isActive) {
      throw createError(ErrorCode.NOT_FOUND_PRODUCT);
    }

    if (product.productType !== "currency") {
      throw createError(ErrorCode.VALIDATION_INVALID_INPUT, {
        reason: "This endpoint is only for currency purchases",
      });
    }

    if (!product.currencyConfig) {
      throw createError(ErrorCode.ECONOMY_INVALID_PRODUCT, {
        reason: "Invalid currency configuration",
      });
    }

    // Currency bundles always cost gems
    if (!product.gemPrice || product.gemPrice <= 0) {
      throw createError(ErrorCode.ECONOMY_INVALID_PRODUCT, {
        reason: "Invalid currency bundle price",
      });
    }

    // Deduct gems, add gold
    await adjustPlayerCurrencyHelper(ctx, {
      userId,
      gemsDelta: -product.gemPrice,
      transactionType: "purchase",
      description: `Purchased ${product.name} (spent gems)`,
      referenceId: product._id,
    });

    await adjustPlayerCurrencyHelper(ctx, {
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
