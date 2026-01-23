import { convexTest } from "convex-test";
import { expect, test, describe, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import type { Id } from "./_generated/dataModel";

const modules = import.meta.glob("./**/*.ts");

// Test constants matching the actual implementation
const DECK_SIZE = 30;
const MAX_COPIES_PER_CARD = 3;
const MAX_LEGENDARY_COPIES = 1;
const MAX_DECKS_PER_USER = 50;

// Helper function to create a test user session
async function createTestUser(t: ReturnType<typeof convexTest>, name: string) {
  // Create a mock session token
  const token = `test-token-${name}-${Date.now()}`;

  // Create user and session
  const userId = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      username: name,
      email: `${name}@test.com`,
      passwordHash: "test-hash",
      createdAt: Date.now(),
    });

    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    return userId;
  });

  return { userId, token };
}

// Helper function to create test card definitions
async function createTestCards(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    // Create a variety of test cards
    const cards = {
      commonCard: await ctx.db.insert("cardDefinitions", {
        name: "Common Fire Spell",
        rarity: "common",
        archetype: "fire",
        cardType: "spell",
        cost: 2,
        ability: "Deal 2 damage",
        isActive: true,
        createdAt: Date.now(),
      }),
      uncommonCard: await ctx.db.insert("cardDefinitions", {
        name: "Uncommon Water Creature",
        rarity: "uncommon",
        archetype: "water",
        cardType: "creature",
        attack: 3,
        defense: 3,
        cost: 3,
        isActive: true,
        createdAt: Date.now(),
      }),
      rareCard: await ctx.db.insert("cardDefinitions", {
        name: "Rare Earth Creature",
        rarity: "rare",
        archetype: "earth",
        cardType: "creature",
        attack: 5,
        defense: 5,
        cost: 5,
        isActive: true,
        createdAt: Date.now(),
      }),
      legendaryCard: await ctx.db.insert("cardDefinitions", {
        name: "Legendary Dragon",
        rarity: "legendary",
        archetype: "fire",
        cardType: "creature",
        attack: 10,
        defense: 10,
        cost: 10,
        ability: "Legendary ability",
        isActive: true,
        createdAt: Date.now(),
      }),
    };

    return cards;
  });
}

// Helper function to give cards to a user
async function giveCardsToUser(
  t: ReturnType<typeof convexTest>,
  userId: Id<"users">,
  cardDefinitionId: Id<"cardDefinitions">,
  quantity: number
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("playerCards", {
      userId,
      cardDefinitionId,
      quantity,
      isFavorite: false,
      acquiredAt: Date.now(),
      lastUpdatedAt: Date.now(),
    });
  });
}

describe("decks.createDeck", () => {
  test("creates a new deck with valid name", async () => {
    const t = convexTest(schema, modules);
    const { token } = await createTestUser(t, "alice");

    const result = await t.mutation(api.decks.createDeck, {
      token,
      name: "My First Deck",
    });

    expect(result.deckId).toBeDefined();

    // Verify deck was created
    const deck = await t.run(async (ctx) => {
      return await ctx.db.get(result.deckId);
    });

    expect(deck).toMatchObject({
      name: "My First Deck",
      isActive: true,
    });
  });

  test("trims whitespace from deck name", async () => {
    const t = convexTest(schema, modules);
    const { token } = await createTestUser(t, "bob");

    const result = await t.mutation(api.decks.createDeck, {
      token,
      name: "  Deck With Spaces  ",
    });

    const deck = await t.run(async (ctx) => {
      return await ctx.db.get(result.deckId);
    });

    expect(deck?.name).toBe("Deck With Spaces");
  });

  test("rejects empty deck name", async () => {
    const t = convexTest(schema, modules);
    const { token } = await createTestUser(t, "charlie");

    await expect(
      t.mutation(api.decks.createDeck, {
        token,
        name: "",
      })
    ).rejects.toThrowError("Deck name cannot be empty");
  });

  test("rejects deck name with only whitespace", async () => {
    const t = convexTest(schema, modules);
    const { token } = await createTestUser(t, "david");

    await expect(
      t.mutation(api.decks.createDeck, {
        token,
        name: "   ",
      })
    ).rejects.toThrowError("Deck name cannot be empty");
  });

  test("rejects deck name exceeding 50 characters", async () => {
    const t = convexTest(schema, modules);
    const { token } = await createTestUser(t, "eve");

    const longName = "a".repeat(51);

    await expect(
      t.mutation(api.decks.createDeck, {
        token,
        name: longName,
      })
    ).rejects.toThrowError("Deck name cannot exceed 50 characters");
  });

  test("enforces max decks per user limit", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "frank");

    // Create MAX_DECKS_PER_USER decks
    await t.run(async (ctx) => {
      for (let i = 0; i < MAX_DECKS_PER_USER; i++) {
        await ctx.db.insert("userDecks", {
          userId,
          name: `Deck ${i}`,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    });

    // Try to create one more
    await expect(
      t.mutation(api.decks.createDeck, {
        token,
        name: "One Too Many",
      })
    ).rejects.toThrowError(`Cannot exceed ${MAX_DECKS_PER_USER} decks per user`);
  });

  test("rejects unauthenticated request", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.decks.createDeck, {
        token: "invalid-token",
        name: "Test Deck",
      })
    ).rejects.toThrowError("Session expired or invalid");
  });
});

