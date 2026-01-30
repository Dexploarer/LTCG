/**
 * LTCG Actions Index
 *
 * Exports all core game actions that enable AI agents to play the card game.
 */

import { summonAction } from './summonAction';
import { setCardAction } from './setCardAction';
import { activateSpellAction } from './activateSpellAction';
import { endTurnAction } from './endTurnAction';
import { attackAction } from './attackAction';
import { changePositionAction } from './changePositionAction';
import { activateTrapAction } from './activateTrapAction';
import { chainResponseAction } from './chainResponseAction';
import { flipSummonAction } from './flipSummonAction';
import { findGameAction } from './findGameAction';
import { createLobbyAction } from './createLobbyAction';
import { joinLobbyAction } from './joinLobbyAction';
import { storyModeAction } from './storyModeAction';
import { surrenderAction } from './surrenderAction';
import { registerAgentAction } from './registerAgentAction';
import { getWalletInfoAction } from './getWalletInfoAction';
import { trashTalkAction } from './trashTalkAction';
import { reactToPlayAction } from './reactToPlayAction';
import { ggAction } from './ggAction';
import { sendChatMessageAction } from './sendChatMessageAction';

/**
 * All LTCG game actions
 *
 * These actions allow the agent to:
 *
 * Game Management:
 * - Register new agent accounts
 * - Find and join games automatically
 * - Create lobbies (public or private)
 * - Join specific lobbies by ID or code
 * - Play story mode (instant AI battles)
 * - Surrender games
 *
 * Gameplay:
 * - Summon monsters (with tribute support)
 * - Set cards face-down
 * - Activate spells and traps
 * - Declare attacks
 * - Change monster positions
 * - Flip summon face-down monsters
 * - Chain responses to opponent actions
 * - End turn
 *
 * Personality & Chat:
 * - Trash talk based on game state
 * - React to opponent's plays
 * - Send good game messages
 * - Send messages to global chat (Tavern Hall)
 */
export const ltcgActions = [
  // Game Management Actions
  registerAgentAction,
  getWalletInfoAction,
  findGameAction,
  createLobbyAction,
  joinLobbyAction,
  storyModeAction,
  surrenderAction,

  // Gameplay Actions
  summonAction,
  setCardAction,
  activateSpellAction,
  activateTrapAction,
  endTurnAction,
  attackAction,
  changePositionAction,
  flipSummonAction,
  chainResponseAction,

  // Personality & Chat Actions
  trashTalkAction,
  reactToPlayAction,
  ggAction,
  sendChatMessageAction,
];

// Export individual actions for convenience
export {
  // Game Management
  registerAgentAction,
  getWalletInfoAction,
  findGameAction,
  createLobbyAction,
  joinLobbyAction,
  storyModeAction,
  surrenderAction,

  // Gameplay
  summonAction,
  setCardAction,
  activateSpellAction,
  activateTrapAction,
  endTurnAction,
  attackAction,
  changePositionAction,
  flipSummonAction,
  chainResponseAction,

  // Personality & Chat
  trashTalkAction,
  reactToPlayAction,
  ggAction,
  sendChatMessageAction,
};
