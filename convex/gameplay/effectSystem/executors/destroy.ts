import type { MutationCtx } from "../../../_generated/server";
import type { Id, Doc } from "../../../_generated/dataModel";
import { parseAbility } from "../parser";
import { recordEventHelper } from "../../gameEvents";
// Note: executeEffect creates circular dependency - on_destroy triggers disabled
// TODO: Handle on_destroy triggers in executor.ts or pass as callback

export async function executeDestroy(
  ctx: MutationCtx,
  gameState: Doc<"gameStates">,
  lobbyId: Id<"gameLobbies">,
  targetCardId: Id<"cardDefinitions">,
  playerId: Id<"users">
): Promise<{ success: boolean; message: string }> {

  const isHost = playerId === gameState.hostId;

  // Check both boards for target
  const hostBoard = gameState.hostBoard;
  const opponentBoard = gameState.opponentBoard;

  const onHostBoard = hostBoard.some(bc => bc.cardId === targetCardId);
  const onOpponentBoard = opponentBoard.some(bc => bc.cardId === targetCardId);

  if (!onHostBoard && !onOpponentBoard) {
    return { success: false, message: "Target not found on field" };
  }

  // Determine which board and graveyard
  const targetIsHost = onHostBoard;
  const targetOwnerId = targetIsHost ? gameState.hostId : gameState.opponentId;
  const board = targetIsHost ? hostBoard : opponentBoard;
  const graveyard = targetIsHost ? gameState.hostGraveyard : gameState.opponentGraveyard;

  // Check for "Cannot be destroyed by effects" protection
  const boardCard = board.find(bc => bc.cardId === targetCardId);
  if (boardCard?.cannotBeDestroyedByEffects) {
    const card = await ctx.db.get(targetCardId);
    return {
      success: false,
      message: `${card?.name || "Card"} cannot be destroyed by card effects`
    };
  }

  // Get card details for trigger check
  const card = await ctx.db.get(targetCardId);

  // Note: on_destroy trigger handling has been temporarily disabled to avoid circular dependency
  // This should be handled by the caller (executor.ts) when destroy is called
  // TODO: Refactor to pass executeEffect as a parameter or use event system

  // Remove from board
  const newBoard = board.filter(bc => bc.cardId !== targetCardId);

  // Add to graveyard
  const newGraveyard = [...graveyard, targetCardId];

  await ctx.db.patch(gameState._id, {
    [targetIsHost ? "hostBoard" : "opponentBoard"]: newBoard,
    [targetIsHost ? "hostGraveyard" : "opponentGraveyard"]: newGraveyard,
  });

  // Record event
  const lobby = await ctx.db.get(lobbyId);
  const user = await ctx.db.get(playerId);

  await recordEventHelper(ctx, {
    lobbyId,
    gameId: lobby?.gameId || "",
    turnNumber: lobby?.turnNumber || 0,
    eventType: "card_to_graveyard",
    playerId,
    playerUsername: user?.username || "Unknown",
    description: `${card?.name || "Card"} was destroyed by card effect`,
    metadata: { cardId: targetCardId, reason: "effect_destroy" },
  });

  return { success: true, message: `Destroyed ${card?.name || "target"}` };
}
