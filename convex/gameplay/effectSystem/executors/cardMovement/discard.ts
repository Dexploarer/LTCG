import type { Doc, Id } from "../../../../_generated/dataModel";
import type { MutationCtx } from "../../../../_generated/server";

/**
 * Execute Discard effect - Discard cards from hand to graveyard
 *
 * Supports random discard (default) and targeted discard.
 * For random discard, randomly selects cards from hand.
 */
export async function executeDiscard(
  ctx: MutationCtx,
  gameState: Doc<"gameStates">,
  playerId: Id<"users">,
  count: number,
  targets?: Id<"cardDefinitions">[]
): Promise<{ success: boolean; message: string }> {
  const isHost = playerId === gameState.hostId;
  const hand = isHost ? gameState.hostHand : gameState.opponentHand;
  const graveyard = isHost ? gameState.hostGraveyard : gameState.opponentGraveyard;

  // Check if enough cards in hand
  const actualCount = Math.min(count, hand.length);

  if (actualCount === 0) {
    return { success: false, message: "No cards in hand to discard" };
  }

  let discardedCards: Id<"cardDefinitions">[];

  if (targets && targets.length > 0) {
    // Targeted discard - discard specific cards
    discardedCards = targets.slice(0, actualCount).filter((cardId) => hand.includes(cardId));
  } else {
    // Random discard - randomly select cards from hand
    const shuffledHand = [...hand].sort(() => Math.random() - 0.5);
    discardedCards = shuffledHand.slice(0, actualCount);
  }

  // Remove discarded cards from hand
  const newHand = hand.filter((cardId) => !discardedCards.includes(cardId));

  // Add to graveyard
  const newGraveyard = [...graveyard, ...discardedCards];

  // Update game state
  await ctx.db.patch(gameState._id, {
    [isHost ? "hostHand" : "opponentHand"]: newHand,
    [isHost ? "hostGraveyard" : "opponentGraveyard"]: newGraveyard,
  });

  return {
    success: true,
    message: `Discarded ${discardedCards.length} card${discardedCards.length !== 1 ? "s" : ""}`,
  };
}