describe("decks.getUserDecks", () => {
  test("returns empty array when user has no decks", async () => {
    const t = convexTest(schema, modules);
    const { token } = await createTestUser(t, "grace");

    const decks = await t.query(api.decks.getUserDecks, { token });

    expect(decks).toEqual([]);
  });

  test("returns user's decks with card counts", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "henry");
    const cards = await createTestCards(t);

    // Create a deck
    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Test Deck",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Add some cards to the deck
    await t.run(async (ctx) => {
      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cards.commonCard,
        quantity: 3,
      });
      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cards.rareCard,
        quantity: 2,
      });
    });

    const decks = await t.query(api.decks.getUserDecks, { token });

    expect(decks).toHaveLength(1);
    expect(decks[0]).toMatchObject({
      name: "Test Deck",
      cardCount: 5,
    });
  });

  test("only returns active decks", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "iris");

    // Create active and inactive decks
    await t.run(async (ctx) => {
      await ctx.db.insert("userDecks", {
        userId,
        name: "Active Deck",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("userDecks", {
        userId,
        name: "Deleted Deck",
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const decks = await t.query(api.decks.getUserDecks, { token });

    expect(decks).toHaveLength(1);
    expect(decks[0].name).toBe("Active Deck");
  });

  test("sorts decks by most recently updated", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "jack");

    await t.run(async (ctx) => {
      await ctx.db.insert("userDecks", {
        userId,
        name: "Old Deck",
        isActive: true,
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 1000,
      });
      await ctx.db.insert("userDecks", {
        userId,
        name: "New Deck",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const decks = await t.query(api.decks.getUserDecks, { token });

    expect(decks[0].name).toBe("New Deck");
    expect(decks[1].name).toBe("Old Deck");
  });

  test("does not return other users' decks", async () => {
    const t = convexTest(schema, modules);
    const { token: token1 } = await createTestUser(t, "kate");
    const { userId: userId2 } = await createTestUser(t, "leo");

    // Create deck for user2
    await t.run(async (ctx) => {
      await ctx.db.insert("userDecks", {
        userId: userId2,
        name: "Leo's Deck",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Query as user1
    const decks = await t.query(api.decks.getUserDecks, { token: token1 });

    expect(decks).toEqual([]);
  });
});

describe("decks.getDeckWithCards", () => {
  test("returns deck with all cards", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "mike");
    const cards = await createTestCards(t);

    const deckId = await t.run(async (ctx) => {
      const deckId = await ctx.db.insert("userDecks", {
        userId,
        name: "Full Deck",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cards.commonCard,
        quantity: 3,
      });
      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cards.rareCard,
        quantity: 2,
      });

      return deckId;
    });

    const deck = await t.query(api.decks.getDeckWithCards, {
      token,
      deckId,
    });

    expect(deck.name).toBe("Full Deck");
    expect(deck.cards).toHaveLength(2);
    expect(deck.cards[0]).toMatchObject({
      name: "Common Fire Spell",
      quantity: 3,
    });
  });

  test("rejects access to other user's deck", async () => {
    const t = convexTest(schema, modules);
    const { token: token1 } = await createTestUser(t, "nina");
    const { userId: userId2 } = await createTestUser(t, "oscar");

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId: userId2,
        name: "Oscar's Deck",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.query(api.decks.getDeckWithCards, {
        token: token1,
        deckId,
      })
    ).rejects.toThrowError("Deck not found");
  });

  test("rejects access to deleted deck", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "paula");

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Deleted Deck",
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.query(api.decks.getDeckWithCards, {
        token,
        deckId,
      })
    ).rejects.toThrowError("Deck not found");
  });

  test("filters out inactive cards", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "quinn");

    const { deckId, activeCardId, inactiveCardId } = await t.run(async (ctx) => {
      const deckId = await ctx.db.insert("userDecks", {
        userId,
        name: "Test Deck",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const activeCardId = await ctx.db.insert("cardDefinitions", {
        name: "Active Card",
        rarity: "common",
        archetype: "fire",
        cardType: "spell",
        cost: 1,
        isActive: true,
        createdAt: Date.now(),
      });

      const inactiveCardId = await ctx.db.insert("cardDefinitions", {
        name: "Inactive Card",
        rarity: "common",
        archetype: "water",
        cardType: "spell",
        cost: 1,
        isActive: false,
        createdAt: Date.now(),
      });

      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: activeCardId,
        quantity: 1,
      });
      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: inactiveCardId,
        quantity: 1,
      });

      return { deckId, activeCardId, inactiveCardId };
    });

    const deck = await t.query(api.decks.getDeckWithCards, {
      token,
      deckId,
    });

    expect(deck.cards).toHaveLength(1);
    expect(deck.cards[0].name).toBe("Active Card");
  });
});

