import { describe, expect, it, beforeEach, mock } from 'bun:test';
import { surrenderAction } from './surrenderAction';
import type { IAgentRuntime, Memory, State } from '@elizaos/core';
import { LTCGApiClient } from '../client/LTCGApiClient';
import { gameStateProvider } from '../providers/gameStateProvider';

describe('Surrender Action', () => {
  let mockRuntime: IAgentRuntime;
  let mockMessage: Memory;
  let mockState: State;
  let mockCallback: ReturnType<typeof mock>;

  beforeEach(() => {
    mockRuntime = {
      getSetting: mock((key: string) => {
        if (key === 'LTCG_API_KEY') return 'test-api-key';
        if (key === 'LTCG_API_URL') return 'http://localhost:3000';
        if (key === 'LTCG_AUTO_SURRENDER') return 'true';
        return null;
      }),
      get: mock(async (key: string) => {
        if (key === 'LTCG_CURRENT_GAME_ID') return 'active-game-123';
        return null;
      }),
      delete: mock(async () => {}),
      useModel: mock(async () => {
        return JSON.stringify({ confirm: true });
      }),
    } as any;

    mockMessage = {
      id: 'test-message-id',
      entityId: 'test-entity',
      roomId: 'test-room',
      content: {
        text: 'I surrender',
        source: 'test',
      },
    } as Memory;

    mockState = {
      values: {},
      data: {},
      text: '',
    };

    mockCallback = mock();
  });

  describe('Action Structure', () => {
    it('should have correct name', () => {
      expect(surrenderAction.name).toBe('SURRENDER');
    });

    it('should have similes', () => {
      expect(surrenderAction.similes).toContain('FORFEIT');
      expect(surrenderAction.similes).toContain('CONCEDE');
      expect(surrenderAction.similes).toContain('GIVE_UP');
    });

    it('should have description', () => {
      expect(surrenderAction.description).toBeDefined();
      expect(surrenderAction.description.length).toBeGreaterThan(0);
    });

    it('should have examples', () => {
      expect(surrenderAction.examples).toBeDefined();
      expect(surrenderAction.examples.length).toBeGreaterThan(0);
    });
  });

  describe('Validation', () => {
    it('should validate when in active game', async () => {
      const originalGameStateGet = gameStateProvider.get;

      gameStateProvider.get = async () => ({
        text: '',
        values: {},
        data: {
          gameState: {
            gameId: 'active-game-123',
            status: 'active',
          },
        },
      });

      const result = await surrenderAction.validate(mockRuntime, mockMessage, mockState);

      gameStateProvider.get = originalGameStateGet;

      expect(result).toBe(true);
    });

    it('should not validate when not in game', async () => {
      mockRuntime.get = mock(async (key: string) => {
        if (key === 'LTCG_CURRENT_GAME_ID') return null;
        return null;
      }) as any;

      const result = await surrenderAction.validate(mockRuntime, mockMessage, mockState);
      expect(result).toBe(false);
    });

    it('should not validate when game already completed', async () => {
      const originalGameStateGet = gameStateProvider.get;

      gameStateProvider.get = async () => ({
        text: '',
        values: {},
        data: {
          gameState: {
            gameId: 'active-game-123',
            status: 'completed',
          },
        },
      });

      const result = await surrenderAction.validate(mockRuntime, mockMessage, mockState);

      gameStateProvider.get = originalGameStateGet;

      expect(result).toBe(false);
    });

    it('should validate even if game state unavailable (cleanup)', async () => {
      const originalGameStateGet = gameStateProvider.get;

      gameStateProvider.get = async () => {
        throw new Error('Cannot get game state');
      };

      const result = await surrenderAction.validate(mockRuntime, mockMessage, mockState);

      gameStateProvider.get = originalGameStateGet;

      expect(result).toBe(true);
    });
  });

  describe('Handler - Auto Surrender', () => {
    it('should surrender immediately when auto-surrender enabled', async () => {
      const originalSurrender = LTCGApiClient.prototype.surrender;

      LTCGApiClient.prototype.surrender = mock(async () => ({
        success: true,
        message: 'Game ended by surrender',
      })) as any;

      const result = await surrenderAction.handler(
        mockRuntime,
        mockMessage,
        mockState,
        {},
        mockCallback
      );

      LTCGApiClient.prototype.surrender = originalSurrender;

      expect(result.success).toBe(true);
      expect(mockCallback).toHaveBeenCalled();
      expect(mockRuntime.delete).toHaveBeenCalledWith('LTCG_CURRENT_GAME_ID');
      expect(mockRuntime.delete).toHaveBeenCalledWith('LTCG_CURRENT_LOBBY_ID');
    });
  });

  describe('Handler - Confirmation Flow', () => {
    it('should ask for confirmation when auto-surrender disabled', async () => {
      mockRuntime.getSetting = mock((key: string) => {
        if (key === 'LTCG_API_KEY') return 'test-api-key';
        if (key === 'LTCG_API_URL') return 'http://localhost:3000';
        if (key === 'LTCG_AUTO_SURRENDER') return 'false';
        return null;
      }) as any;

      const originalGameStateGet = gameStateProvider.get;
      const originalSurrender = LTCGApiClient.prototype.surrender;

      gameStateProvider.get = async () => ({
        text: '',
        values: {},
        data: {
          gameState: {
            gameId: 'active-game-123',
            status: 'active',
            hostPlayer: { lifePoints: 2000, monsterZone: [] },
            opponentPlayer: { lifePoints: 8000, monsterZone: [{}] },
            turnNumber: 10,
          },
        },
      });

      LTCGApiClient.prototype.surrender = mock(async () => ({
        success: true,
        message: 'Game ended by surrender',
      })) as any;

      const result = await surrenderAction.handler(
        mockRuntime,
        mockMessage,
        mockState,
        {},
        mockCallback
      );

      gameStateProvider.get = originalGameStateGet;
      LTCGApiClient.prototype.surrender = originalSurrender;

      expect(mockRuntime.useModel).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should cancel surrender when confirmation declined', async () => {
      mockRuntime.getSetting = mock((key: string) => {
        if (key === 'LTCG_API_KEY') return 'test-api-key';
        if (key === 'LTCG_API_URL') return 'http://localhost:3000';
        if (key === 'LTCG_AUTO_SURRENDER') return 'false';
        return null;
      }) as any;

      mockRuntime.useModel = mock(async () => {
        return JSON.stringify({ confirm: false });
      }) as any;

      const originalGameStateGet = gameStateProvider.get;

      gameStateProvider.get = async () => ({
        text: '',
        values: {},
        data: {
          gameState: {
            gameId: 'active-game-123',
            status: 'active',
            hostPlayer: { lifePoints: 2000, monsterZone: [] },
            opponentPlayer: { lifePoints: 8000, monsterZone: [{}] },
            turnNumber: 10,
          },
        },
      });

      const result = await surrenderAction.handler(
        mockRuntime,
        mockMessage,
        mockState,
        {},
        mockCallback
      );

      gameStateProvider.get = originalGameStateGet;

      expect(result.success).toBe(false);
      expect(result.text).toContain('cancelled');
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Handler - Error Handling', () => {
    it('should clean up state even when API fails', async () => {
      const originalSurrender = LTCGApiClient.prototype.surrender;

      LTCGApiClient.prototype.surrender = mock(async () => {
        throw new Error('API Error');
      }) as any;

      const result = await surrenderAction.handler(
        mockRuntime,
        mockMessage,
        mockState,
        {},
        mockCallback
      );

      LTCGApiClient.prototype.surrender = originalSurrender;

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // State cleanup should still be attempted
      expect(mockRuntime.delete).toHaveBeenCalled();
    });

    it('should handle missing game ID gracefully', async () => {
      mockRuntime.get = mock(async (key: string) => {
        if (key === 'LTCG_CURRENT_GAME_ID') return null;
        return null;
      }) as any;

      const result = await surrenderAction.handler(
        mockRuntime,
        mockMessage,
        mockState,
        {},
        mockCallback
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
