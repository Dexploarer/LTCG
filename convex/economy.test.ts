/**
 * Tests for economy.ts
 *
 * Tests currency management including:
 * - Currency initialization
 * - Currency adjustments
 * - Transaction history
 * - Promo code redemption
 */

import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("initializePlayerCurrency", () => {
  it("should create currency record with welcome bonus", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        username: "newplayer",
        email: "new@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });
    });

    await t.mutation(internal.economy.initializePlayerCurrency, {
      userId,
      welcomeBonus: {
        gold: 500,
        gems: 100,
      },
    });

    const currency = await t.run(async (ctx) => {
      return await ctx.db
        .query("playerCurrency")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
    });

    expect(currency).toMatchObject({
      gold: 500,
      gems: 100,
      lifetimeGoldEarned: 500,
      lifetimeGemsEarned: 100,
      lifetimeGoldSpent: 0,
      lifetimeGemsSpent: 0,
    });
  });

  it("should not reinitialize if currency already exists", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        username: "existingplayer",
        email: "existing@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });
    });

    // Initialize once
    await t.mutation(internal.economy.initializePlayerCurrency, {
      userId,
      welcomeBonus: { gold: 500, gems: 100 },
    });

    // Try to initialize again
    await t.mutation(internal.economy.initializePlayerCurrency, {
      userId,
      welcomeBonus: { gold: 1000, gems: 200 },
    });

    const currency = await t.run(async (ctx) => {
      return await ctx.db
        .query("playerCurrency")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
    });

    // Should still have original values
    expect(currency?.gold).toBe(500);
    expect(currency?.gems).toBe(100);
  });
});

describe("adjustPlayerCurrency", () => {
  it("should increase gold correctly", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      await ctx.db.insert("playerCurrency", {
        userId: uid,
        gold: 100,
        gems: 50,
        lifetimeGoldEarned: 100,
        lifetimeGoldSpent: 0,
        lifetimeGemsEarned: 50,
        lifetimeGemsSpent: 0,
        lastUpdatedAt: Date.now(),
      });

      return uid;
    });

    await t.mutation(internal.economy.adjustPlayerCurrency, {
      userId,
      goldDelta: 250,
      transactionType: "gift",
      description: "Test reward",
    });

    const currency = await t.run(async (ctx) => {
      return await ctx.db
        .query("playerCurrency")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
    });

    expect(currency?.gold).toBe(350); // 100 + 250
    expect(currency?.lifetimeGoldEarned).toBe(350); // 100 + 250
  });

  it("should decrease gold correctly", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "spender",
        email: "spend@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      await ctx.db.insert("playerCurrency", {
        userId: uid,
        gold: 500,
        gems: 100,
        lifetimeGoldEarned: 500,
        lifetimeGoldSpent: 0,
        lifetimeGemsEarned: 100,
        lifetimeGemsSpent: 0,
        lastUpdatedAt: Date.now(),
      });

      return uid;
    });

    await t.mutation(internal.economy.adjustPlayerCurrency, {
      userId,
      goldDelta: -200,
      transactionType: "purchase",
      description: "Bought pack",
    });

    const currency = await t.run(async (ctx) => {
      return await ctx.db
        .query("playerCurrency")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
    });

    expect(currency?.gold).toBe(300); // 500 - 200
    expect(currency?.lifetimeGoldSpent).toBe(200);
  });

  it("should throw error when insufficient gold", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "pooruser",
        email: "poor@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      await ctx.db.insert("playerCurrency", {
        userId: uid,
        gold: 50,
        gems: 10,
        lifetimeGoldEarned: 50,
        lifetimeGoldSpent: 0,
        lifetimeGemsEarned: 10,
        lifetimeGemsSpent: 0,
        lastUpdatedAt: Date.now(),
      });

      return uid;
    });

    await expect(async () => {
      await t.mutation(internal.economy.adjustPlayerCurrency, {
        userId,
        goldDelta: -200,
        transactionType: "purchase",
        description: "Can't afford",
      });
    }).rejects.toThrowError("Insufficient gold");
  });

  it("should adjust both gold and gems simultaneously", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "trader",
        email: "trade@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      await ctx.db.insert("playerCurrency", {
        userId: uid,
        gold: 1000,
        gems: 200,
        lifetimeGoldEarned: 1000,
        lifetimeGoldSpent: 0,
        lifetimeGemsEarned: 200,
        lifetimeGemsSpent: 0,
        lastUpdatedAt: Date.now(),
      });

      return uid;
    });

    await t.mutation(internal.economy.adjustPlayerCurrency, {
      userId,
      goldDelta: 500,
      gemsDelta: -100,
      transactionType: "conversion",
      description: "Gems to gold",
    });

    const currency = await t.run(async (ctx) => {
      return await ctx.db
        .query("playerCurrency")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
    });

    expect(currency?.gold).toBe(1500);
    expect(currency?.gems).toBe(100);
  });
});

