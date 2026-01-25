import type { MutationCtx } from "../../_generated/server";
import type { Id, Doc } from "../../_generated/dataModel";
import { api } from "../../_generated/api";

export async function executeDamage(
  ctx: MutationCtx,
  gameState: Doc<"gameStates">,
  lobbyId: Id<"gameLobbies">,
  targetPlayerId: Id<"users">,
  damage: number
): Promise<{ success: boolean; message: string }> {

  const isHost = targetPlayerId === gameState.hostId;
  const currentLP = isHost ? gameState.hostLifePoints : gameState.opponentLifePoints;
  const newLP = Math.max(0, currentLP - damage);

  await ctx.db.patch(gameState._id, {
    [isHost ? "hostLifePoints" : "opponentLifePoints"]: newLP,
  });

  // Record LP change event
  const lobby = await ctx.db.get(lobbyId);
  const user = await ctx.db.get(targetPlayerId);

  await ctx.runMutation(api.gameEvents.recordEvent, {
    lobbyId,
    gameId: lobby?.gameId || "",
    turnNumber: lobby?.turnNumber || 0,
    eventType: "lp_changed",
    playerId: targetPlayerId,
    playerUsername: user?.username || "Unknown",
    description: `${user?.username} takes ${damage} damage (${currentLP} -> ${newLP} LP)`,
    metadata: { previousLP: currentLP, newLP, change: -damage },
  });

  // Check for game end
  if (newLP <= 0) {
    return { success: true, message: `Dealt ${damage} damage - GAME OVER` };
  }

  return { success: true, message: `Dealt ${damage} damage` };
}
