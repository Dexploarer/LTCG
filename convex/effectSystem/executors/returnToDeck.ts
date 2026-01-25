import type { MutationCtx } from "../../_generated/server";
import type { Id, Doc } from "../../_generated/dataModel";
import { api } from "../../_generated/api";

/**
 * Execute Return to Deck effect - Return card from field/hand/GY to deck
 *
 * @param ctx - Mutation context
 * @param gameState - Current game state
 * @param lobbyId - Lobby ID for events
 * @param targetCardId - Card to return to deck
 * @param playerId - Player activating the effect
 * @param fromLocation - Source location (board, hand, graveyard)
 * @param position - Where to place in deck (top, bottom, shuffle)
 * @returns Success status and message
 */
export async function executeReturnToDeck(
  ctx: MutationCtx,
  gameState: Doc<"gameStates">,
  lobbyId: Id<"gameLobbies">,
  targetCardId: Id<"cardDefinitions">,
  playerId: Id<"users">,
  fromLocation: "board" | "hand" | "graveyard" = "board",
  position: "top" | "bottom" | "shuffle" = "shuffle"
): Promise<{ success: boolean; message: string }> {
  const isHost = playerId === gameState.hostId;

  // Get card details
  const card = await ctx.db.get(targetCardId);
  if (!card) {
    return { success: false, message: "Target card not found" };
  }

  // Determine which player owns the card
  let targetIsHost = isHost;
  let sourceField: string;
  let deckField: string;

  if (fromLocation === "board") {
    const onHostBoard = gameState.hostBoard.some(bc => bc.cardId === targetCardId);
    const onOpponentBoard = gameState.opponentBoard.some(bc => bc.cardId === targetCardId);

    if (!onHostBoard && !onOpponentBoard) {
      return { success: false, message: "Card not found on field" };
    }

    targetIsHost = onHostBoard;
    sourceField = targetIsHost ? "hostBoard" : "opponentBoard";
    deckField = targetIsHost ? "hostDeck" : "opponentDeck";

    // Remove from board
    const board = targetIsHost ? gameState.hostBoard : gameState.opponentBoard;
    const newBoard = board.filter(bc => bc.cardId !== targetCardId);

    // Add to deck at specified position
    const deck = targetIsHost ? gameState.hostDeck : gameState.opponentDeck;
    let newDeck: Id<"cardDefinitions">[];

    if (position === "top") {
      newDeck = [targetCardId, ...deck];
    } else if (position === "bottom") {
      newDeck = [...deck, targetCardId];
    } else {
      // shuffle - just add and treat as shuffled (simplified)
      newDeck = [...deck, targetCardId];
    }

    await ctx.db.patch(gameState._id, {
      [sourceField]: newBoard,
      [deckField]: newDeck,
    });
  } else if (fromLocation === "hand") {
    const inHostHand = gameState.hostHand.includes(targetCardId);
    const inOpponentHand = gameState.opponentHand.includes(targetCardId);

    if (!inHostHand && !inOpponentHand) {
      return { success: false, message: "Card not found in hand" };
    }

    targetIsHost = inHostHand;
    sourceField = targetIsHost ? "hostHand" : "opponentHand";
    deckField = targetIsHost ? "hostDeck" : "opponentDeck";

    // Remove from hand
    const hand = targetIsHost ? gameState.hostHand : gameState.opponentHand;
    const newHand = hand.filter(c => c !== targetCardId);

    // Add to deck at specified position
    const deck = targetIsHost ? gameState.hostDeck : gameState.opponentDeck;
    let newDeck: Id<"cardDefinitions">[];

    if (position === "top") {
      newDeck = [targetCardId, ...deck];
    } else if (position === "bottom") {
      newDeck = [...deck, targetCardId];
    } else {
      newDeck = [...deck, targetCardId];
    }

    await ctx.db.patch(gameState._id, {
      [sourceField]: newHand,
      [deckField]: newDeck,
    });
  } else {
    // graveyard
    const inHostGY = gameState.hostGraveyard.includes(targetCardId);
    const inOpponentGY = gameState.opponentGraveyard.includes(targetCardId);

    if (!inHostGY && !inOpponentGY) {
      return { success: false, message: "Card not found in graveyard" };
    }

    targetIsHost = inHostGY;
    sourceField = targetIsHost ? "hostGraveyard" : "opponentGraveyard";
    deckField = targetIsHost ? "hostDeck" : "opponentDeck";

    // Remove from graveyard
    const graveyard = targetIsHost ? gameState.hostGraveyard : gameState.opponentGraveyard;
    const newGraveyard = graveyard.filter(c => c !== targetCardId);

    // Add to deck at specified position
    const deck = targetIsHost ? gameState.hostDeck : gameState.opponentDeck;
    let newDeck: Id<"cardDefinitions">[];

    if (position === "top") {
      newDeck = [targetCardId, ...deck];
    } else if (position === "bottom") {
      newDeck = [...deck, targetCardId];
    } else {
      newDeck = [...deck, targetCardId];
    }

    await ctx.db.patch(gameState._id, {
      [sourceField]: newGraveyard,
      [deckField]: newDeck,
    });
  }

  // Record event
  const lobby = await ctx.db.get(lobbyId);
  const user = await ctx.db.get(playerId);

  await ctx.runMutation(api.gameEvents.recordEvent, {
    lobbyId,
    gameId: lobby?.gameId || "",
    turnNumber: lobby?.turnNumber || 0,
    eventType: "effect_activated",
    playerId: playerId,
    playerUsername: user?.username || "Unknown",
    description: `Returned ${card.name} from ${fromLocation} to deck (${position})`,
    metadata: { cardId: targetCardId, fromLocation, position, effectType: "return_to_deck" },
  });

  const positionText = position === "shuffle" ? "and shuffled" : `(${position})`;
  return { success: true, message: `Returned ${card.name} from ${fromLocation} to deck ${positionText}` };
}
