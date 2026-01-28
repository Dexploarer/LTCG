"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "../auth/useConvexAuthHook";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

/**
 * useDeckBuilder Hook
 *
 * Complete deck CRUD operations:
 * - Create, save, rename, delete, duplicate decks
 * - Set active deck
 * - Validate deck composition
 * - Retrieve deck details with cards
 */
export function useDeckBuilder() {
  const { isAuthenticated } = useAuth();

  // Queries
  const decks = useQuery(
    api.decks.getUserDecks,
    isAuthenticated ? {} : "skip"
  );

  // Mutations
  const createMutation = useMutation(api.decks.createDeck);
  const saveMutation = useMutation(api.decks.saveDeck);
  const renameMutation = useMutation(api.decks.renameDeck);
  const deleteMutation = useMutation(api.decks.deleteDeck);
  const duplicateMutation = useMutation(api.decks.duplicateDeck);
  const setActiveMutation = useMutation(api.decks.setActiveDeck);

  // Helper function to get a specific deck
  const useDeck = (deckId: Id<"userDecks"> | null) => {
    return useQuery(
      api.decks.getDeckWithCards,
      isAuthenticated && deckId ? { deckId } : "skip"
    );
  };

  // Helper function to validate a deck
  const useValidateDeck = (deckId: Id<"userDecks"> | null) => {
    return useQuery(
      api.decks.validateDeck,
      isAuthenticated && deckId ? { deckId } : "skip"
    );
  };

  // Actions
  const createDeck = async (name: string) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      const deckId = await createMutation({ name });
      toast.success(`Deck "${name}" created`);
      return deckId;
    } catch (error: any) {
      toast.error(error.message || "Failed to create deck");
      throw error;
    }
  };

  const saveDeck = async (
    deckId: Id<"userDecks">,
    cards: Array<{ cardDefinitionId: Id<"cardDefinitions">; quantity: number }>
  ) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await saveMutation({ deckId, cards });
      toast.success("Deck saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save deck");
      throw error;
    }
  };

  const renameDeck = async (deckId: Id<"userDecks">, newName: string) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await renameMutation({ deckId, newName });
      toast.success(`Deck renamed to "${newName}"`);
    } catch (error: any) {
      toast.error(error.message || "Failed to rename deck");
      throw error;
    }
  };

  const deleteDeck = async (deckId: Id<"userDecks">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await deleteMutation({ deckId });
      toast.success("Deck deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete deck");
      throw error;
    }
  };

  const duplicateDeck = async (deckId: Id<"userDecks">, newName?: string) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      // Find source deck to generate a name if not provided
      const sourceDeck = decks?.find((d: NonNullable<typeof decks>[number]) => d.id === deckId);
      const duplicateName = newName || (sourceDeck ? `${sourceDeck.name} (Copy)` : "Deck Copy");

      const newDeckId = await duplicateMutation({
        newName: duplicateName,
        sourceDeckId: deckId
      });
      toast.success("Deck duplicated");
      return newDeckId;
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate deck");
      throw error;
    }
  };

  const setActiveDeck = async (deckId: Id<"userDecks">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await setActiveMutation({ deckId });
      toast.success("Active deck updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to set active deck");
      throw error;
    }
  };

  return {
    // Data
    decks,
    isLoading: decks === undefined,

    // Getters (hooks to be used in components)
    useDeck,
    useValidateDeck,

    // Actions
    createDeck,
    saveDeck,
    renameDeck,
    deleteDeck,
    duplicateDeck,
    setActiveDeck,
  };
}