describe("decks.saveDeck", () => {
  test("saves deck with exactly 30 cards", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "rachel");
    const cards = await createTestCards(t);

    // Give user enough cards of different types
    await giveCardsToUser(t, userId, cards.commonCard, 3);
    await giveCardsToUser(t, userId, cards.uncommonCard, 3);
    await giveCardsToUser(t, userId, cards.rareCard, 3);
    await giveCardsToUser(t, userId, cards.legendaryCard, 1);

    // Create additional cards to reach 30 total
    // Need: 3+3+3+1=10 from base cards, plus 20 more = 30 total
    // So we need 6 more cards with 3 copies each, plus 1 card with 2 copies
    const extraCards = await t.run(async (ctx) => {
      const extraCardIds = [];
      for (let i = 0; i < 7; i++) {
        const cardId = await ctx.db.insert("cardDefinitions", {
          name: `Extra Card ${i}`,
          rarity: "common",
          archetype: "fire",
          cardType: "spell",
          cost: 2,
          isActive: true,
          createdAt: Date.now(),
        });
        extraCardIds.push(cardId);
        await ctx.db.insert("playerCards", {
          userId,
          cardDefinitionId: cardId,
          quantity: 3,
          isFavorite: false,
          acquiredAt: Date.now(),
          lastUpdatedAt: Date.now(),
        });
      }
      return extraCardIds;
    });

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Valid Deck",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const result = await t.mutation(api.decks.saveDeck, {
      token,
      deckId,
      cards: [
        { cardDefinitionId: cards.commonCard, quantity: 3 },
        { cardDefinitionId: cards.uncommonCard, quantity: 3 },
        { cardDefinitionId: cards.rareCard, quantity: 3 },
        { cardDefinitionId: cards.legendaryCard, quantity: 1 },
        { cardDefinitionId: extraCards[0], quantity: 3 },
        { cardDefinitionId: extraCards[1], quantity: 3 },
        { cardDefinitionId: extraCards[2], quantity: 3 },
        { cardDefinitionId: extraCards[3], quantity: 3 },
        { cardDefinitionId: extraCards[4], quantity: 3 },
        { cardDefinitionId: extraCards[5], quantity: 3 },
        { cardDefinitionId: extraCards[6], quantity: 2 }, // Only 2 copies to reach exactly 30
      ],
    });

    expect(result.success).toBe(true);

    // Verify cards were saved
    const savedCards = await t.run(async (ctx) => {
      return await ctx.db
        .query("deckCards")
        .withIndex("by_deck", (q) => q.eq("deckId", deckId))
        .collect();
    });

    expect(savedCards).toHaveLength(11); // 4 base cards + 7 extra cards
    const totalQuantity = savedCards.reduce((sum, c) => sum + c.quantity, 0);
    expect(totalQuantity).toBe(30);
  });

  test("rejects deck with less than 30 cards", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "sam");
    const cards = await createTestCards(t);

    await giveCardsToUser(t, userId, cards.commonCard, 29);

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Too Small",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.decks.saveDeck, {
        token,
        deckId,
        cards: [
          { cardDefinitionId: cards.commonCard, quantity: 29 },
        ],
      })
    ).rejects.toThrowError(`Deck must have exactly ${DECK_SIZE} cards`);
  });

  test("rejects deck with more than 30 cards", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "tina");
    const cards = await createTestCards(t);

    await giveCardsToUser(t, userId, cards.commonCard, 31);

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Too Big",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.decks.saveDeck, {
        token,
        deckId,
        cards: [
          { cardDefinitionId: cards.commonCard, quantity: 31 },
        ],
      })
    ).rejects.toThrowError(`Deck must have exactly ${DECK_SIZE} cards`);
  });

  test("enforces max 3 copies per non-legendary card", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "uma");
    const cards = await createTestCards(t);

    await giveCardsToUser(t, userId, cards.commonCard, 4);
    await giveCardsToUser(t, userId, cards.rareCard, 26);

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Too Many Copies",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.decks.saveDeck, {
        token,
        deckId,
        cards: [
          { cardDefinitionId: cards.commonCard, quantity: 4 },
          { cardDefinitionId: cards.rareCard, quantity: 26 },
        ],
      })
    ).rejects.toThrowError(`Limited to ${MAX_COPIES_PER_CARD} copies per deck`);
  });

  test("enforces max 1 copy per legendary card", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "victor");
    const cards = await createTestCards(t);

    await giveCardsToUser(t, userId, cards.legendaryCard, 2);
    await giveCardsToUser(t, userId, cards.commonCard, 28);

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Too Many Legendaries",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.decks.saveDeck, {
        token,
        deckId,
        cards: [
          { cardDefinitionId: cards.legendaryCard, quantity: 2 },
          { cardDefinitionId: cards.commonCard, quantity: 28 },
        ],
      })
    ).rejects.toThrowError("Legendary cards limited to 1 copy");
  });

  test("rejects cards user doesn't own", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "wendy");
    const cards = await createTestCards(t);

    // Don't give user any cards

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Unowned Cards",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.decks.saveDeck, {
        token,
        deckId,
        cards: [
          { cardDefinitionId: cards.commonCard, quantity: 30 },
        ],
      })
    ).rejects.toThrowError("You only own 0 copies");
  });

  test("rejects more cards than user owns", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "xander");
    const cards = await createTestCards(t);

    await giveCardsToUser(t, userId, cards.commonCard, 2);
    await giveCardsToUser(t, userId, cards.rareCard, 28);

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Not Enough Cards",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.decks.saveDeck, {
        token,
        deckId,
        cards: [
          { cardDefinitionId: cards.commonCard, quantity: 3 },
          { cardDefinitionId: cards.rareCard, quantity: 27 },
        ],
      })
    ).rejects.toThrowError("You only own 2 copies");
  });

  test("replaces existing deck cards on save", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "yara");
    const cards = await createTestCards(t);

    // Give user enough cards for multiple valid decks
    await giveCardsToUser(t, userId, cards.commonCard, 3);
    await giveCardsToUser(t, userId, cards.uncommonCard, 3);
    await giveCardsToUser(t, userId, cards.rareCard, 3);

    // Create additional cards - need 7 cards × 3 copies = 21 cards
    const extraCardIds = await t.run(async (ctx) => {
      const ids = [];
      for (let i = 0; i < 7; i++) {
        const cardId = await ctx.db.insert("cardDefinitions", {
          name: `Deck Change Card ${i}`,
          rarity: "common",
          archetype: "fire",
          cardType: "spell",
          cost: 2,
          isActive: true,
          createdAt: Date.now(),
        });
        ids.push(cardId);
        await ctx.db.insert("playerCards", {
          userId,
          cardDefinitionId: cardId,
          quantity: 3,
          isFavorite: false,
          acquiredAt: Date.now(),
          lastUpdatedAt: Date.now(),
        });
      }
      return ids;
    });

    const deckId = await t.run(async (ctx) => {
      const deckId = await ctx.db.insert("userDecks", {
        userId,
        name: "Changing Deck",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Add initial cards (7 extra cards with 3 copies each = 21 + 9 from base = 30)
      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cards.commonCard,
        quantity: 3,
      });
      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cards.uncommonCard,
        quantity: 3,
      });
      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cards.rareCard,
        quantity: 3,
      });
      for (let i = 0; i < 7; i++) {
        await ctx.db.insert("deckCards", {
          deckId,
          cardDefinitionId: extraCardIds[i],
          quantity: 3,
        });
      }

      return deckId;
    });

    // Save with same cards but in different order to test replacement
    await t.mutation(api.decks.saveDeck, {
      token,
      deckId,
      cards: [
        { cardDefinitionId: cards.rareCard, quantity: 3 },
        { cardDefinitionId: cards.uncommonCard, quantity: 3 },
        { cardDefinitionId: cards.commonCard, quantity: 3 },
        ...extraCardIds.map((cardId) => ({ cardDefinitionId: cardId, quantity: 3 })),
      ],
    });

    // Verify old cards were removed and new cards were added
    const savedCards = await t.run(async (ctx) => {
      return await ctx.db
        .query("deckCards")
        .withIndex("by_deck", (q) => q.eq("deckId", deckId))
        .collect();
    });

    expect(savedCards).toHaveLength(10); // 3 base + 7 extra cards
    const totalQuantity = savedCards.reduce((sum, c) => sum + c.quantity, 0);
    expect(totalQuantity).toBe(30);

    // Verify it contains the same cards (testing atomic replacement)
    const cardIds = savedCards.map((c) => c.cardDefinitionId);
    expect(cardIds).toContain(cards.commonCard);
    expect(cardIds).toContain(cards.uncommonCard);
    expect(cardIds).toContain(cards.rareCard);
  });

  test("updates deck timestamp on save", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "zoe");
    const cards = await createTestCards(t);

    // Give user enough cards for valid deck
    await giveCardsToUser(t, userId, cards.commonCard, 3);
    await giveCardsToUser(t, userId, cards.uncommonCard, 3);
    await giveCardsToUser(t, userId, cards.rareCard, 3);

    // Create additional cards
    const extraCardIds = await t.run(async (ctx) => {
      const ids = [];
      for (let i = 0; i < 7; i++) {
        const cardId = await ctx.db.insert("cardDefinitions", {
          name: `Timestamp Card ${i}`,
          rarity: "common",
          archetype: "fire",
          cardType: "spell",
          cost: 2,
          isActive: true,
          createdAt: Date.now(),
        });
        ids.push(cardId);
        await ctx.db.insert("playerCards", {
          userId,
          cardDefinitionId: cardId,
          quantity: 3,
          isFavorite: false,
          acquiredAt: Date.now(),
          lastUpdatedAt: Date.now(),
        });
      }
      return ids;
    });

    const { deckId, originalTimestamp } = await t.run(async (ctx) => {
      const deckId = await ctx.db.insert("userDecks", {
        userId,
        name: "Timestamp Test",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now() - 1000,
      });

      const deck = await ctx.db.get(deckId);
      return { deckId, originalTimestamp: deck!.updatedAt };
    });

    await t.mutation(api.decks.saveDeck, {
      token,
      deckId,
      cards: [
        { cardDefinitionId: cards.commonCard, quantity: 3 },
        { cardDefinitionId: cards.uncommonCard, quantity: 3 },
        { cardDefinitionId: cards.rareCard, quantity: 3 },
        ...extraCardIds.map((cardId) => ({ cardDefinitionId: cardId, quantity: 3 })),
      ],
    });

    const updatedDeck = await t.run(async (ctx) => {
      return await ctx.db.get(deckId);
    });

    expect(updatedDeck!.updatedAt).toBeGreaterThan(originalTimestamp);
  });
});

