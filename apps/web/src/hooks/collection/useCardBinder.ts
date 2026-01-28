"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "../auth/useConvexAuthHook";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

/**
 * useCardBinder Hook
 *
 * Card collection management:
 * - View all user cards
 * - Favorite cards
 * - Collection statistics
 */
export function useCardBinder() {
  const { isAuthenticated } = useAuth();

  // Queries
  const userCards = useQuery(
    api.cards.getUserCards,
    isAuthenticated ? {} : "skip"
  );

  const favoriteCards = useQuery(
    api.cards.getUserFavoriteCards,
    isAuthenticated ? {} : "skip"
  );

  const collectionStats = useQuery(
    api.cards.getUserCollectionStats,
    isAuthenticated ? {} : "skip"
  );

  // Mutation
  const toggleFavoriteMutation = useMutation(api.cards.toggleFavorite);

  const toggleFavorite = async (playerCardId: Id<"playerCards">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await toggleFavoriteMutation({ playerCardId });
      // Don't show toast for favorite toggle (too noisy)
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle favorite");
      throw error;
    }
  };

  return {
    userCards,
    favoriteCards,
    collectionStats,
    isLoading: userCards === undefined,
    toggleFavorite,
  };
}
