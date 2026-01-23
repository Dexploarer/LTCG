import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { validateSession } from "./lib/validators";

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_DECKS_PER_USER = 50;
const DECK_SIZE = 30;
const MAX_COPIES_PER_CARD = 3;
const MAX_LEGENDARY_COPIES = 1;

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all decks for the current user
 */
export const getUserDecks = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);

    // Get all active decks for this user
    const decks = await ctx.db
      .query("userDecks")
      .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .collect();

    // Get card counts for each deck
    const decksWithCounts = await Promise.all(
      decks.map(async (deck) => {
        const deckCards = await ctx.db
          .query("deckCards")
          .withIndex("by_deck", (q) => q.eq("deckId", deck._id))
          .collect();

        const cardCount = deckCards.reduce((sum, dc) => sum + dc.quantity, 0);

        return {
          id: deck._id,
          name: deck.name,
          description: deck.description,
          deckArchetype: deck.deckArchetype,
          cardCount,
          createdAt: deck.createdAt,
          updatedAt: deck.updatedAt,
        };
      })
    );

    // Sort by most recently updated
    return decksWithCounts.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Get a specific deck with all its cards
 */
export const getDeckWithCards = query({
  args: {
    token: v.string(),
    deckId: v.id("userDecks"),
  },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);

    // Get the deck
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId || !deck.isActive) {
      throw new Error("Deck not found");
    }

    // Get all cards in the deck
    const deckCards = await ctx.db
      .query("deckCards")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    // Join with card definitions
    const cardsWithDefinitions = await Promise.all(
      deckCards.map(async (dc) => {
        const cardDef = await ctx.db.get(dc.cardDefinitionId);
        if (!cardDef || !cardDef.isActive) return null;

        return {
          cardDefinitionId: dc.cardDefinitionId,
          name: cardDef.name,
          rarity: cardDef.rarity,
          archetype: cardDef.archetype,
          cardType: cardDef.cardType,
          attack: cardDef.attack,
          defense: cardDef.defense,
          cost: cardDef.cost,
          ability: cardDef.ability,
          flavorText: cardDef.flavorText,
          imageUrl: cardDef.imageUrl,
          quantity: dc.quantity,
          position: dc.position,
        };
      })
    );

    const validCards = cardsWithDefinitions.filter((c) => c !== null);

    return {
      id: deck._id,
      name: deck.name,
      description: deck.description,
      deckArchetype: deck.deckArchetype,
      cards: validCards,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
    };
  },
});

/**
 * Get deck statistics
 */
export const getDeckStats = query({
  args: {
    token: v.string(),
    deckId: v.id("userDecks"),
  },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);

    // Get the deck
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId || !deck.isActive) {
      throw new Error("Deck not found");
    }

    // Get all cards in the deck
    const deckCards = await ctx.db
      .query("deckCards")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    // Initialize counters
    const elementCounts: Record<string, number> = {
      fire: 0,
      water: 0,
      earth: 0,
      wind: 0,
      neutral: 0,
    };
    const rarityCounts: Record<string, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };
    let totalCost = 0;
    let creatureCount = 0;
    let spellCount = 0;
    let trapCount = 0;
    let equipmentCount = 0;
    let totalCards = 0;

    // Calculate statistics
    for (const dc of deckCards) {
      const cardDef = await ctx.db.get(dc.cardDefinitionId);
      if (!cardDef || !cardDef.isActive) continue;

      const quantity = dc.quantity;
      totalCards += quantity;

      elementCounts[cardDef.archetype] = (elementCounts[cardDef.archetype] || 0) + quantity;
      rarityCounts[cardDef.rarity] = (rarityCounts[cardDef.rarity] || 0) + quantity;
      totalCost += cardDef.cost * quantity;

      if (cardDef.cardType === "creature") creatureCount += quantity;
      else if (cardDef.cardType === "spell") spellCount += quantity;
      else if (cardDef.cardType === "trap") trapCount += quantity;
      else if (cardDef.cardType === "equipment") equipmentCount += quantity;
    }

    return {
      elementCounts,
      rarityCounts,
      avgCost: totalCards > 0 ? (totalCost / totalCards).toFixed(1) : "0",
      creatureCount,
      spellCount,
      trapCount,
      equipmentCount,
      totalCards,
    };
  },
});

/**
 * Validate a deck against game rules
 */