describe("decks.renameDeck", () => {
  test("renames deck successfully", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "adam");

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Old Name",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await t.mutation(api.decks.renameDeck, {
      token,
      deckId,
      newName: "New Name",
    });

    const deck = await t.run(async (ctx) => {
      return await ctx.db.get(deckId);
    });

    expect(deck?.name).toBe("New Name");
  });

  test("trims whitespace from new name", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "bella");

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Old Name",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await t.mutation(api.decks.renameDeck, {
      token,
      deckId,
      newName: "  Trimmed Name  ",
    });

    const deck = await t.run(async (ctx) => {
      return await ctx.db.get(deckId);
    });

    expect(deck?.name).toBe("Trimmed Name");
  });

  test("rejects empty name", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "carl");

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Original Name",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.decks.renameDeck, {
        token,
        deckId,
        newName: "",
      })
    ).rejects.toThrowError("Deck name cannot be empty");
  });

  test("rejects name exceeding 50 characters", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "dana");

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Original Name",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.decks.renameDeck, {
        token,
        deckId,
        newName: "a".repeat(51),
      })
    ).rejects.toThrowError("Deck name cannot exceed 50 characters");
  });

  test("rejects renaming other user's deck", async () => {
    const t = convexTest(schema, modules);
    const { token: token1 } = await createTestUser(t, "eric");
    const { userId: userId2 } = await createTestUser(t, "fiona");

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId: userId2,
        name: "Fiona's Deck",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.decks.renameDeck, {
        token: token1,
        deckId,
        newName: "Stolen Name",
      })
    ).rejects.toThrowError("Deck not found");
  });
});

