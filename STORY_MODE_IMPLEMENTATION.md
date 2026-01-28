# Story Mode Implementation Guide

## Overview
Story mode is a single-player campaign where players battle against AI opponents across 10 chapters, each with multiple difficulty tiers. The system includes progression tracking, XP/leveling, badge rewards, and card rewards.

## Current Implementation Status

### ✅ Completed Components

#### 1. Backend Infrastructure ([convex/](convex/))

**Story Progression** ([convex/progression/story.ts](convex/progression/story.ts))
- `getPlayerProgress` - Fetch player's story progress
- `getChapterDetails` - Get specific chapter info
- `getAvailableChapters` - List all unlocked chapters
- `getPlayerXPInfo` - Get player level and XP
- `getPlayerBadges` - Get earned badges
- `startChapter` - Initialize a story battle
- `completeChapter` - Record battle results and award rewards
- `abandonChapter` - Cancel a battle attempt
- `initializeStoryProgress` - Set up story progress for new users

**Story Battle Initialization** ([convex/progression/storyBattle.ts](convex/progression/storyBattle.ts))
- `initializeStoryBattle` - Create AI opponent game
- `buildAIDeck` - Generate AI deck from archetype
- `getOrCreateAIUser` - Manage AI player account

**AI Engine** ([convex/gameplay/ai/](convex/gameplay/ai/))
- [aiEngine.ts](convex/gameplay/ai/aiEngine.ts) - Strategic decision-making for AI
  - `makeAIDecision` - Choose actions based on game state
  - `evaluateBoard` - Assess board position
  - `shouldAttack` - Determine attack viability
  - `findStrongestMonster` - Select best summon
  - `findWeakestMonster` - Select tribute targets
- [aiTurn.ts](convex/gameplay/ai/aiTurn.ts) - Execute complete AI turns
  - `executeAITurn` - Run full turn (Main 1 → Battle → Main 2 → End)
  - Handles all phases automatically
  - Integrates with existing game engine mutations

**Chapter Definitions** ([convex/seeds/storyChapters.ts](convex/seeds/storyChapters.ts))
- 10 chapters across 2 acts
- Each chapter tied to an archetype
- Difficulty scaling (normal/hard/legendary)
- Reward configuration (gold, XP, cards)

**Seeding Script** ([convex/scripts/seedStoryChapters.ts](convex/scripts/seedStoryChapters.ts))
- `seedStoryChapters` - Populate chapters table
- `clearStoryChapters` - Remove all chapters
- `reseedStoryChapters` - Refresh chapter data

#### 2. Frontend Components

**Story Hub** ([apps/web/app/(app)/play/story/page.tsx](apps/web/app/(app)/play/story/page.tsx))
- Chapter selection grid
- Progress stats dashboard
- Player level/XP display
- Integrated with real Convex queries (no mock data)

**Chapter Detail** ([apps/web/app/(app)/play/story/[chapterId]/page.tsx](apps/web/app/(app)/play/story/[chapterId]/page.tsx))
- Stage map display
- Chapter lore and description
- Stage selection dialog
- Difficulty badges

**Battle Page** ([apps/web/app/(app)/play/story/[chapterId]/battle/[stageNumber]/page.tsx](apps/web/app/(app)/play/story/[chapterId]/battle/[stageNumber]/page.tsx))
- Initializes story battle
- Renders GameBoard component
- Handles battle initialization errors

**Story Components**
- [StoryChapterCard.tsx](apps/web/src/components/story/StoryChapterCard.tsx) - Chapter selection card
- [StoryStageNode.tsx](apps/web/src/components/story/StoryStageNode.tsx) - Individual stage node
- [StoryBattleCompleteDialog.tsx](apps/web/src/components/story/StoryBattleCompleteDialog.tsx) - Victory/defeat screen with rewards

**Hooks**
- [useGameBoard.ts](apps/web/src/components/game/hooks/useGameBoard.ts) - Updated to trigger AI turns after player's turn in story mode
- [useStoryBattle.ts](apps/web/src/hooks/game/useStoryBattle.ts) - Auto-execute AI turns and handle battle completion

### 🚧 Remaining Work

#### 1. Database Seeding
**Run this command to populate story chapters:**
```bash
npx convex run scripts/seedStoryChapters:seedStoryChapters
```

This creates all 10 chapters in the `storyChapters` table.

