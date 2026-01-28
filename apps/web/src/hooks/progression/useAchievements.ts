"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "../auth/useConvexAuthHook";

/**
 * useAchievements Hook
 *
 * Manages user achievements:
 * - View all achievements with progress
 * - Filter by category, rarity, unlock status
 * - Track completion percentage
 */
export function useAchievements() {
  const { isAuthenticated } = useAuth();

  // Query for user's achievements
  const achievements = useQuery(
    api.progression.achievements.getUserAchievements,
    isAuthenticated ? {} : "skip"
  );

  // Separate achievements by status
  type Achievement = NonNullable<typeof achievements>[number];
  const unlockedAchievements = achievements?.filter((a: Achievement) => a.isUnlocked) || [];
  const lockedAchievements = achievements?.filter((a: Achievement) => !a.isUnlocked) || [];

  // Filter by category
  const byCategory = (category: string) =>
    achievements?.filter((a: Achievement) => a.category === category) || [];

  // Filter by rarity
  const byRarity = (rarity: string) =>
    achievements?.filter((a: Achievement) => a.rarity === rarity) || [];

  // Calculate completion percentage
  const totalAchievements = achievements?.length || 0;
  const unlockedCount = unlockedAchievements.length;
  const completionPercent =
    totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;

  // Get achievements by rarity
  const commonAchievements = byRarity("common");
  const rareAchievements = byRarity("rare");
  const epicAchievements = byRarity("epic");
  const legendaryAchievements = byRarity("legendary");

  // Get achievements by category
  const winsAchievements = byCategory("wins");
  const gamesPlayedAchievements = byCategory("games_played");
  const collectionAchievements = byCategory("collection");
  const socialAchievements = byCategory("social");
  const storyAchievements = byCategory("story");
  const rankedAchievements = byCategory("ranked");
  const specialAchievements = byCategory("special");

  return {
    // Data
    achievements: achievements || [],
    unlockedAchievements,
    lockedAchievements,

    // By rarity
    commonAchievements,
    rareAchievements,
    epicAchievements,
    legendaryAchievements,

    // By category
    winsAchievements,
    gamesPlayedAchievements,
    collectionAchievements,
    socialAchievements,
    storyAchievements,
    rankedAchievements,
    specialAchievements,

    // Stats
    totalAchievements,
    unlockedCount,
    lockedCount: lockedAchievements.length,
    completionPercent,

    // Loading state
    isLoading: achievements === undefined,

    // Helper functions
    byCategory,
    byRarity,
  };
}