describe("decks.deleteDeck", () => {
  test("soft deletes deck", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "george");

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "To Be Deleted",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await t.mutation(api.decks.deleteDeck, {
      token,
      deckId,
    });

    const deck = await t.run(async (ctx) => {
      return await ctx.db.get(deckId);
    });

    expect(deck?.isActive).toBe(false);
    expect(deck?.name).toBe("To Be Deleted"); // Data preserved
  });

  test("deleted deck not returned by getUserDecks", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "hannah");

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "To Be Hidden",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await t.mutation(api.decks.deleteDeck, {
      token,
      deckId,
    });

    const decks = await t.query(api.decks.getUserDecks, { token });

    expect(decks).toEqual([]);
  });

  test("rejects deleting other user's deck", async () => {
    const t = convexTest(schema, modules);
    const { token: token1 } = await createTestUser(t, "ivan");
    const { userId: userId2 } = await createTestUser(t, "julia");

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId: userId2,
        name: "Julia's Deck",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.decks.deleteDeck, {
        token: token1,
        deckId,
      })
    ).rejects.toThrowError("Deck not found");
  });

  test("can delete already deleted deck", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "kevin");

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Already Deleted",
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Should not throw
    await t.mutation(api.decks.deleteDeck, {
      token,
      deckId,
    });

    const deck = await t.run(async (ctx) => {
      return await ctx.db.get(deckId);
    });

    expect(deck?.isActive).toBe(false);
  });
});