#### 2. User Initialization
New users need story progress initialized. This should happen on signup:
- Call `api.progression.story.initializeStoryProgress` when a user creates an account
- This sets up Act 1 Chapter 1 as available for normal difficulty

#### 3. Chapter Detail Page
The chapter detail page ([apps/web/app/(app)/play/story/[chapterId]/page.tsx](apps/web/app/(app)/play/story/[chapterId]/page.tsx)) currently shows an empty stages array. This needs to be built:

**Missing: Stage Generation**
- Each chapter should have 10 stages (stored or generated)
- Each stage needs:
  - `stageNumber` (1-10)
  - `name` (e.g., "Stage 1: Fire Initiation")
  - `aiDifficulty` (easy/medium/hard/boss)
  - `status` (locked/available/completed/starred)
  - `rewardGold` and `rewardXp`
  - `firstClearClaimed` boolean

**Options for Implementation:**
1. **Static Data**: Add stages to `storyChapters` seed data
2. **Dynamic Generation**: Create stages on-the-fly based on chapter
3. **Separate Table**: Add `storyStages` table with foreign key to chapters

**Recommended: Option 3 - Separate Table**
```typescript
// Add to schema.ts
storyStages: defineTable({
  chapterId: v.id("storyChapters"),
  stageNumber: v.number(), // 1-10
  name: v.string(),
  description: v.string(),
  aiDifficulty: v.union(
    v.literal("easy"),
    v.literal("medium"),
    v.literal("hard"),
    v.literal("boss")
  ),
  rewardGold: v.number(),
  rewardXp: v.number(),
}).index("by_chapter", ["chapterId"]);

// Add stages to progress tracking
storyStageProgress: defineTable({
  userId: v.id("users"),
  stageId: v.id("storyStages"),
  status: v.union(
    v.literal("locked"),
    v.literal("available"),
    v.literal("completed"),
    v.literal("starred")
  ),
  bestScore: v.optional(v.number()),
  timesCompleted: v.number(),
  firstClearClaimed: v.boolean(),
}).index("by_user_stage", ["userId", "stageId"]);
```

#### 4. Battle Completion Integration
The [apps/web/app/(app)/play/story/[chapterId]/battle/[stageNumber]/page.tsx](apps/web/app/(app)/play/story/[chapterId]/battle/[stageNumber]/page.tsx) needs to:

1. Track when battle ends (player wins/loses or LP reaches 0)
2. Call `completeBattle` from `useStoryBattle` hook
3. Show `StoryBattleCompleteDialog` with results
4. Navigate back to chapter page on dialog close

**Example Integration:**
```typescript
const { completeBattle } = useStoryBattle({
  lobbyId,
  gameId,
  onBattleComplete: (result) => {
    setShowCompletionDialog(true);
    setCompletionResult(result);
  },
});

// Watch for game end
useEffect(() => {
  if (gameState?.status === "ended") {
    const playerWon = gameState.winnerId === currentUserId;
    const finalLP = playerWon ? gameState.myLifePoints : 0;

    completeBattle(attemptId, playerWon, finalLP);
  }
}, [gameState]);
```

#### 5. AI Improvements
Current AI (Normal difficulty) is functional but basic:
- Summons strongest monster without tribute
- Attacks when it has higher ATK
- Sets monsters defensively when hand is full
- Activates spells randomly (50% chance)

**Enhancements Needed:**
- **Hard Difficulty**: Smarter targeting, better tribute decisions
- **Legendary Difficulty**: Advanced combos, trap usage, optimal sequencing
- **Boss AI**: Unique strategies per archetype
- **Response to Opponent**: React to player's board state
- **Card Effect Awareness**: Use abilities strategically

#### 6. Testing Checklist
- [ ] Seed story chapters successfully
- [ ] New user gets initialized story progress
- [ ] Can navigate through story hub → chapter → stage
- [ ] Battle initializes correctly with AI opponent
- [ ] AI takes automatic turns after player
- [ ] Battle completion awards correct rewards
- [ ] XP/leveling works correctly
- [ ] Badges are awarded for milestones
- [ ] Card rewards are granted
- [ ] Next chapter unlocks after completion

## File Structure

