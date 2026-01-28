import { v } from "convex/values";
import { mutation, query, internalMutation } from "../_generated/server";
import { requireAuthQuery, requireAuthMutation } from "../lib/convexAuth";
import { ErrorCode, createError } from "../lib/errorCodes";
import { userQuestValidator, questClaimValidator } from "../lib/returnValidators";
import { internal } from "../_generated/api";
import { adjustPlayerCurrencyHelper } from "../economy/economy";

// Type definitions matching schema
type QuestType = "daily" | "weekly" | "achievement";
type GameMode = "ranked" | "casual" | "story";
type QuestStatus = "active" | "completed" | "claimed";

interface QuestRewards {
  gold: number;
  xp: number;
  gems?: number;
}

interface QuestFilters {
  gameMode?: GameMode;
  archetype?: string;
  cardType?: string;
}

interface QuestDefinitionInput {
  questId: string;
  name: string;
  description: string;
  questType: QuestType;
  requirementType: string;
  targetValue: number;
  rewards: QuestRewards;
  filters?: QuestFilters;
  isActive: boolean;
  createdAt: number;
}

/**
 * Get user's active quests with progress
 */
export const getUserQuests = query({
  args: {
    
  },
  returns: v.array(userQuestValidator),
  handler: async (ctx, args) => {
    const { userId } = await requireAuthQuery(ctx);

    // Get user's quests
    const userQuests = await ctx.db
      .query("userQuests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Enrich with quest definitions
    const enrichedQuests = await Promise.all(
      userQuests.map(async (uq) => {
        const definition = await ctx.db
          .query("questDefinitions")
          .withIndex("by_quest_id", (q) => q.eq("questId", uq.questId))
          .first();

        if (!definition) return null;

        return {
          questRecordId: uq._id,
          questId: uq.questId,
          name: definition.name,
          description: definition.description,
          questType: definition.questType,
          requirementType: definition.requirementType,
          currentProgress: uq.currentProgress,
          targetValue: definition.targetValue,
          rewardGold: definition.rewards.gold,
          rewardXp: definition.rewards.xp,
          rewardGems: definition.rewards.gems,
          status: uq.status,
          expiresAt: uq.expiresAt || 0,
        };
      })
    );

    return enrichedQuests.filter((q) => q !== null);
  },
});

/**
 * Claim completed quest rewards
 */
export const claimQuestReward = mutation({
  args: {
    
    questRecordId: v.id("userQuests"),
  },
  returns: questClaimValidator,
  handler: async (ctx, args) => {
    const { userId } = await requireAuthMutation(ctx);

    // Get the quest
    const userQuest = await ctx.db.get(args.questRecordId);
    if (!userQuest || userQuest.userId !== userId) {
      throw createError(ErrorCode.NOT_FOUND_QUEST);
    }

    if (userQuest.status !== "completed") {
      throw createError(ErrorCode.QUEST_NOT_COMPLETED);
    }

    // Get quest definition for rewards
    const definition = await ctx.db
      .query("questDefinitions")
      .withIndex("by_quest_id", (q) => q.eq("questId", userQuest.questId))
      .first();

    if (!definition) {
      throw createError(ErrorCode.NOT_FOUND_QUEST);
    }

    // SECURITY: Use internal mutation to ensure transaction ledger is maintained
    // This properly records currency changes and maintains the audit trail
    // Award gold if any
    if (definition.rewards.gold > 0) {
      await adjustPlayerCurrencyHelper(ctx, {
        userId,
        goldDelta: definition.rewards.gold,
        transactionType: "reward",
        description: `Quest reward: ${definition.name}`,
        referenceId: args.questRecordId,
        metadata: { questId: userQuest.questId, questType: definition.questType },
      });
    }

    // Award gems if any
    if (definition.rewards.gems && definition.rewards.gems > 0) {
      await adjustPlayerCurrencyHelper(ctx, {
        userId,
        gemsDelta: definition.rewards.gems,
        transactionType: "reward",
        description: `Quest reward: ${definition.name}`,
        referenceId: args.questRecordId,
        metadata: { questId: userQuest.questId, questType: definition.questType },
      });
    }

    // Award XP to user
    const userRecord = await ctx.db.get(userId);
    if (userRecord) {
      await ctx.db.patch(userId, {
        xp: (userRecord.xp || 0) + definition.rewards.xp,
      });
    }

    // Mark quest as claimed
    await ctx.db.patch(args.questRecordId, {
      status: "claimed",
      claimedAt: Date.now(),
    });

    return {
      success: true,
      rewards: definition.rewards,
    };
  },
});

/**
 * Update quest progress (internal - called from game events)
 */
export const updateQuestProgress = internalMutation({
  args: {
    userId: v.id("users"),
    event: v.object({
      type: v.string(), // "win_game", "play_card", "deal_damage", etc.
      value: v.number(),
      gameMode: v.optional(v.string()),
      archetype: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Get all active quests for this user
    const userQuests = await ctx.db
      .query("userQuests")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .collect();

    // Update progress for matching quests
    for (const userQuest of userQuests) {
      const definition = await ctx.db
        .query("questDefinitions")
        .withIndex("by_quest_id", (q) => q.eq("questId", userQuest.questId))
        .first();

      if (!definition) continue;

      // Check if event matches quest requirements
      if (definition.requirementType !== args.event.type) continue;

      // Check filters
      if (definition.filters?.gameMode && definition.filters.gameMode !== args.event.gameMode) {
        continue;
      }
      if (definition.filters?.archetype && definition.filters.archetype !== args.event.archetype) {
        continue;
      }

      // Update progress
      const newProgress = Math.min(
        userQuest.currentProgress + args.event.value,
        definition.targetValue
      );

      await ctx.db.patch(userQuest._id, {
        currentProgress: newProgress,
        status: newProgress >= definition.targetValue ? "completed" : "active",
        completedAt: newProgress >= definition.targetValue ? Date.now() : undefined,
      });
    }
  },
});

/**
 * Generate daily quests for user (internal cron job)
 */
export const generateDailyQuests = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Get active daily quest definitions
    const dailyQuests = await ctx.db
      .query("questDefinitions")
      .withIndex("by_type", (q) => q.eq("questType", "daily"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Select 3 random quests
    const selectedQuests = dailyQuests
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // Create user quests
    for (const quest of selectedQuests) {
      await ctx.db.insert("userQuests", {
        userId: args.userId,
        questId: quest.questId,
        currentProgress: 0,
        status: "active",
        startedAt: now,
        expiresAt: now + oneDayMs,
      });
    }
  },
});

/**
 * Clean up expired quests (internal cron job)
 */
export const cleanupExpiredQuests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find expired quests
    const expiredQuests = await ctx.db
      .query("userQuests")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .filter((q) => q.neq(q.field("status"), "claimed"))
      .collect();

    // Delete expired quests
    for (const quest of expiredQuests) {
      await ctx.db.delete(quest._id);
    }
  },
});