describe("decks.duplicateDeck", () => {
  test("creates copy of deck with all cards", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "laura");
    const cards = await createTestCards(t);

    const sourceDeckId = await t.run(async (ctx) => {
      const deckId = await ctx.db.insert("userDecks", {
        userId,
        name: "Original Deck",
        description: "Original description",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cards.commonCard,
        quantity: 3,
      });

      return deckId;
    });

    const result = await t.mutation(api.decks.duplicateDeck, {
      token,
      sourceDeckId,
      newName: "Copy of Original",
    });

    expect(result.deckId).toBeDefined();
    expect(result.deckId).not.toBe(sourceDeckId);

    // Verify new deck
    const newDeck = await t.run(async (ctx) => {
      return await ctx.db.get(result.deckId);
    });

    expect(newDeck).toMatchObject({
      name: "Copy of Original",
      description: "Original description",
      isActive: true,
    });

    // Verify cards were copied
    const newDeckCards = await t.run(async (ctx) => {
      return await ctx.db
        .query("deckCards")
        .withIndex("by_deck", (q) => q.eq("deckId", result.deckId))
        .collect();
    });

    expect(newDeckCards).toHaveLength(1);
    expect(newDeckCards[0]).toMatchObject({
      cardDefinitionId: cards.commonCard,
      quantity: 3,
    });
  });

  test("rejects duplicating other user's deck", async () => {
    const t = convexTest(schema, modules);
    const { token: token1 } = await createTestUser(t, "mark");
    const { userId: userId2 } = await createTestUser(t, "nancy");

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId: userId2,
        name: "Nancy's Deck",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.decks.duplicateDeck, {
        token: token1,
        sourceDeckId: deckId,
        newName: "Stolen Copy",
      })
    ).rejects.toThrowError("Source deck not found");
  });

  test("rejects duplicating deleted deck", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "oliver");

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Deleted Deck",
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.decks.duplicateDeck, {
        token,
        sourceDeckId: deckId,
        newName: "Copy",
      })
    ).rejects.toThrowError("Source deck not found");
  });
});

