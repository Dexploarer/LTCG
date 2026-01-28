"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "../auth/useConvexAuthHook";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

/**
 * useStoryProgress Hook
 *
 * Story chapter progression:
 * - View player progress
 * - Get available chapters
 * - Start/complete/abandon chapters
 * - Track stars and rewards
 */
export function useStoryProgress() {
  const { isAuthenticated } = useAuth();

  // Queries
  const progress = useQuery(
    api.story.getPlayerProgress,
    isAuthenticated ? {} : "skip"
  );

  const availableChapters = useQuery(
    api.story.getAvailableChapters,
    isAuthenticated ? {} : "skip"
  );

  // Mutations
  const startMutation = useMutation(api.story.startChapter);
  const completeMutation = useMutation(api.story.completeChapter);
  const abandonMutation = useMutation(api.story.abandonChapter);

  // Actions
  const startChapter = async (
    actNumber: number,
    chapterNumber: number,
    difficulty: "normal" | "hard" | "legendary"
  ) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await startMutation({ actNumber, chapterNumber, difficulty });
      toast.success("Chapter started!");
    } catch (error: any) {
      toast.error(error.message || "Failed to start chapter");
      throw error;
    }
  };

  const completeChapter = async (
    attemptId: Id<"storyBattleAttempts">,
    won: boolean,
    finalLP: number
  ) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      const result = await completeMutation({
        attemptId,
        won,
        finalLP,
      });
      toast.success(
        `Chapter complete! +${result.rewards.xp} XP, +${result.rewards.gold} gold`
      );
      return result;
    } catch (error: any) {
      toast.error(error.message || "Failed to complete chapter");
      throw error;
    }
  };

  const abandonChapter = async (attemptId: Id<"storyBattleAttempts">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await abandonMutation({ attemptId });
      toast.info("Chapter abandoned");
    } catch (error: any) {
      toast.error(error.message || "Failed to abandon chapter");
      throw error;
    }
  };

  return {
    progress,
    availableChapters,
    isLoading: progress === undefined,
    startChapter,
    completeChapter,
    abandonChapter,
  };
}
