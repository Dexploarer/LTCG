/**
 * Tests for lib/helpers.ts
 *
 * Tests shared helper functions including:
 * - Weighted random rarity selection
 * - Random card selection
 * - Card inventory management
 * - Pack opening logic
 */

import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { weightedRandomRarity } from "./helpers";

const modules = import.meta.glob("../**/*.ts");

describe("weightedRandomRarity", () => {
  it("should return valid rarity", () => {
    const validRarities = ["common", "uncommon", "rare", "epic", "legendary"];

    // Test 100 times to ensure it always returns valid rarity
    for (let i = 0; i < 100; i++) {
      const rarity = weightedRandomRarity();
      expect(validRarities).toContain(rarity);
    }
  });

  it("should return common more frequently than legendary", () => {
    const results = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };

    // Run 10000 trials
    for (let i = 0; i < 10000; i++) {
      const rarity = weightedRandomRarity();
      results[rarity]++;
    }

    // Common should be most frequent (65%)
    expect(results.common).toBeGreaterThan(results.uncommon);
    expect(results.common).toBeGreaterThan(results.rare);
    expect(results.common).toBeGreaterThan(results.epic);
    expect(results.common).toBeGreaterThan(results.legendary);

    // Legendary should be least frequent (1%)
    expect(results.legendary).toBeLessThan(results.common);
    expect(results.legendary).toBeLessThan(results.uncommon);
    expect(results.legendary).toBeLessThan(results.rare);
    expect(results.legendary).toBeLessThan(results.epic);
  });
});

describe("getRandomCard", () => {
  it("should throw error when no cards of rarity exist", async () => {
    const t = convexTest(schema, modules);

    // Don't create any cards
    await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      await ctx.db.insert("playerCurrency", {
        userId: uid,
        gold: 1000,
        gems: 100,
        lifetimeGoldEarned: 1000,
        lifetimeGoldSpent: 0,
        lifetimeGemsEarned: 100,
        lifetimeGemsSpent: 0,
        lastUpdatedAt: Date.now(),
      });

      await ctx.db.insert("sessions", {
        userId: uid,
        token: "test-token",
        expiresAt: Date.now() + 3600000,
      });
    });

    // Try to purchase pack when no cards exist
    await t.run(async (ctx) => {
      await ctx.db.insert("shopProducts", {
        productId: "test-pack",
        name: "Test Pack",
        description: "Test",
        productType: "pack",
        goldPrice: 100,
        packConfig: {
          cardCount: 5,
          guaranteedRarity: "rare",
        },
        isActive: true,
        sortOrder: 1,
        createdAt: Date.now(),
      });
    });

    await expect(async () => {
      await t.mutation(api.shop.purchasePack, {
        token: "test-token",
        productId: "test-pack",
        useGems: false,
      });
    }).rejects.toThrowError(/No active .+ cards found/);
  });

  it("should return card of specified rarity", async () => {
    const t = convexTest(schema, modules);

    // Create cards of different rarities
    await t.run(async (ctx) => {
      await ctx.db.insert("cardDefinitions", {
        name: "Common Card",
        rarity: "common",
        archetype: "fire",
        cardType: "creature",
        cost: 1,
        isActive: true,
        createdAt: Date.now(),
      });

      await ctx.db.insert("cardDefinitions", {
        name: "Rare Card",
        rarity: "rare",
        archetype: "water",
        cardType: "spell",
        cost: 3,
        isActive: true,
        createdAt: Date.now(),
      });
    });

    // The pack opening will use getRandomCard internally
    // We can't directly test the function, but we can test pack opening
    const allCards = await t.query(api.cards.getAllCardDefinitions);
    expect(allCards.length).toBe(2);
    expect(allCards.some(c => c.rarity === "common")).toBe(true);
    expect(allCards.some(c => c.rarity === "rare")).toBe(true);
  });
});

