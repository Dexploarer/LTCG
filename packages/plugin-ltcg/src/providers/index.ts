/**
 * LTCG ElizaOS Providers
 *
 * Exports all providers that supply game context data to the LLM.
 */

import { gameStateProvider } from './gameStateProvider';
import { handProvider } from './handProvider';
import { boardAnalysisProvider } from './boardAnalysisProvider';
import { legalActionsProvider } from './legalActionsProvider';
import { strategyProvider } from './strategyProvider';

/**
 * All LTCG providers for ElizaOS agent
 *
 * These providers give the LLM comprehensive game awareness:
 * 1. gameStateProvider - Current game state (LP, turn, phase, board summary)
 * 2. handProvider - Detailed hand analysis (cards, tributes, abilities)
 * 3. boardAnalysisProvider - Strategic board position analysis
 * 4. legalActionsProvider - Available actions and their parameters
 * 5. strategyProvider - High-level strategic recommendations
 */
export const ltcgProviders = [
  gameStateProvider,
  handProvider,
  boardAnalysisProvider,
  legalActionsProvider,
  strategyProvider,
];

// Export individual providers for selective use
export { gameStateProvider } from './gameStateProvider';
export { handProvider } from './handProvider';
export { boardAnalysisProvider } from './boardAnalysisProvider';
export { legalActionsProvider } from './legalActionsProvider';
export { strategyProvider } from './strategyProvider';
