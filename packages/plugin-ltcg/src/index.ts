/**
 * LTCG ElizaOS Plugin
 *
 * Main entry point for the LTCG card game plugin.
 * This plugin enables AI agents to play the Legendary Trading Card Game
 * with full gameplay capabilities, real-time updates, and customizable personalities.
 */

// Main plugin export
export { default } from './plugin.js';
export { default as ltcgPlugin } from './plugin.js';

// Actions - Core gameplay commands
export { ltcgActions } from './actions';
export {
  // Game Management
  registerAgentAction,
  findGameAction,
  createLobbyAction,
  joinLobbyAction,
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
} from './actions';

// Providers - Context data for LLM
export { ltcgProviders } from './providers';
export {
  gameStateProvider,
  handProvider,
  boardAnalysisProvider,
  legalActionsProvider,
  strategyProvider,
} from './providers';

// Evaluators - Response filtering
export { ltcgEvaluators } from './evaluators';
export { emotionalStateEvaluator, strategyEvaluator } from './evaluators';

// Services - Background services and lifecycle management
export { LTCGRealtimeService } from './services/LTCGRealtimeService';

// Clients - API and real-time connections
export { LTCGApiClient } from './client/LTCGApiClient';
export { ConvexRealtimeClient } from './client/realtimeClient';
export * from './client/events';
export * from './client/errors';

// Types - TypeScript definitions
export * from './types/api';
export * from './types/game';
export * from './types/plugin';

// Configuration
export * from './config';
export * from './constants';
