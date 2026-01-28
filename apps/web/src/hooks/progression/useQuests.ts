"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "../auth/useConvexAuthHook";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

/**
 * useQuests Hook
 *
 * Manages user quests:
 * - View active/completed quests
 * - Claim quest rewards
 * - Track quest progress
 */
export function useQuests() {
  const { isAuthenticated } = useAuth();

  // Query for user's quests
  const quests = useQuery(
    api.progression.quests.getUserQuests,
    isAuthenticated ? {} : "skip"
  );

  // Mutation to claim quest rewards
  const claimRewardMutation = useMutation(api.progression.quests.claimQuestReward);

  // Action to claim quest reward
  const claimQuestReward = async (questRecordId: Id<"userQuests">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");

    try {
      const result = await claimRewardMutation({ questRecordId });
      const gemsText = result.rewards.gems ? `, ${result.rewards.gems} Gems` : "";
      toast.success(`Claimed rewards: ${result.rewards.gold} Gold, ${result.rewards.xp} XP${gemsText}`);
      return result;
    } catch (error: any) {
      toast.error(error.message || "Failed to claim quest reward");
      throw error;
    }
  };

  // Separate quests by type
  type Quest = NonNullable<typeof quests>[number];
  const activeQuests = quests?.filter((q: Quest) => q.status === "active") || [];
  const completedQuests = quests?.filter((q: Quest) => q.status === "completed") || [];
  const claimedQuests = quests?.filter((q: Quest) => q.status === "claimed") || [];
  const dailyQuests = quests?.filter((q: Quest) => q.questType === "daily") || [];
  const weeklyQuests = quests?.filter((q: Quest) => q.questType === "weekly") || [];
  const achievementQuests = quests?.filter((q: Quest) => q.questType === "achievement") || [];

  return {
    // Data
    quests: quests || [],
    activeQuests,
    completedQuests,
    claimedQuests,
    dailyQuests,
    weeklyQuests,
    achievementQuests,

    // Counts
    activeCount: activeQuests.length,
    completedCount: completedQuests.length,
    totalCount: quests?.length || 0,

    // Loading state
    isLoading: quests === undefined,

    // Actions
    claimQuestReward,
  };
}