describe("getPlayerBalance", () => {
  it("should return current balance", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      await ctx.db.insert("playerCurrency", {
        userId: uid,
        gold: 750,
        gems: 150,
        lifetimeGoldEarned: 1000,
        lifetimeGoldSpent: 250,
        lifetimeGemsEarned: 200,
        lifetimeGemsSpent: 50,
        lastUpdatedAt: Date.now(),
      });

      await ctx.db.insert("sessions", {
        userId: uid,
        token: "test-token",
        expiresAt: Date.now() + 3600000,
      });
    });

    const balance = await t.query(api.economy.getPlayerBalance, {
      token: "test-token",
    });

    expect(balance).toMatchObject({
      gold: 750,
      gems: 150,
      lifetimeStats: {
        goldEarned: 1000,
        goldSpent: 250,
        gemsEarned: 200,
        gemsSpent: 50,
      },
    });
  });
});

describe("getTransactionHistory", () => {
  it("should return paginated transaction history", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "historyuser",
        email: "history@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      await ctx.db.insert("playerCurrency", {
        userId: uid,
        gold: 500,
        gems: 100,
        lifetimeGoldEarned: 500,
        lifetimeGoldSpent: 0,
        lifetimeGemsEarned: 100,
        lifetimeGemsSpent: 0,
        lastUpdatedAt: Date.now(),
      });

      await ctx.db.insert("sessions", {
        userId: uid,
        token: "history-token",
        expiresAt: Date.now() + 3600000,
      });

      // Create 25 transactions
      for (let i = 0; i < 25; i++) {
        await ctx.db.insert("currencyTransactions", {
          userId: uid,
          transactionType: "reward",
          currencyType: "gold",
          amount: 10,
          balanceAfter: 500 + (i * 10),
          description: `Transaction ${i}`,
          createdAt: Date.now() + i,
        });
      }

      return uid;
    });

    const page1 = await t.query(api.economy.getTransactionHistory, {
      token: "history-token",
      page: 1,
    });

    expect(page1.transactions.length).toBe(20); // Default page size
    expect(page1.total).toBe(25);
    expect(page1.hasMore).toBe(true);

    const page2 = await t.query(api.economy.getTransactionHistory, {
      token: "history-token",
      page: 2,
    });

    expect(page2.transactions.length).toBe(5);
    expect(page2.hasMore).toBe(false);
  });

  it("should filter by currency type", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "filteruser",
        email: "filter@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      await ctx.db.insert("playerCurrency", {
        userId: uid,
        gold: 500,
        gems: 100,
        lifetimeGoldEarned: 500,
        lifetimeGoldSpent: 0,
        lifetimeGemsEarned: 100,
        lifetimeGemsSpent: 0,
        lastUpdatedAt: Date.now(),
      });

      await ctx.db.insert("sessions", {
        userId: uid,
        token: "filter-token",
        expiresAt: Date.now() + 3600000,
      });

      // Create mixed transactions
      for (let i = 0; i < 10; i++) {
        await ctx.db.insert("currencyTransactions", {
          userId: uid,
          transactionType: "reward",
          currencyType: "gold",
          amount: 10,
          balanceAfter: 500,
          description: "Gold transaction",
          createdAt: Date.now() + i,
        });
      }

      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("currencyTransactions", {
          userId: uid,
          transactionType: "reward",
          currencyType: "gems",
          amount: 5,
          balanceAfter: 100,
          description: "Gem transaction",
          createdAt: Date.now() + i + 10,
        });
      }
    });

    const goldOnly = await t.query(api.economy.getTransactionHistory, {
      token: "filter-token",
      currencyType: "gold",
    });

    expect(goldOnly.transactions.length).toBe(10);
    expect(goldOnly.transactions.every(t => t.currencyType === "gold")).toBe(true);

    const gemsOnly = await t.query(api.economy.getTransactionHistory, {
      token: "filter-token",
      currencyType: "gems",
    });

    expect(gemsOnly.transactions.length).toBe(5);
    expect(gemsOnly.transactions.every(t => t.currencyType === "gems")).toBe(true);
  });
});

