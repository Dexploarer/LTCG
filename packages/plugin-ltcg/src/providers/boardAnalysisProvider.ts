/**
 * Board Analysis Provider
 *
 * Provides strategic analysis of board position:
 * - Board advantage (who has more/stronger monsters)
 * - Threat assessment (opponent's backrow, strong monsters)
 * - Attack opportunities (safe attacks vs risky)
 * - Defensive concerns
 */

import type { Provider, IAgentRuntime, Memory, State, ProviderResult } from '@elizaos/core';
import { LTCGApiClient } from '../client/LTCGApiClient';
import type { GameStateResponse, MonsterCard } from '../types/api';

export const boardAnalysisProvider: Provider = {
  name: 'LTCG_BOARD_ANALYSIS',
  description: 'Provides strategic analysis of the current board position',

  async get(runtime: IAgentRuntime, message: Memory, state: State): Promise<ProviderResult> {
    try {
      // Get game ID from state first, then message content
      const gameId = state.values?.LTCG_CURRENT_GAME_ID || (message.content as any)?.gameId;

      if (!gameId) {
        return {
          text: 'No active game. Use FIND_GAME or JOIN_LOBBY to start playing.',
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

      // Analyze board
      const analysis = analyzeBoardState(gameState);

      // Build human-readable text
      const text = formatBoardAnalysis(analysis, gameState);

      // Structured values for template substitution
      const values = {
        advantage: analysis.advantage,
        myMonsterCount: analysis.myMonsterCount,
        opponentMonsterCount: analysis.opponentMonsterCount,
        myStrongestAtk: analysis.myStrongestMonster?.atk || 0,
        opponentStrongestAtk: analysis.opponentStrongestMonster?.atk || 0,
        opponentBackrowCount: analysis.opponentBackrowCount,
        threatLevel: analysis.threatLevel,
      };

      // Structured data for programmatic access
      const data = {
        ...analysis,
        myMonsters: gameState.hostPlayer.monsterZone.length,
        opponentMonsters: gameState.opponentPlayer.monsterZone.length,
        myBackrow: gameState.hostPlayer.spellTrapZone.length,
        opponentBackrow: gameState.opponentPlayer.spellTrapZone.length,
      };

      return { text, values, data };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error analyzing board';

      return {
        text: `Error analyzing board: ${errorMessage}`,
        values: { error: 'FETCH_ERROR' },
        data: { errorDetails: error },
      };
    }
  },
};

/**
 * Board analysis result
 */
interface BoardAnalysis {
  advantage: 'STRONG_ADVANTAGE' | 'SLIGHT_ADVANTAGE' | 'EVEN' | 'SLIGHT_DISADVANTAGE' | 'STRONG_DISADVANTAGE';
  myMonsterCount: number;
  opponentMonsterCount: number;
  myStrongestMonster?: MonsterCard;
  opponentStrongestMonster?: MonsterCard;
  opponentBackrowCount: number;
  threats: string[];
  opportunities: string[];
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
}

/**
 * Analyze the board state
 */
function analyzeBoardState(gameState: GameStateResponse): BoardAnalysis {
  const myMonsters = gameState.hostPlayer.monsterZone;
  const opponentMonsters = gameState.opponentPlayer.monsterZone;
  const opponentBackrow = gameState.opponentPlayer.spellTrapZone;

  // Find strongest monsters
  const myStrongestMonster =
    myMonsters.length > 0
      ? myMonsters.reduce((strongest, monster) => (monster.atk > strongest.atk ? monster : strongest))
      : undefined;

  const opponentStrongestMonster =
    opponentMonsters.length > 0
      ? opponentMonsters.reduce((strongest, monster) => (monster.atk > strongest.atk ? monster : strongest))
      : undefined;

  // Calculate advantage
  const myTotalAtk = myMonsters.reduce((sum, m) => sum + m.atk, 0);
  const opponentTotalAtk = opponentMonsters.reduce((sum, m) => sum + m.atk, 0);

  const monsterAdvantage = myMonsters.length - opponentMonsters.length;
  const atkAdvantage = myTotalAtk - opponentTotalAtk;

  let advantage: BoardAnalysis['advantage'];
  if (monsterAdvantage >= 2 || atkAdvantage >= 2000) {
    advantage = 'STRONG_ADVANTAGE';
  } else if (monsterAdvantage >= 1 || atkAdvantage >= 500) {
    advantage = 'SLIGHT_ADVANTAGE';
  } else if (monsterAdvantage <= -2 || atkAdvantage <= -2000) {
    advantage = 'STRONG_DISADVANTAGE';
  } else if (monsterAdvantage <= -1 || atkAdvantage <= -500) {
    advantage = 'SLIGHT_DISADVANTAGE';
  } else {
    advantage = 'EVEN';
  }

  // Assess threats
  const threats: string[] = [];

  if (opponentStrongestMonster && myStrongestMonster && opponentStrongestMonster.atk > myStrongestMonster.atk) {
    threats.push(
      `Opponent's ${opponentStrongestMonster.name} (${opponentStrongestMonster.atk} ATK) is stronger than your strongest monster`
    );
  }

  if (opponentBackrow.length >= 3) {
    threats.push(`Opponent has ${opponentBackrow.length} set backrow - likely has traps`);
  } else if (opponentBackrow.length > 0) {
    threats.push(`Opponent has ${opponentBackrow.length} set card(s) in backrow`);
  }

  if (myMonsters.length === 0 && opponentMonsters.length > 0) {
    threats.push('No monsters on your field - vulnerable to direct attacks');
  }

  // Assess opportunities
  const opportunities: string[] = [];

  if (opponentMonsters.length === 0 && myMonsters.length > 0) {
    const totalDamage = myMonsters.reduce((sum, m) => sum + (m.canAttack ? m.atk : 0), 0);
    opportunities.push(`Direct attack possible for ${totalDamage} damage`);
  }

  myMonsters.forEach((myMonster) => {
    if (!myMonster.canAttack) return;

    const canDefeatOpponents = opponentMonsters.filter((opp) => myMonster.atk > opp.atk);

    if (canDefeatOpponents.length > 0) {
      opportunities.push(
        `${myMonster.name} can safely attack ${canDefeatOpponents.map((m) => m.name).join(', ')}`
      );
    }
  });

  // Determine threat level
  let threatLevel: BoardAnalysis['threatLevel'];
  if (advantage === 'STRONG_DISADVANTAGE' || (myMonsters.length === 0 && opponentMonsters.length >= 2)) {
    threatLevel = 'CRITICAL';
  } else if (advantage === 'SLIGHT_DISADVANTAGE' || threats.length >= 2) {
    threatLevel = 'HIGH';
  } else if (threats.length === 1) {
    threatLevel = 'MEDIUM';
  } else {
    threatLevel = 'LOW';
  }

  // Generate recommendation
  let recommendation: string;
  if (advantage === 'STRONG_ADVANTAGE') {
    recommendation = 'Press your advantage - attack aggressively';
  } else if (advantage === 'SLIGHT_ADVANTAGE') {
    recommendation = 'Maintain board control and look for openings';
  } else if (advantage === 'SLIGHT_DISADVANTAGE') {
    recommendation = 'Set up defense or use removal spells';
  } else if (advantage === 'STRONG_DISADVANTAGE') {
    recommendation = 'Defensive play required - survive and rebuild';
  } else {
    recommendation = 'Play cautiously - board is balanced';
  }

  return {
    advantage,
    myMonsterCount: myMonsters.length,
    opponentMonsterCount: opponentMonsters.length,
    myStrongestMonster,
    opponentStrongestMonster,
    opponentBackrowCount: opponentBackrow.length,
    threats,
    opportunities,
    threatLevel,
    recommendation,
  };
}

/**
 * Format board analysis as human-readable text
 */
function formatBoardAnalysis(analysis: BoardAnalysis, gameState: GameStateResponse): string {
  let text = `Board Analysis:\n`;
  text += `- Advantage: ${analysis.advantage.replace(/_/g, ' ')}\n`;

  if (analysis.myStrongestMonster) {
    text += `- Your Strongest: ${analysis.myStrongestMonster.name} (${analysis.myStrongestMonster.atk} ATK)\n`;
  } else {
    text += `- Your Strongest: None (no monsters on field)\n`;
  }

  if (analysis.opponentStrongestMonster) {
    const isThreat = analysis.myStrongestMonster
      ? analysis.opponentStrongestMonster.atk > analysis.myStrongestMonster.atk
      : true;
    text += `- Opponent Strongest: ${analysis.opponentStrongestMonster.name} (${analysis.opponentStrongestMonster.atk} ATK)${isThreat ? ' - THREAT!' : ''}\n`;
  } else {
    text += `- Opponent Strongest: None (no monsters on field)\n`;
  }

  if (analysis.threats.length > 0) {
    text += `- Threats:\n`;
    analysis.threats.forEach((threat) => {
      text += `  * ${threat}\n`;
    });
  }

  if (analysis.opportunities.length > 0) {
    text += `- Attack Opportunities:\n`;
    analysis.opportunities.forEach((opp) => {
      text += `  * ${opp}\n`;
    });
  } else {
    text += `- Attack Opportunities: None safe\n`;
  }

  text += `- Recommendation: ${analysis.recommendation}`;

  return text;
}
