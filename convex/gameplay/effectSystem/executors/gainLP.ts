import type { MutationCtx } from "../../../_generated/server";
import type { Id, Doc } from "../../../_generated/dataModel";
import { recordEventHelper } from "../../gameEvents";

export async function executeGainLP(
  ctx: MutationCtx,
  gameState: Doc<"gameStates">,
  lobbyId: Id<"gameLobbies">,
  targetPlayerId: Id<"users">,
  amount: number
): Promise<{ success: boolean; message: string }> {

  const isHost = targetPlayerId === gameState.hostId;
  const currentLP = isHost ? gameState.hostLifePoints : gameState.opponentLifePoints;
  const newLP = currentLP + amount;

  await ctx.db.patch(gameState._id, {
    [isHost ? "hostLifePoints" : "opponentLifePoints"]: newLP,
  });

  // Record LP change event
  const lobby = await ctx.db.get(lobbyId);
  const user = await ctx.db.get(targetPlayerId);

  await recordEventHelper(ctx, {
    lobbyId,
    gameId: lobby?.gameId || "",
    turnNumber: lobby?.turnNumber || 0,
    eventType: "lp_changed",
    playerId: targetPlayerId,
    playerUsername: user?.username || "Unknown",
    description: `${user?.username} gains ${amount} LP (${currentLP} -> ${newLP} LP)`,
    metadata: { previousLP: currentLP, newLP, change: amount },
  });

  return { success: true, message: `Gained ${amount} LP` };
}