describe("redeemPromoCode", () => {
  it("should redeem valid promo code", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "promouser",
        email: "promo@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      await ctx.db.insert("playerCurrency", {
        userId: uid,
        gold: 100,
        gems: 50,
        lifetimeGoldEarned: 100,
        lifetimeGoldSpent: 0,
        lifetimeGemsEarned: 50,
        lifetimeGemsSpent: 0,
        lastUpdatedAt: Date.now(),
      });

      await ctx.db.insert("sessions", {
        userId: uid,
        token: "promo-token",
        expiresAt: Date.now() + 3600000,
      });

      await ctx.db.insert("promoCodes", {
        code: "WELCOME200",
        description: "Welcome bonus",
        rewardType: "gold",
        rewardAmount: 200,
        isActive: true,
        redemptionCount: 0,
        createdAt: Date.now(),
      });
    });

    const result = await t.mutation(api.economy.redeemPromoCode, {
      token: "promo-token",
      code: "WELCOME200",
    });

    expect(result.success).toBe(true);
    expect(result.reward).toMatchObject({
      type: "gold",
      amount: 200,
    });

    const balance = await t.query(api.economy.getPlayerBalance, {
      token: "promo-token",
    });

    expect(balance.gold).toBe(300); // 100 + 200
  });

  it("should reject inactive promo code", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      await ctx.db.insert("sessions", {
        userId: uid,
        token: "test-token",
        expiresAt: Date.now() + 3600000,
      });

      await ctx.db.insert("promoCodes", {
        code: "INACTIVE",
        description: "Inactive promo",
        rewardType: "gold",
        rewardAmount: 100,
        isActive: false,
        redemptionCount: 0,
        createdAt: Date.now(),
      });
    });

    await expect(async () => {
      await t.mutation(api.economy.redeemPromoCode, {
        token: "test-token",
        code: "INACTIVE",
      });
    }).rejects.toThrowError("This promo code is no longer active");
  });

  it("should reject duplicate redemption", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "greedy",
        email: "greedy@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      await ctx.db.insert("playerCurrency", {
        userId: uid,
        gold: 100,
        gems: 50,
        lifetimeGoldEarned: 100,
        lifetimeGoldSpent: 0,
        lifetimeGemsEarned: 50,
        lifetimeGemsSpent: 0,
        lastUpdatedAt: Date.now(),
      });

      await ctx.db.insert("sessions", {
        userId: uid,
        token: "greedy-token",
        expiresAt: Date.now() + 3600000,
      });

      const promoId = await ctx.db.insert("promoCodes", {
        code: "ONETIME",
        description: "One-time promo",
        rewardType: "gems",
        rewardAmount: 50,
        isActive: true,
        redemptionCount: 0,
        createdAt: Date.now(),
      });

      return uid;
    });

    // Redeem once
    await t.mutation(api.economy.redeemPromoCode, {
      token: "greedy-token",
      code: "ONETIME",
    });

    // Try to redeem again
    await expect(async () => {
      await t.mutation(api.economy.redeemPromoCode, {
        token: "greedy-token",
        code: "ONETIME",
      });
    }).rejects.toThrowError("You have already redeemed this promo code");
  });

  it("should reject expired promo code", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "lateuser",
        email: "late@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      await ctx.db.insert("sessions", {
        userId: uid,
        token: "late-token",
        expiresAt: Date.now() + 3600000,
      });

      await ctx.db.insert("promoCodes", {
        code: "EXPIRED",
        description: "Expired promo",
        rewardType: "gold",
        rewardAmount: 100,
        isActive: true,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        redemptionCount: 0,
        createdAt: Date.now(),
      });
    });

    await expect(async () => {
      await t.mutation(api.economy.redeemPromoCode, {
        token: "late-token",
        code: "EXPIRED",
      });
    }).rejects.toThrowError("This promo code has expired");
  });

  it("should reject when max redemptions reached", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const uid = await ctx.db.insert("users", {
        username: "toolate",
        email: "toolate@example.com",
        passwordHash: "hash",
        createdAt: Date.now(),
      });

      await ctx.db.insert("sessions", {
        userId: uid,
        token: "toolate-token",
        expiresAt: Date.now() + 3600000,
      });

      await ctx.db.insert("promoCodes", {
        code: "LIMITED",
        description: "Limited promo",
        rewardType: "gold",
        rewardAmount: 100,
        isActive: true,
        maxRedemptions: 10,
        redemptionCount: 10, // Already at max
        createdAt: Date.now(),
      });
    });

    await expect(async () => {
      await t.mutation(api.economy.redeemPromoCode, {
        token: "toolate-token",
        code: "LIMITED",
      });
    }).rejects.toThrowError("This promo code has reached its redemption limit");
  });
});
