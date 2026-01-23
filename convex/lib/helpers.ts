/**
 * Shared Helper Functions for Convex
 *
 * Reusable business logic functions used across feature modules.
 * Includes card inventory management, pack opening, and rarity logic.
 */

import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { RARITY_WEIGHTS } from "./constants";
import type {
  Rarity,
  Archetype,
  CardDefinition,
  PackConfig,
  CardResult,
} from "./types";

// Re-export types for backwards compatibility
export type { Rarity, Archetype };

/**
 * Weighted random rarity selection based on configured weights
 *
 * @returns Randomly selected rarity
 */
export function weightedRandomRarity(): Rarity {
  const totalWeight = 1000;
  const roll = Math.random() * totalWeight;
  let cumulative = 0;

  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    cumulative += weight;
    if (roll < cumulative) {
      return rarity as Rarity;
    }
  }

  return "common"; // Fallback
}

/**
 * Get random card of specific rarity (and optional archetype)
 */
export async function getRandomCard(
  ctx: QueryCtx | MutationCtx,
  rarity: Rarity,
  archetype?: Archetype
): Promise<CardDefinition> {
  let query = ctx.db
    .query("cardDefinitions")
    .filter((q) => q.eq(q.field("isActive"), true))
    .filter((q) => q.eq(q.field("rarity"), rarity));

  if (archetype && archetype !== "neutral") {
    const allCards = await query.collect();
    const archetypeCards = allCards.filter(
      (card) => card.archetype === archetype
    );

    if (archetypeCards.length === 0) {
      // Fallback to any archetype if no cards found
      const cards = await query.collect();
      if (cards.length === 0) {
        throw new Error(`No active ${rarity} cards found`);
      }
      const fallbackCard = cards[Math.floor(Math.random() * cards.length)];
      if (!fallbackCard) {
        throw new Error(`Failed to select ${rarity} card from fallback`);
      }
      return fallbackCard;
    }

    const archetypeCard = archetypeCards[Math.floor(Math.random() * archetypeCards.length)];
    if (!archetypeCard) {
      throw new Error(`Failed to select ${rarity} ${archetype} card`);
    }
    return archetypeCard;
  }

  const cards = await query.collect();
  if (cards.length === 0) {
    throw new Error(`No active ${rarity} cards found`);
  }

  const selectedCard = cards[Math.floor(Math.random() * cards.length)];
  if (!selectedCard) {
    throw new Error(`Failed to select ${rarity} card`);
  }

  return selectedCard;
}

/**
 * Add cards to player's inventory (creates or increments quantity)
 */
export async function addCardsToInventory(
  ctx: MutationCtx,
  userId: Id<"users">,
  cardDefinitionId: Id<"cardDefinitions">,
  quantity: number
) {
  const existing = await ctx.db
    .query("playerCards")
    .withIndex("by_user_card", (q) =>
      q.eq("userId", userId).eq("cardDefinitionId", cardDefinitionId)
    )
    .first();

  if (existing) {
    // Increment quantity
    await ctx.db.patch(existing._id, {
      quantity: existing.quantity + quantity,
      lastUpdatedAt: Date.now(),
    });
  } else {
    // Create new entry
    await ctx.db.insert("playerCards", {
      userId,
      cardDefinitionId,
      quantity,
      isFavorite: false,
      acquiredAt: Date.now(),
      lastUpdatedAt: Date.now(),
    });
  }
}

/**
 * Adjust player card inventory (add or remove cards)
 *
 * @param quantityDelta - Positive to add, negative to remove
 */
export async function adjustCardInventory(
  ctx: MutationCtx,
  userId: Id<"users">,
  cardDefinitionId: Id<"cardDefinitions">,
  quantityDelta: number
) {
  const playerCard = await ctx.db
    .query("playerCards")
    .withIndex("by_user_card", (q) =>
      q.eq("userId", userId).eq("cardDefinitionId", cardDefinitionId)
    )
    .first();

  if (!playerCard) {
    if (quantityDelta > 0) {
      // Create new entry
      await ctx.db.insert("playerCards", {
        userId,
        cardDefinitionId,
        quantity: quantityDelta,
        isFavorite: false,
        acquiredAt: Date.now(),
        lastUpdatedAt: Date.now(),
      });
    } else {
      throw new Error("Cannot decrease quantity of card you don't own");
    }
  } else {
    const newQuantity = playerCard.quantity + quantityDelta;
    if (newQuantity < 0) {
      throw new Error(
        `Insufficient cards (have ${playerCard.quantity}, need ${-quantityDelta})`
      );
    }

    if (newQuantity === 0) {
      // Delete entry if quantity reaches 0
      await ctx.db.delete(playerCard._id);
    } else {
      await ctx.db.patch(playerCard._id, {
        quantity: newQuantity,
        lastUpdatedAt: Date.now(),
      });
    }
  }
}

/**
 * Open a pack and generate cards based on pack configuration
 *
 * @returns Array of cards received
 */
export async function openPack(
  ctx: MutationCtx,
  packConfig: PackConfig,
  userId: Id<"users">
): Promise<CardResult[]> {
  const { cardCount, guaranteedRarity, archetype } = packConfig;
  const cards: CardResult[] = [];

  for (let i = 0; i < cardCount; i++) {
    const isLastCard = i === cardCount - 1;
    let rarity: Rarity;

    // Last card gets guaranteed rarity
    if (isLastCard && guaranteedRarity) {
      rarity = guaranteedRarity;
    } else {
      rarity = weightedRandomRarity();
    }

    // Get random card of this rarity
    const card = await getRandomCard(ctx, rarity, archetype);

    // Add to inventory
    await addCardsToInventory(ctx, userId, card._id, 1);

    cards.push({
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

  return cards;
}