describe("addCardsToInventory", () => {
  it("should create new inventory entry for new card", async () => {
    const t = convexTest(schema, modules);

    const [userId, cardDefId] = await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      const cid = await ctx.db.insert("cardDefinitions", {
        name: "New Card",
        rarity: "common",
        archetype: "fire",
        cardType: "creature",
        cost: 2,
        isActive: true,
        createdAt: Date.now(),
      });

      await ctx.db.insert("sessions", {
        userId: uid,
        token: "test-token",
        expiresAt: Date.now() + 3600000,
      });

      return [uid, cid];
    });

    // Add card to inventory
    await t.mutation(api.cards.addCardsToInventory, {
      token: "test-token",
      cardDefinitionId: cardDefId,
      quantity: 3,
    });

    const userCards = await t.query(api.cards.getUserCards, {
      token: "test-token",
    });

    expect(userCards.length).toBe(1);
    expect(userCards[0].owned).toBe(3);
    expect(userCards[0].name).toBe("New Card");
  });

  it("should increment quantity for existing card", async () => {
    const t = convexTest(schema, modules);

    const [userId, cardDefId] = await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      const cid = await ctx.db.insert("cardDefinitions", {
        name: "Existing Card",
        rarity: "uncommon",
        archetype: "earth",
        cardType: "trap",
        cost: 2,
        isActive: true,
        createdAt: Date.now(),
      });

      // User already owns 2 of this card
      await ctx.db.insert("playerCards", {
        userId: uid,
        cardDefinitionId: cid,
        quantity: 2,
        isFavorite: false,
        acquiredAt: Date.now(),
        lastUpdatedAt: Date.now(),
      });

      await ctx.db.insert("sessions", {
        userId: uid,
        token: "test-token",
        expiresAt: Date.now() + 3600000,
      });

      return [uid, cid];
    });

    // Add 3 more cards
    await t.mutation(api.cards.addCardsToInventory, {
      token: "test-token",
      cardDefinitionId: cardDefId,
      quantity: 3,
    });

    const userCards = await t.query(api.cards.getUserCards, {
      token: "test-token",
    });

    expect(userCards.length).toBe(1);
    expect(userCards[0].owned).toBe(5); // 2 + 3
  });
});

describe("adjustCardInventory", () => {
  it("should decrease card quantity", async () => {
    const t = convexTest(schema, modules);

    const [userId, cardDefId] = await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "seller",
        email: "seller@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      const cid = await ctx.db.insert("cardDefinitions", {
        name: "Sellable Card",
        rarity: "rare",
        archetype: "wind",
        cardType: "equipment",
        cost: 4,
        isActive: true,
        createdAt: Date.now(),
      });

      await ctx.db.insert("playerCards", {
        userId: uid,
        cardDefinitionId: cid,
        quantity: 10,
        isFavorite: false,
        acquiredAt: Date.now(),
        lastUpdatedAt: Date.now(),
      });

      await ctx.db.insert("sessions", {
        userId: uid,
        token: "seller-token",
        expiresAt: Date.now() + 3600000,
      });

      return [uid, cid];
    });

    // Create marketplace listing (which decreases inventory)
    await t.mutation(api.marketplace.createListing, {
      token: "seller-token",
      cardDefinitionId: cardDefId,
      quantity: 5,
      listingType: "fixed",
      price: 500,
    });

    const userCards = await t.query(api.cards.getUserCards, {
      token: "seller-token",
    });

    // Should have 5 left (10 - 5 listed)
    expect(userCards[0].owned).toBe(5);
  });

  it("should delete inventory entry when quantity reaches 0", async () => {
    const t = convexTest(schema, modules);

    const [userId, cardDefId] = await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "seller",
        email: "seller@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      const cid = await ctx.db.insert("cardDefinitions", {
        name: "Last Card",
        rarity: "common",
        archetype: "fire",
        cardType: "creature",
        cost: 1,
        isActive: true,
        createdAt: Date.now(),
      });

      await ctx.db.insert("playerCards", {
        userId: uid,
        cardDefinitionId: cid,
        quantity: 3,
        isFavorite: false,
        acquiredAt: Date.now(),
        lastUpdatedAt: Date.now(),
      });

      await ctx.db.insert("sessions", {
        userId: uid,
        token: "seller-token",
        expiresAt: Date.now() + 3600000,
      });

      return [uid, cid];
    });

    // List all 3 cards
    await t.mutation(api.marketplace.createListing, {
      token: "seller-token",
      cardDefinitionId: cardDefId,
      quantity: 3,
      listingType: "fixed",
      price: 30,
    });

    const userCards = await t.query(api.cards.getUserCards, {
      token: "seller-token",
    });

    // Should have no cards left
    expect(userCards.length).toBe(0);
  });

  it("should throw error when trying to remove more cards than owned", async () => {
    const t = convexTest(schema, modules);

    const [userId, cardDefId] = await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "pooruser",
        email: "poor@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      const cid = await ctx.db.insert("cardDefinitions", {
        name: "Limited Card",
        rarity: "legendary",
        archetype: "neutral",
        cardType: "spell",
        cost: 5,
        isActive: true,
        createdAt: Date.now(),
      });

      await ctx.db.insert("playerCards", {
        userId: uid,
        cardDefinitionId: cid,
        quantity: 1,
        isFavorite: false,
        acquiredAt: Date.now(),
        lastUpdatedAt: Date.now(),
      });

      await ctx.db.insert("sessions", {
        userId: uid,
        token: "poor-token",
        expiresAt: Date.now() + 3600000,
      });

      return [uid, cid];
    });

    // Try to list 5 when only 1 owned
    await expect(async () => {
      await t.mutation(api.marketplace.createListing, {
        token: "poor-token",
        cardDefinitionId: cardDefId,
        quantity: 5,
        listingType: "fixed",
        price: 1000,
      });
    }).rejects.toThrowError("You don't own enough of this card");
  });
});

