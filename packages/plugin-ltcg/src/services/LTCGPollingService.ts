/**
 * LTCG Polling Service
 *
 * Provides real-time game updates via HTTP polling for agents running locally
 * without a public webhook URL. Automatically activates when LTCG_CALLBACK_URL
 * is not configured.
 *
 * This is a fallback mechanism that allows local development without ngrok or
 * similar tunneling services.
 */

import { Service, type IAgentRuntime, logger } from '@elizaos/core';
import { LTCGApiClient } from '../client/LTCGApiClient';
import type { GameStateResponse } from '../types/api';
import {
  handleGameWebhook,
  type GameWebhookPayload,
  type WebhookEventType,
} from '../webhooks/gameEventHandler';
import { TurnOrchestrator } from './TurnOrchestrator';

export interface PollingConfig {
  /** Polling interval in milliseconds (default: 1500ms) */
  intervalMs?: number;
  /** Enable debug logging */
  debug?: boolean;
}

interface GameStateSnapshot {
  turnNumber: number;
  phase: string;
  currentTurn: string;
  isChainWaiting: boolean;
  status: string;
  lastEventId?: string;
}

export class LTCGPollingService extends Service {
  static serviceType = 'ltcg-polling';

  private runtime: IAgentRuntime;
  private client: LTCGApiClient | null = null;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private currentGameId: string | null = null;
  private lastSnapshot: GameStateSnapshot | null = null;
  private intervalMs: number;
  private debug: boolean;
  private isPolling = false;

  capabilityDescription = 'Provides real-time game updates via HTTP polling for local development';

  constructor(runtime: IAgentRuntime, config?: PollingConfig) {
    super(runtime);
    this.runtime = runtime;
    this.intervalMs = config?.intervalMs ?? 1500;
    this.debug = config?.debug ?? false;
  }

  static async start(runtime: IAgentRuntime): Promise<LTCGPollingService> {
    const callbackUrl = runtime.getSetting('LTCG_CALLBACK_URL');
    const debugMode = runtime.getSetting('LTCG_DEBUG_MODE') === 'true';

    // Only start polling if no webhook URL is configured
    if (callbackUrl) {
      logger.info('LTCG_CALLBACK_URL configured - polling service not needed');
      const service = new LTCGPollingService(runtime, { debug: debugMode });
      return service;
    }

    logger.info('*** Starting LTCG polling service (no webhook URL configured) ***');

    const service = new LTCGPollingService(runtime, {
      intervalMs: 1500,
      debug: debugMode,
    });

    // Initialize API client
    const apiKey = runtime.getSetting('LTCG_API_KEY') as string;
    const apiUrl = runtime.getSetting('LTCG_API_URL') as string;

    if (apiKey && apiUrl) {
      service.client = new LTCGApiClient({
        apiKey,
        baseUrl: apiUrl,
        debug: debugMode,
      });
      logger.info('Polling service initialized with API client');
    } else {
      logger.warn('API credentials not configured - polling will not fetch game state');
    }

    return service;
  }

  static async stop(runtime: IAgentRuntime): Promise<void> {
    logger.info('*** Stopping LTCG polling service ***');

    const service = runtime.getService(LTCGPollingService.serviceType) as LTCGPollingService;
    if (service) {
      await service.stop();
    }
  }