describe("decks.validateDeck", () => {
  test("validates correct deck size", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "peter");
    const cards = await createTestCards(t);

    const deckId = await t.run(async (ctx) => {
      const deckId = await ctx.db.insert("userDecks", {
        userId,
        name: "Valid Deck",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Create a valid 30-card deck: 10 cards × 3 copies each
      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cards.commonCard,
        quantity: 3,
      });
      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cards.uncommonCard,
        quantity: 3,
      });
      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cards.rareCard,
        quantity: 3,
      });

      // Create 7 more cards to reach 30 total
      for (let i = 0; i < 7; i++) {
        const extraCardId = await ctx.db.insert("cardDefinitions", {
          name: `Validation Card ${i}`,
          rarity: "common",
          archetype: "fire",
          cardType: "spell",
          cost: 2,
          isActive: true,
          createdAt: Date.now(),
        });
        await ctx.db.insert("deckCards", {
          deckId,
          cardDefinitionId: extraCardId,
          quantity: 3,
        });
      }

      return deckId;
    });

    const validation = await t.query(api.decks.validateDeck, {
      token,
      deckId,
    });

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(validation.totalCards).toBe(30);
  });

  test("detects too few cards", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "quinn2");
    const cards = await createTestCards(t);

    const deckId = await t.run(async (ctx) => {
      const deckId = await ctx.db.insert("userDecks", {
        userId,
        name: "Too Small",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cards.commonCard,
        quantity: 20,
      });

      return deckId;
    });

    const validation = await t.query(api.decks.validateDeck, {
      token,
      deckId,
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain("Deck needs exactly 30 cards. Currently has 20.");
  });

  test("detects too many copies of non-legendary", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "rita");
    const cards = await createTestCards(t);

    const deckId = await t.run(async (ctx) => {
      const deckId = await ctx.db.insert("userDecks", {
        userId,
        name: "Too Many Copies",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Create a card definition
      const cardId = await ctx.db.insert("cardDefinitions", {
        name: "Test Card",
        rarity: "common",
        archetype: "fire",
        cardType: "spell",
        cost: 1,
        isActive: true,
        createdAt: Date.now(),
      });

      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cardId,
        quantity: 4, // Too many!
      });

      return deckId;
    });

    const validation = await t.query(api.decks.validateDeck, {
      token,
      deckId,
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes("Limited to 3 copies per deck"))).toBe(true);
  });

  test("detects too many legendary copies", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "steve");

    const deckId = await t.run(async (ctx) => {
      const deckId = await ctx.db.insert("userDecks", {
        userId,
        name: "Too Many Legendaries",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const legendaryId = await ctx.db.insert("cardDefinitions", {
        name: "Legendary Card",
        rarity: "legendary",
        archetype: "fire",
        cardType: "creature",
        attack: 10,
        defense: 10,
        cost: 10,
        isActive: true,
        createdAt: Date.now(),
      });

      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: legendaryId,
        quantity: 2, // Too many!
      });

      return deckId;
    });

    const validation = await t.query(api.decks.validateDeck, {
      token,
      deckId,
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes("Legendary cards limited to 1 copy"))).toBe(
      true
    );
  });
});

describe("decks.getDeckStats", () => {
  test("calculates correct statistics", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "terry");
    const cards = await createTestCards(t);

    const deckId = await t.run(async (ctx) => {
      const deckId = await ctx.db.insert("userDecks", {
        userId,
        name: "Stats Test",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // 10 common fire spells (cost 2 each)
      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cards.commonCard,
        quantity: 10,
      });

      // 20 rare earth creatures (cost 5 each)
      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cards.rareCard,
        quantity: 20,
      });

      return deckId;
    });

    const stats = await t.query(api.decks.getDeckStats, {
      token,
      deckId,
    });

    expect(stats.totalCards).toBe(30);
    expect(stats.elementCounts).toMatchObject({
      fire: 10,
      earth: 20,
    });
    expect(stats.rarityCounts).toMatchObject({
      common: 10,
      rare: 20,
    });
    expect(stats.spellCount).toBe(10);
    expect(stats.creatureCount).toBe(20);
    // Average cost: (10 * 2 + 20 * 5) / 30 = 120 / 30 = 4.0
    expect(stats.avgCost).toBe("4.0");
  });

  test("handles empty deck", async () => {
    const t = convexTest(schema, modules);
    const { userId, token } = await createTestUser(t, "uma2");

    const deckId = await t.run(async (ctx) => {
      return await ctx.db.insert("userDecks", {
        userId,
        name: "Empty Deck",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const stats = await t.query(api.decks.getDeckStats, {
      token,
      deckId,
    });

    expect(stats.totalCards).toBe(0);
    expect(stats.avgCost).toBe("0");
  });
});
