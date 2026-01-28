/**
 * Hook for managing story mode battles
 *
 * Handles AI opponent turns and battle completion
 */

import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

interface UseStoryBattleProps {
  lobbyId: Id<"gameLobbies">;
  gameId: string;
  onBattleComplete?: (result: {
    won: boolean;
    rewards: {
      gold: number;
      xp: number;
      cards: any[];
    };
    starsEarned: number;
  }) => void;
}

export function useStoryBattle({ lobbyId, gameId, onBattleComplete }: UseStoryBattleProps) {
  const executeAITurnMutation = useMutation(api.gameplay.ai.aiTurn.executeAITurn);
  const completeBattleMutation = useMutation(api.progression.story.completeChapter);

  // Get game state to check if AI needs to take turn
  const gameState = useQuery(api.gameplay.games.queries.getGameStateForPlayer, { lobbyId });

  // Track if we're currently executing AI turn
  const isExecutingAITurn = useRef(false);

  // Auto-execute AI turn when it's AI's turn
  useEffect(() => {
    if (!gameState || isExecutingAITurn.current) return;

    // Check if it's AI's turn (opponent's turn in story mode)
    if (!gameState.isYourTurn && gameState.currentPhase === "draw") {
      isExecutingAITurn.current = true;

      // Execute AI turn after a brief delay for UX
      setTimeout(async () => {
        try {
          await executeAITurnMutation({ gameId });
        } catch (error) {
          console.error("AI turn failed:", error);
        } finally {
          isExecutingAITurn.current = false;
        }
      }, 1500);
    }
  }, [gameState, gameId, executeAITurnMutation]);

  // Complete story battle
  const completeBattle = useCallback(
    async (attemptId: Id<"storyBattleAttempts">, won: boolean, finalLP: number) => {
      try {
        const result = await completeBattleMutation({
          attemptId,
          won,
          finalLP,
        });

        onBattleComplete?.(result);

        return { success: true, result };
      } catch (error) {
        console.error("Failed to complete story battle:", error);
        return { success: false, error: String(error) };
      }
    },
    [completeBattleMutation, onBattleComplete]
  );

  return {
    completeBattle,
    isAITurn: !gameState?.isYourTurn,
    isExecutingAITurn: isExecutingAITurn.current,
  };
}