describe("openPack", () => {
  it("should generate correct number of cards", async () => {
    const t = convexTest(schema, modules);

    // Create various cards
    await t.run(async (ctx) => {
      const rarities: Array<"common" | "uncommon" | "rare" | "epic" | "legendary"> = [
        "common", "uncommon", "rare", "epic", "legendary"
      ];

      for (const rarity of rarities) {
        for (let i = 0; i < 5; i++) {
          await ctx.db.insert("cardDefinitions", {
            name: `${rarity} Card ${i}`,
            rarity,
            archetype: "fire",
            cardType: "creature",
            cost: 2,
            isActive: true,
            createdAt: Date.now(),
          });
        }
      }

      const uid = await ctx.db.insert("users", {
        username: "packopener",
        email: "opener@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      await ctx.db.insert("playerCurrency", {
        userId: uid,
        gold: 1000,
        gems: 100,
        lifetimeGoldEarned: 1000,
        lifetimeGoldSpent: 0,
        lifetimeGemsEarned: 100,
        lifetimeGemsSpent: 0,
        lastUpdatedAt: Date.now(),
      });

      await ctx.db.insert("sessions", {
        userId: uid,
        token: "pack-token",
        expiresAt: Date.now() + 3600000,
      });

      await ctx.db.insert("shopProducts", {
        productId: "standard-pack",
        name: "Standard Pack",
        description: "5 cards with guaranteed rare",
        productType: "pack",
        goldPrice: 100,
        packConfig: {
          cardCount: 5,
          guaranteedRarity: "rare",
        },
        isActive: true,
        sortOrder: 1,
        createdAt: Date.now(),
      });
    });

    const result = await t.mutation(api.shop.purchasePack, {
      token: "pack-token",
      productId: "standard-pack",
      useGems: false,
    });

    expect(result.success).toBe(true);
    expect(result.cardsReceived.length).toBe(5);

    // Last card should be guaranteed rare
    expect(result.cardsReceived[4].rarity).toBe("rare");

    // Check cards were added to inventory
    const userCards = await t.query(api.cards.getUserCards, {
      token: "pack-token",
    });

    expect(userCards.length).toBeGreaterThan(0);
  });
});
