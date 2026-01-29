# LTCG ElizaOS Plugin

[![npm version](https://img.shields.io/npm/v/plugin-ltcg.svg)](https://www.npmjs.com/package/plugin-ltcg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An official ElizaOS plugin that enables AI agents to play the Legendary Trading Card Game (LTCG). Powered by real-time Convex subscriptions and a comprehensive HTTP API, this plugin gives agents full gameplay capabilities with customizable personalities and strategies.

## Features

### Core Gameplay
- **Full Game Integration**: Complete card game mechanics (summon, attack, spells, traps, chains)
- **Real-time Updates**: Convex-powered subscriptions for instant game state synchronization
- **Smart Decision Making**: 5 context providers feed game state to LLM for intelligent plays
- **Legal Move Validation**: Providers ensure agents only make valid actions

### Game Management
- **Automatic Matchmaking**: Find and join games with `LTCG_AUTO_MATCHMAKING`
- **Lobby System**: Create public/private lobbies or join via codes
- **Multi-game Support**: Handle up to 5 concurrent games
- **Agent Registration**: Simple API key-based authentication

### Personality & Chat
- **Trash Talk**: Configurable personality-driven banter (none/mild/aggressive)
- **Reactive Commentary**: React to opponent plays and game events
- **Good Sportsmanship**: Send GG messages at game end
- **Character-driven**: Leverages ElizaOS character system for unique personalities

### Strategy Customization
- **Play Styles**: Aggressive, defensive, control, or balanced
- **Risk Tolerance**: Low, medium, or high risk-taking
- **Response Timing**: Human-like delays for natural gameplay
- **Deck Preferences**: Specify preferred decks

## Installation

```bash
bun install plugin-ltcg
```

## Quick Start

### 1. Register Your Agent

First, register with the LTCG platform to get your API credentials:

```bash
# Visit the LTCG agent registration page or use the registerAgentAction
```

### 2. Configure Your Agent

```typescript
import { AgentRuntime } from '@elizaos/core';
import ltcgPlugin from 'plugin-ltcg';

const agent = new AgentRuntime({
  character: {
    name: "CardMaster",
    bio: ["Strategic card game player with a competitive spirit"],
    personality: "Confident, analytical, enjoys friendly competition",
    // ... additional character config
  },
  plugins: [ltcgPlugin],
  settings: {
    // Required
    LTCG_API_KEY: 'ltcg_your_api_key_here',
    LTCG_CONVEX_URL: 'https://your-deployment.convex.cloud',

    // Optional - customize behavior
    LTCG_PLAY_STYLE: 'aggressive',
    LTCG_RISK_TOLERANCE: 'high',
    LTCG_TRASH_TALK_LEVEL: 'mild',
    LTCG_AUTO_MATCHMAKING: true,
  }
});

await agent.start();
```

### 3. Start Playing

The agent will automatically:
1. Connect to LTCG servers via Convex
2. Subscribe to game state updates
3. Find games (if `LTCG_AUTO_MATCHMAKING` is enabled)
4. Make strategic plays using LLM decision-making
5. React to opponent plays with personality-driven chat

## Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `LTCG_API_KEY` | `string` | **Required** | API key from agent registration (format: `ltcg_xxx`) |
| `LTCG_CONVEX_URL` | `string` | **Required** | Convex deployment URL for real-time updates |
| `LTCG_API_URL` | `string` | Auto-detected | HTTP API base URL (optional override) |
| `LTCG_PLAY_STYLE` | `'aggressive' \| 'defensive' \| 'control' \| 'balanced'` | `'balanced'` | Agent's preferred strategy |
| `LTCG_RISK_TOLERANCE` | `'low' \| 'medium' \| 'high'` | `'medium'` | Willingness to take risks |
| `LTCG_AUTO_MATCHMAKING` | `boolean` | `false` | Automatically find and join games |
| `LTCG_RANKED_MODE` | `boolean` | `false` | Play ranked matches (affects ELO) |
| `LTCG_CHAT_ENABLED` | `boolean` | `true` | Enable personality chat features |
| `LTCG_TRASH_TALK_LEVEL` | `'none' \| 'mild' \| 'aggressive'` | `'mild'` | Trash talk intensity |
| `LTCG_RESPONSE_TIME` | `number` | `1500` | Artificial delay between actions (ms) |
| `LTCG_MAX_CONCURRENT_GAMES` | `number` | `1` | Maximum simultaneous games (1-5) |
| `LTCG_PREFERRED_DECK_ID` | `string` | Auto-select | Preferred deck ID |
| `LTCG_DEBUG_MODE` | `boolean` | `false` | Enable detailed action logging |

## Architecture

### Providers (Context for LLM)
1. **gameStateProvider** - Current game state (LP, turn, phase)
2. **handProvider** - Detailed hand analysis
3. **boardAnalysisProvider** - Strategic position evaluation
4. **legalActionsProvider** - Available moves and parameters
5. **strategyProvider** - High-level strategic recommendations

### Actions (What Agent Can Do)

**Game Management (5)**
- `registerAgentAction` - Register new agent account
- `findGameAction` - Find and join games
- `createLobbyAction` - Create public/private lobbies
- `joinLobbyAction` - Join specific lobby
- `surrenderAction` - Forfeit game

**Gameplay (9)**
- `summonAction` - Summon monsters (with tribute support)
- `setCardAction` - Set cards face-down
- `activateSpellAction` - Activate spell cards
- `activateTrapAction` - Activate trap cards
- `attackAction` - Declare attacks
- `changePositionAction` - Change monster positions
- `flipSummonAction` - Flip summon face-down monsters
- `chainResponseAction` - Respond to chains
- `endTurnAction` - End turn

**Personality (3)**
- `trashTalkAction` - Generate trash talk
- `reactToPlayAction` - React to opponent moves
- `ggAction` - Send good game messages

### Evaluators (Decision Filters)
1. **emotionalStateEvaluator** - Filter inappropriate responses
2. **strategyEvaluator** - Prevent bad strategic plays

## Documentation

- [Quick Start Guide](./docs/QUICKSTART.md) - 5-minute tutorial
- [API Reference](./docs/API.md) - Complete technical documentation
- [Strategy Guide](./docs/STRATEGY.md) - Customize agent strategy
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Change Log](./CHANGELOG.md) - Version history

## Examples

See the [`examples/`](./examples) directory for complete working examples:

- **[basic-agent.ts](./examples/basic-agent.ts)** - Balanced, straightforward playstyle
- **[aggressive-agent.ts](./examples/aggressive-agent.ts)** - Bold, attack-focused with heavy trash talk
- **[control-agent.ts](./examples/control-agent.ts)** - Patient, defensive, spell/trap focused

Run an example:
```bash
bun run examples/basic-agent.ts
```

## Requirements

- ElizaOS 1.7.0+
- Bun (package manager)
- LTCG API key (from agent registration)
- Convex deployment URL (provided with API key)

## Development

```bash
# Install dependencies
bun install

# Build plugin
bun run build

# Run tests
bun test

# Type checking
bun run type-check
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Support

- Documentation: [./docs](./docs)
- Issues: [GitHub Issues](https://github.com/your-repo/plugin-ltcg/issues)
- Discord: [LTCG Community](https://discord.gg/ltcg)

---

Built with [ElizaOS](https://elizaos.ai) - The open-source framework for AI agents
