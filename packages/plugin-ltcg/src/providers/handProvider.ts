/**
 * Hand Provider
 *
 * Provides detailed information about cards in agent's hand:
 * - Each card's name, type, level (for monsters)
 * - ATK/DEF values for monsters
 * - Tribute requirements (e.g., "Level 7 - requires 2 tributes")
 * - Special abilities summary
 */

import type { Provider, IAgentRuntime, Memory, State, ProviderResult } from '@elizaos/core';
import { LTCGApiClient } from '../client/LTCGApiClient';
import type { GameStateResponse, CardInHand } from '../types/api';
import { TRIBUTE_REQUIREMENTS } from '../constants';

export const handProvider: Provider = {
  name: 'LTCG_HAND',
  description: 'Provides detailed information about cards currently in your hand',

  async get(runtime: IAgentRuntime, message: Memory, state: State): Promise<ProviderResult> {
    try {
      // Get game ID from message content
      const gameId = (message.content as any)?.gameId;

      if (!gameId) {
        return {
          text: 'No game ID provided in message context.',
          values: { error: 'NO_GAME_ID' },
          data: {},
        };
      }

      // Get API credentials from runtime settings
      const apiKey = runtime.getSetting('LTCG_API_KEY');
      const apiUrl = runtime.getSetting('LTCG_API_URL');

      if (!apiKey || !apiUrl) {
        return {
          text: 'LTCG API credentials not configured. Please set LTCG_API_KEY and LTCG_API_URL.',
          values: { error: 'MISSING_CONFIG' },
          data: {},
        };
      }

      // Create API client
      const client = new LTCGApiClient({
        apiKey: apiKey as string,
        baseUrl: apiUrl as string,
      });

      // Fetch game state
      const gameState: GameStateResponse = await client.getGameState(gameId);

      // Format hand cards
      const hand = gameState.hand;

      if (hand.length === 0) {
        return {
          text: 'Your hand is empty.',
          values: { handSize: 0 },
          data: { hand: [] },
        };
      }

      // Build human-readable text
      let text = `Your Hand (${hand.length} cards):\n`;

      hand.forEach((card, index) => {
        text += `${index + 1}. ${formatCard(card)}\n`;
      });

      // Structured values for template substitution
      const values = {
        handSize: hand.length,
        hasMonsters: hand.some((c) => c.type === 'monster'),
        hasSpells: hand.some((c) => c.type === 'spell'),
        hasTraps: hand.some((c) => c.type === 'trap'),
        monsterCount: hand.filter((c) => c.type === 'monster').length,
        spellCount: hand.filter((c) => c.type === 'spell').length,
        trapCount: hand.filter((c) => c.type === 'trap').length,
      };

      // Structured data for programmatic access
      const data = {
        hand,
        cardsByType: {
          monsters: hand.filter((c) => c.type === 'monster'),
          spells: hand.filter((c) => c.type === 'spell'),
          traps: hand.filter((c) => c.type === 'trap'),
        },
      };

      return { text, values, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching hand';

      return {
        text: `Error fetching hand: ${errorMessage}`,
        values: { error: 'FETCH_ERROR' },
        data: { errorDetails: error },
      };
    }
  },
};

/**
 * Format a card for display
 */
function formatCard(card: CardInHand): string {
  if (card.type === 'monster') {
    const tributeText = getTributeRequirementText(card.level || 0);
    const abilityText =
      card.abilities && card.abilities.length > 0
        ? `   - Abilities: ${card.abilities.map((a: any) => a.name || a.description).join(', ')}`
        : '   - No special effects';

    return `${card.name} [Monster, Level ${card.level}] ATK: ${card.atk}, DEF: ${card.def}
   - ${tributeText}
${abilityText}`;
  } else if (card.type === 'spell') {
    const effectText = card.description
      ? `   - Effect: ${card.description}`
      : card.abilities && card.abilities.length > 0
        ? `   - Effect: ${card.abilities.map((a: any) => a.description || a.name).join(', ')}`
        : '';

    return `${card.name} [Spell]
${effectText}`;
  } else {
    // Trap
    const effectText = card.description
      ? `   - Effect: ${card.description}`
      : card.abilities && card.abilities.length > 0
        ? `   - Effect: ${card.abilities.map((a: any) => a.description || a.name).join(', ')}`
        : '';

    return `${card.name} [Trap]
${effectText}`;
  }
}

/**
 * Get tribute requirement text based on level
 */
function getTributeRequirementText(level: number): string {
  if (level <= 4) {
    return 'No tributes required';
  } else if (level <= 6) {
    return 'Requires 1 tribute to summon';
  } else {
    return 'Requires 2 tributes to summon';
  }
}