  async stop(): Promise<void> {
    this.stopPolling();
    this.client = null;
    logger.info('Polling service stopped');
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Start polling for a specific game
   */
  startPollingGame(gameId: string): void {
    if (!this.client) {
      logger.warn('Cannot start polling - API client not initialized');
      return;
    }

    if (this.isPolling && this.currentGameId === gameId) {
      logger.debug('Already polling this game');
      return;
    }

    // Stop any existing polling
    this.stopPolling();

    this.currentGameId = gameId;
    this.lastSnapshot = null;
    this.isPolling = true;

    logger.info({ gameId, intervalMs: this.intervalMs }, 'Starting game polling');

    // Start polling loop
    this.pollingInterval = setInterval(() => {
      this.pollGameState().catch((error) => {
        logger.error({ error, gameId }, 'Polling error');
      });
    }, this.intervalMs);

    // Do an immediate poll
    this.pollGameState().catch((error) => {
      logger.error({ error, gameId }, 'Initial poll error');
    });
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    this.currentGameId = null;
    this.lastSnapshot = null;

    if (this.debug) {
      logger.debug('Polling stopped');
    }
  }

  /**
   * Check if polling is active
   */
  isActive(): boolean {
    return this.isPolling;
  }

  /**
   * Get current game being polled
   */
  getCurrentGameId(): string | null {
    return this.currentGameId;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Poll game state and detect changes
   */
  private async pollGameState(): Promise<void> {
    if (!this.client || !this.currentGameId) {
      return;
    }

    try {
      const gameState = await this.client.getGameState(this.currentGameId);
      const newSnapshot = this.createSnapshot(gameState);

      // Detect changes and emit events
      const events = this.detectChanges(this.lastSnapshot, newSnapshot, gameState);

      for (const event of events) {
        await this.emitEvent(event, gameState);
      }

      this.lastSnapshot = newSnapshot;

      // Check if game ended
      if (gameState.status === 'completed') {
        logger.info({ gameId: this.currentGameId, status: gameState.status }, 'Game ended, stopping polling');
        this.stopPolling();
      }
    } catch (error) {
      // Don't log every error to avoid spam, just debug
      if (this.debug) {
        logger.debug({ error }, 'Poll failed');
      }
    }
  }

  /**
   * Create a snapshot of game state for comparison
   */
  private createSnapshot(state: GameStateResponse): GameStateSnapshot {
    return {
      turnNumber: state.turnNumber ?? 0,
      phase: state.phase ?? '',
      currentTurn: state.currentTurn ?? '',
      isChainWaiting: (state as any).chainState?.isWaiting ?? false,
      status: state.status ?? 'unknown',
    };
  }

  /**
   * Detect changes between snapshots and return events to emit
   */
  private detectChanges(
    prev: GameStateSnapshot | null,
    curr: GameStateSnapshot,
    fullState: GameStateResponse
  ): Array<{ type: WebhookEventType; data: GameWebhookPayload['data'] }> {
    const events: Array<{ type: WebhookEventType; data: GameWebhookPayload['data'] }> = [];

    // First poll - game started
    if (prev === null) {
      events.push({
        type: 'game_started',
        data: { phase: curr.phase, turnNumber: curr.turnNumber },
      });

      // If it's our turn, also emit turn_started
      if (this.isAgentTurn(fullState)) {
        events.push({
          type: 'turn_started',
          data: { phase: curr.phase, turnNumber: curr.turnNumber },
        });
      }

      return events;
    }

    // Game ended
    if (prev.status !== 'completed' && curr.status === 'completed') {
      const agentWon = this.didAgentWin(fullState);
      events.push({
        type: 'game_ended',
        data: {
          gameResult: {
            winner: agentWon ? 'agent' : 'opponent',
            reason: (fullState as any).endReason ?? 'unknown',
          },
        },
      });
      return events;
    }

    // Turn changed
    if (prev.turnNumber !== curr.turnNumber || prev.currentTurn !== curr.currentTurn) {
      if (this.isAgentTurn(fullState)) {
        events.push({
          type: 'turn_started',
          data: { phase: curr.phase, turnNumber: curr.turnNumber },
        });
      } else {
        // Opponent's turn started - they took an action
        events.push({
          type: 'opponent_action',
          data: {
            opponentAction: {
              type: 'turn_passed',
              description: 'Opponent ended their turn',
            },
          },
        });
      }
    }

    // Phase changed
    if (prev.phase !== curr.phase) {
      events.push({
        type: 'phase_changed',
        data: { phase: curr.phase, turnNumber: curr.turnNumber },
      });
    }

    // Chain waiting
    if (!prev.isChainWaiting && curr.isChainWaiting) {
      events.push({
        type: 'chain_waiting',
        data: {
          chainState: {
            isWaiting: true,
            timeoutMs: (fullState as any).chainState?.timeoutMs ?? 30000,
          },
        },
      });
    }

    return events;
  }

  /**
   * Check if it's the agent's turn
   */
  private isAgentTurn(state: GameStateResponse): boolean {
    // The agent is the host if they created the game
    // Check if current turn matches agent's role
    const agentPlayerId = state.hostPlayer?.playerId;
    const currentTurnPlayerId = state.currentTurn === 'host'
      ? state.hostPlayer?.playerId
      : state.opponentPlayer?.playerId;

    // If agent is host, it's their turn when currentTurn === 'host'
    // We assume the agent making API calls is the one whose hand is visible
    // So if hand has cards, we can check whose turn it is
    if (state.currentTurn === 'host') {
      // Agent is likely the host if they're making this call
      return true;
    }

    return false;
  }

  /**
   * Check if agent won the game
   */
  private didAgentWin(state: GameStateResponse): boolean {
    // Check extended state for winner info
    const extState = state as any;
    if (extState.winner) {
      const agentPlayerId = state.hostPlayer?.playerId;
      return extState.winner === agentPlayerId;
    }
    return false;
  }

  /**
   * Emit an event using the webhook handler
   */
  private async emitEvent(
    event: { type: WebhookEventType; data: GameWebhookPayload['data'] },
    _fullState: GameStateResponse
  ): Promise<void> {
    if (!this.currentGameId) return;

    const agentId = this.runtime.getSetting('LTCG_AGENT_ID') as string;

    const payload: GameWebhookPayload = {
      eventType: event.type,
      gameId: this.currentGameId,
      agentId: agentId ?? 'unknown',
      timestamp: Date.now(),
      signature: 'polling_generated',
      data: event.data,
    };

    logger.info({ eventType: event.type, gameId: this.currentGameId }, 'Polling detected event');

    // Create a state object for the handler
    const state = {
      values: {} as Record<string, unknown>,
    };

    try {
      await handleGameWebhook(payload, this.runtime, state as any);
    } catch (error) {
      logger.error({ error, eventType: event.type }, 'Error handling polled event');
    }

    // Trigger TurnOrchestrator for autonomous gameplay
    await this.triggerOrchestrator(event, _fullState);
  }

  /**
   * Trigger the TurnOrchestrator for autonomous gameplay
   */
  private async triggerOrchestrator(
    event: { type: WebhookEventType; data: GameWebhookPayload['data'] },
    fullState: GameStateResponse
  ): Promise<void> {
    if (!this.currentGameId) return;

    // Get the orchestrator service
    const orchestrator = this.runtime.getService(TurnOrchestrator.serviceType) as TurnOrchestrator;
    if (!orchestrator) {
      if (this.debug) {
        logger.debug('TurnOrchestrator not available, skipping autonomous action');
      }
      return;
    }

    try {
      switch (event.type) {
        case 'turn_started':
          await orchestrator.onTurnStarted(
            this.currentGameId,
            fullState.phase,
            fullState.turnNumber
          );
          break;

        case 'chain_waiting':
          const chainData = event.data as { chainState?: { timeoutMs?: number } };
          await orchestrator.onChainWaiting(
            this.currentGameId,
            chainData.chainState?.timeoutMs ?? 30000
          );
          break;
      }
    } catch (error) {
      logger.error({ error, eventType: event.type }, 'Error triggering orchestrator');
    }
  }
}