export const validateDeck = query({
  args: {
    token: v.string(),
    deckId: v.id("userDecks"),
  },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);

    // Get the deck
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId || !deck.isActive) {
      throw new Error("Deck not found");
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Get all cards in the deck
    const deckCards = await ctx.db
      .query("deckCards")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    // Check total card count
    let totalCards = 0;
    const cardCounts = new Map<string, { quantity: number; rarity: string; name: string }>();

    for (const dc of deckCards) {
      const cardDef = await ctx.db.get(dc.cardDefinitionId);
      if (!cardDef || !cardDef.isActive) {
        errors.push(`Invalid card in deck: ${dc.cardDefinitionId}`);
        continue;
      }

      totalCards += dc.quantity;
      cardCounts.set(dc.cardDefinitionId, {
        quantity: dc.quantity,
        rarity: cardDef.rarity,
        name: cardDef.name,
      });

      // Check individual card copy limits
      if (cardDef.rarity === "legendary" && dc.quantity > MAX_LEGENDARY_COPIES) {
        errors.push(
          `${cardDef.name}: Legendary cards limited to ${MAX_LEGENDARY_COPIES} copy`
        );
      } else if (dc.quantity > MAX_COPIES_PER_CARD) {
        errors.push(`${cardDef.name}: Limited to ${MAX_COPIES_PER_CARD} copies per deck`);
      }
    }

    // Check deck size
    if (totalCards < DECK_SIZE) {
      errors.push(`Deck needs exactly ${DECK_SIZE} cards. Currently has ${totalCards}.`);
    } else if (totalCards > DECK_SIZE) {
      errors.push(`Deck can't exceed ${DECK_SIZE} cards. Currently has ${totalCards}.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalCards,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new empty deck
 */
export const createDeck = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);

    // Validate deck name
    if (!args.name.trim()) {
      throw new Error("Deck name cannot be empty");
    }
    if (args.name.length > 50) {
      throw new Error("Deck name cannot exceed 50 characters");
    }

    // Check deck limit
    const existingDecks = await ctx.db
      .query("userDecks")
      .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .collect();

    if (existingDecks.length >= MAX_DECKS_PER_USER) {
      throw new Error(`Cannot exceed ${MAX_DECKS_PER_USER} decks per user`);
    }

    // Create the deck
    const deckId = await ctx.db.insert("userDecks", {
      userId,
      name: args.name.trim(),
      description: args.description,
      deckArchetype: undefined,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { deckId };
  },
});

/**
 * Save/update deck card list
 */
export const saveDeck = mutation({
  args: {
    token: v.string(),
    deckId: v.id("userDecks"),
    cards: v.array(
      v.object({
        cardDefinitionId: v.id("cardDefinitions"),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);

    // Get the deck
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId || !deck.isActive) {
      throw new Error("Deck not found");
    }

    // Validate total card count
    const totalCards = args.cards.reduce((sum, c) => sum + c.quantity, 0);
    if (totalCards !== DECK_SIZE) {
      throw new Error(`Deck must have exactly ${DECK_SIZE} cards. Currently has ${totalCards}.`);
    }

    // Validate each card
    const playerCards = await ctx.db
      .query("playerCards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const ownedCardMap = new Map(
      playerCards.map((pc) => [pc.cardDefinitionId.toString(), pc.quantity])
    );

    for (const card of args.cards) {
      // Check if card definition exists
      const cardDef = await ctx.db.get(card.cardDefinitionId);
      if (!cardDef || !cardDef.isActive) {
        throw new Error(`Invalid card: ${card.cardDefinitionId}`);
      }

      // Check if user owns enough copies
      const ownedQuantity = ownedCardMap.get(card.cardDefinitionId.toString()) || 0;
      if (card.quantity > ownedQuantity) {
        throw new Error(
          `You only own ${ownedQuantity} copies of ${cardDef.name}, but trying to add ${card.quantity}`
        );
      }

      // Check card copy limits
      if (cardDef.rarity === "legendary" && card.quantity > MAX_LEGENDARY_COPIES) {
        throw new Error(`${cardDef.name}: Legendary cards limited to ${MAX_LEGENDARY_COPIES} copy`);
      } else if (card.quantity > MAX_COPIES_PER_CARD) {
        throw new Error(`${cardDef.name}: Limited to ${MAX_COPIES_PER_CARD} copies per deck`);
      }
    }

    // Delete existing deck cards
    const existingDeckCards = await ctx.db
      .query("deckCards")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    for (const dc of existingDeckCards) {
      await ctx.db.delete(dc._id);
    }

    // Insert new deck cards
    for (const card of args.cards) {
      await ctx.db.insert("deckCards", {
        deckId: args.deckId,
        cardDefinitionId: card.cardDefinitionId,
        quantity: card.quantity,
        position: undefined,
      });
    }

    // Update deck timestamp
    await ctx.db.patch(args.deckId, {
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Rename a deck
 */
export const renameDeck = mutation({
  args: {
    token: v.string(),
    deckId: v.id("userDecks"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);

    // Get the deck
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId || !deck.isActive) {
      throw new Error("Deck not found");
    }

    // Validate new name
    if (!args.newName.trim()) {
      throw new Error("Deck name cannot be empty");
    }
    if (args.newName.length > 50) {
      throw new Error("Deck name cannot exceed 50 characters");
    }

    // Update the deck
    await ctx.db.patch(args.deckId, {
      name: args.newName.trim(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a deck (soft delete)
 */
export const deleteDeck = mutation({
  args: {
    token: v.string(),
    deckId: v.id("userDecks"),
  },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);

    // Get the deck
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId) {
      throw new Error("Deck not found");
    }

    // Soft delete the deck
    await ctx.db.patch(args.deckId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Duplicate an existing deck
 */
export const duplicateDeck = mutation({
  args: {
    token: v.string(),
    sourceDeckId: v.id("userDecks"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);

    // Get the source deck
    const sourceDeck = await ctx.db.get(args.sourceDeckId);
    if (!sourceDeck || sourceDeck.userId !== userId || !sourceDeck.isActive) {
      throw new Error("Source deck not found");
    }

    // Validate new name
    if (!args.newName.trim()) {
      throw new Error("Deck name cannot be empty");
    }
    if (args.newName.length > 50) {
      throw new Error("Deck name cannot exceed 50 characters");
    }

    // Check deck limit
    const existingDecks = await ctx.db
      .query("userDecks")
      .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .collect();

    if (existingDecks.length >= MAX_DECKS_PER_USER) {
      throw new Error(`Cannot exceed ${MAX_DECKS_PER_USER} decks per user`);
    }

    // Create new deck
    const newDeckId = await ctx.db.insert("userDecks", {
      userId,
      name: args.newName.trim(),
      description: sourceDeck.description,
      deckArchetype: sourceDeck.deckArchetype,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Copy all cards from source deck
    const sourceDeckCards = await ctx.db
      .query("deckCards")
      .withIndex("by_deck", (q) => q.eq("deckId", args.sourceDeckId))
      .collect();

    for (const sourceCard of sourceDeckCards) {
      await ctx.db.insert("deckCards", {
        deckId: newDeckId,
        cardDefinitionId: sourceCard.cardDefinitionId,
        quantity: sourceCard.quantity,
        position: sourceCard.position,
      });
    }

    return { deckId: newDeckId };
  },
});

/**
 * Set a deck as the active deck for matchmaking
 */
export const setActiveDeck = mutation({
  args: {
    token: v.string(),
    deckId: v.id("userDecks"),
  },
  handler: async (ctx, args) => {
    const { userId } = await validateSession(ctx, args.token);

    // Get the deck
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId || !deck.isActive) {
      throw new Error("Deck not found");
    }

    // Validate deck has exactly 30 cards
    const deckCards = await ctx.db
      .query("deckCards")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    const totalCards = deckCards.reduce((sum, dc) => sum + dc.quantity, 0);
    if (totalCards !== DECK_SIZE) {
      throw new Error(`Deck must have exactly ${DECK_SIZE} cards to be set as active. Currently has ${totalCards}.`);
    }

    // Validate all cards in deck
    for (const dc of deckCards) {
      const cardDef = await ctx.db.get(dc.cardDefinitionId);
      if (!cardDef || !cardDef.isActive) {
        throw new Error("Deck contains invalid cards");
      }

      // Check card copy limits
      if (cardDef.rarity === "legendary" && dc.quantity > MAX_LEGENDARY_COPIES) {
        throw new Error(`${cardDef.name}: Legendary cards limited to ${MAX_LEGENDARY_COPIES} copy`);
      } else if (dc.quantity > MAX_COPIES_PER_CARD) {
        throw new Error(`${cardDef.name}: Limited to ${MAX_COPIES_PER_CARD} copies per deck`);
      }
    }

    // Get user record
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user's active deck
    await ctx.db.patch(userId, {
      activeDeckId: args.deckId,
    });

    return { success: true };
  },
});