/**
 * Seed initial quest definitions (internal)
 */
export const seedQuests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const quests: QuestDefinitionInput[] = [
      // Daily quests - Win games
      {
        questId: "daily_win_1",
        name: "Victory March",
        description: "Win 1 game in any mode",
        questType: "daily",
        requirementType: "win_game",
        targetValue: 1,
        rewards: { gold: 100, xp: 50 },
        filters: undefined,
        isActive: true,
        createdAt: now,
      },
      {
        questId: "daily_win_3",
        name: "Triple Threat",
        description: "Win 3 games in any mode",
        questType: "daily",
        requirementType: "win_game",
        targetValue: 3,
        rewards: { gold: 300, xp: 150, gems: 5 },
        filters: undefined,
        isActive: true,
        createdAt: now,
      },

      // Daily quests - Play games
      {
        questId: "daily_play_5",
        name: "Daily Grind",
        description: "Play 5 games in any mode",
        questType: "daily",
        requirementType: "play_game",
        targetValue: 5,
        rewards: { gold: 200, xp: 100 },
        filters: undefined,
        isActive: true,
        createdAt: now,
      },

      // Daily quests - Ranked wins
      {
        questId: "daily_ranked_win",
        name: "Ranked Warrior",
        description: "Win 1 ranked game",
        questType: "daily",
        requirementType: "win_game",
        targetValue: 1,
        rewards: { gold: 150, xp: 75, gems: 3 },
        filters: { gameMode: "ranked" },
        isActive: true,
        createdAt: now,
      },

      // Daily quests - Story mode
      {
        questId: "daily_story",
        name: "Story Adventurer",
        description: "Complete 2 story stages",
        questType: "daily",
        requirementType: "complete_stage",
        targetValue: 2,
        rewards: { gold: 100, xp: 50 },
        filters: { gameMode: "story" },
        isActive: true,
        createdAt: now,
      },

      // Weekly quests
      {
        questId: "weekly_win_10",
        name: "Weekly Champion",
        description: "Win 10 games this week",
        questType: "weekly",
        requirementType: "win_game",
        targetValue: 10,
        rewards: { gold: 1000, xp: 500, gems: 25 },
        filters: undefined,
        isActive: true,
        createdAt: now,
      },
      {
        questId: "weekly_ranked_5",
        name: "Ranked Climber",
        description: "Win 5 ranked games this week",
        questType: "weekly",
        requirementType: "win_game",
        targetValue: 5,
        rewards: { gold: 750, xp: 375, gems: 20 },
        filters: { gameMode: "ranked" },
        isActive: true,
        createdAt: now,
      },
      {
        questId: "weekly_play_20",
        name: "Weekly Grinder",
        description: "Play 20 games this week",
        questType: "weekly",
        requirementType: "play_game",
        targetValue: 20,
        rewards: { gold: 800, xp: 400, gems: 15 },
        filters: undefined,
        isActive: true,
        createdAt: now,
      },

      // Achievement-style permanent quests
      {
        questId: "achievement_win_50",
        name: "Master Duelist",
        description: "Win 50 games total",
        questType: "achievement",
        requirementType: "win_game",
        targetValue: 50,
        rewards: { gold: 2000, xp: 1000, gems: 50 },
        filters: undefined,
        isActive: true,
        createdAt: now,
      },
      {
        questId: "achievement_ranked_25",
        name: "Ranked Elite",
        description: "Win 25 ranked games",
        questType: "achievement",
        requirementType: "win_game",
        targetValue: 25,
        rewards: { gold: 1500, xp: 750, gems: 40 },
        filters: { gameMode: "ranked" },
        isActive: true,
        createdAt: now,
      },
    ];

    // Insert quests if they don't exist
    for (const quest of quests) {
      const existing = await ctx.db
        .query("questDefinitions")
        .withIndex("by_quest_id", (q) => q.eq("questId", quest.questId))
        .first();

      if (!existing) {
        await ctx.db.insert("questDefinitions", quest);
      }
    }

    return { success: true, count: quests.length };
  },
});
