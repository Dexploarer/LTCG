import type { MutationCtx } from "../../_generated/server";
import type { Id, Doc } from "../../_generated/dataModel";

export async function executeDraw(
  ctx: MutationCtx,
  gameState: Doc<"gameStates">,
  playerId: Id<"users">,
  count: number
): Promise<{ success: boolean; message: string }> {

  const isHost = playerId === gameState.hostId;
  const deck = isHost ? gameState.hostDeck : gameState.opponentDeck;
  const hand = isHost ? gameState.hostHand : gameState.opponentHand;

  // Check if enough cards in deck
  if (deck.length < count) {
    // Deck out - game loss
    return { success: false, message: "Not enough cards in deck (deck out)" };
  }

  // Draw cards
  const drawnCards = deck.slice(0, count);
  const newDeck = deck.slice(count);
  const newHand = [...hand, ...drawnCards];

  await ctx.db.patch(gameState._id, {
    [isHost ? "hostDeck" : "opponentDeck"]: newDeck,
    [isHost ? "hostHand" : "opponentHand"]: newHand,
  });

  return { success: true, message: `Drew ${count} card(s)` };
}
