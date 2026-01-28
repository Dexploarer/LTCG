import type { Doc, Id } from "../../../../_generated/dataModel";
import type { MutationCtx } from "../../../../_generated/server";

/**
 * Execute Mill effect - Send cards from top of deck to graveyard
 *
 * Similar to draw effect but sends to GY instead of hand.
 * Checks for deck-out condition.
 */
export async function executeMill(
  ctx: MutationCtx,
  gameState: Doc<"gameStates">,
  playerId: Id<"users">,
  count: number
): Promise<{ success: boolean; message: string }> {
  const isHost = playerId === gameState.hostId;
  const deck = isHost ? gameState.hostDeck : gameState.opponentDeck;
  const graveyard = isHost ? gameState.hostGraveyard : gameState.opponentGraveyard;

  // Check if enough cards in deck
  const actualCount = Math.min(count, deck.length);

  if (actualCount === 0) {
    return { success: false, message: "No cards left in deck to mill" };
  }

  // Take cards from top of deck
  const milledCards = deck.slice(0, actualCount);
  const remainingDeck = deck.slice(actualCount);

  // Add to graveyard
  const newGraveyard = [...graveyard, ...milledCards];

  // Update game state
  await ctx.db.patch(gameState._id, {
    [isHost ? "hostDeck" : "opponentDeck"]: remainingDeck,
    [isHost ? "hostGraveyard" : "opponentGraveyard"]: newGraveyard,
  });

  return {
    success: true,
    message:
      actualCount < count
        ? `Milled ${actualCount} card${actualCount !== 1 ? "s" : ""} (deck empty)`
        : `Milled ${actualCount} card${actualCount !== 1 ? "s" : ""}`,
  };
}