```
convex/
├── progression/
│   ├── story.ts                 # Story progression queries/mutations
│   └── storyBattle.ts           # Battle initialization
├── gameplay/
│   └── ai/
│       ├── aiEngine.ts          # AI decision logic
│       └── aiTurn.ts            # AI turn execution
├── seeds/
│   └── storyChapters.ts         # Chapter definitions
└── scripts/
    └── seedStoryChapters.ts     # Database seeding

apps/web/
├── app/(app)/play/story/
│   ├── page.tsx                            # Story hub
│   ├── [chapterId]/
│   │   ├── page.tsx                        # Chapter detail
│   │   └── battle/[stageNumber]/page.tsx   # Battle page
├── src/
│   ├── components/
│   │   ├── story/
│   │   │   ├── StoryChapterCard.tsx
│   │   │   ├── StoryStageNode.tsx
│   │   │   └── StoryBattleCompleteDialog.tsx
│   │   └── game/
│   │       └── hooks/
│   │           └── useGameBoard.ts         # Updated with AI integration
│   └── hooks/
│       └── game/
│           └── useStoryBattle.ts           # Story battle hook
```

## Key Design Decisions

### 1. AI as Opponent Player
The AI is treated as a real user in the system:
- Has a `users` entry ("StoryModeAI")
- Uses the same game engine mutations as human players
- Game lobbies have `mode: "story"` and `isAIOpponent: true`

This design allows reusing all existing game logic without special cases.

### 2. Turn Execution Model
AI turns are executed server-side in a single mutation:
- `executeAITurn` runs through all phases
- Makes decisions at each phase
- Applies actions via existing mutations
- Returns control to player when done

Frontend triggers AI turn after player ends their turn (for story mode only).

### 3. Rewards System
Rewards scale based on:
- **Difficulty multiplier**: Normal (1x), Hard (1.5x), Legendary (2x)
- **Star bonus**: Each star adds +20% gold, +10% XP
- **First clear bonus**: Extra gold on first completion
- **Card rewards**: Based on stars earned (1-3 cards)

### 4. Progression Structure
- **Acts**: Groups of 5 chapters
- **Chapters**: 10 total (one per archetype)
- **Stages**: 10 per chapter (to be implemented)
- **Difficulties**: Normal/Hard/Legendary per chapter

## Next Steps Priority

1. **Seed database** - Run seeding script
2. **Add user initialization** - Call `initializeStoryProgress` on signup
3. **Implement stages** - Add stage data structure and generation
4. **Complete battle flow** - Integrate completion dialog and rewards
5. **Test end-to-end** - Full story mode flow
6. **AI enhancements** - Improve AI for higher difficulties

## API Reference

### Story Queries
```typescript
// Get all player progress
api.progression.story.getPlayerProgress()

// Get specific chapter
api.progression.story.getChapterDetails({ actNumber, chapterNumber })

// Get available chapters
api.progression.story.getAvailableChapters({ difficulty?: "normal" | "hard" | "legendary" })

// Get player XP info
api.progression.story.getPlayerXPInfo()

// Get player badges
api.progression.story.getPlayerBadges()
```

### Story Mutations
```typescript
// Start a chapter battle
api.progression.story.startChapter({
  actNumber: 1,
  chapterNumber: 1,
  difficulty: "normal"
})

// Complete a chapter
api.progression.story.completeChapter({
  attemptId: Id<"storyBattleAttempts">,
  won: true,
  finalLP: 6500
})

// Initialize story battle
api.progression.storyBattle.initializeStoryBattle({
  chapterId: "ch1"
})

// Execute AI turn
api.gameplay.ai.aiTurn.executeAITurn({
  gameId: "story_user123_123456789"
})
```

## Troubleshooting

### AI Not Taking Turns
- Check `gameState.isAIOpponent` is true
- Verify `gameState.gameMode === "story"`
- Ensure `executeAITurn` is called after player ends turn
- Check console for AI turn errors

### Rewards Not Awarded
- Verify `attemptId` is passed to `completeChapter`
- Check that battle was started via `startChapter`
- Ensure user has story progress initialized
- Check economy system for currency updates

### Chapters Not Showing
- Run seeding script to populate chapters
- Verify `storyChapters` table has data
- Check user has story progress initialized
- Look for query errors in browser console

## Future Enhancements

- **Dynamic Difficulty**: AI adapts to player skill level
- **Challenge Mode**: Special weekly/daily challenges
- **Achievements**: Additional goals beyond main progression
- **Replay Value**: Incentives to replay completed chapters
- **Story Cutscenes**: Narrative between chapters
- **Boss Mechanics**: Unique abilities for boss stages
- **Co-op Mode**: Two players vs AI
- **Leaderboards**: Speedrun/perfect clear rankings
