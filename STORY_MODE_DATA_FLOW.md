# Story Mode Data Flow

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

Step 1: View Story Hub
├─ User navigates to /play/story
├─ Frontend: apps/web/app/(app)/play/story/page.tsx
│   └─ Calls: api.progression.story.getAvailableChapters
│       ├─ Query: convex/progression/story.ts:136-165
│       ├─ Fetches all chapters from storyChapters table
│       ├─ Auto-creates first chapter progress if none exists
│       ├─ Merges chapter data with user progress
│       └─ Returns: Array of chapters with status, stars, etc.
│
└─ UI displays: 10 chapters with lock/unlock status

Step 2: Select Chapter
├─ User clicks Chapter 1 (chapterId: "1-1")
├─ Frontend: apps/web/app/(app)/play/story/[chapterId]/page.tsx
│   ├─ Calls: api.progression.story.getChapterDetails
│   │   ├─ Query: convex/progression/story.ts:80-131
│   │   ├─ Fetches chapter by actNumber=1, chapterNumber=1
│   │   ├─ Fetches all 10 stages for this chapter
│   │   ├─ Merges stage data with user progress
│   │   └─ Returns: Chapter with stages array
│   │
│   └─ useEffect triggers:
│       └─ Calls: api.progression.storyStages.initializeChapterStageProgress
│           ├─ Mutation: convex/progression/storyStages.ts:66-104
│           ├─ Creates storyStageProgress for all 10 stages
│           ├─ Stage 1: status = "available"
│           └─ Stages 2-10: status = "locked"
│
└─ UI displays: 10 stages with Stage 1 unlocked

Step 3: Start Battle
├─ User clicks Stage 1 "Start Battle"
├─ Frontend: apps/web/app/(app)/play/story/[chapterId]/battle/[stageNumber]/page.tsx
│   └─ Calls: api.progression.storyBattle.initializeStoryBattle
│       ├─ Mutation: convex/progression/storyBattle.ts:22-120
│       ├─ Parses chapterId "1-1" → actNumber=1, chapterNumber=1
│       ├─ Fetches chapter from database
│       ├─ Builds AI deck from chapter archetype cards
│       ├─ Creates game lobby with AI opponent
│       ├─ Initializes game state
│       └─ Returns: gameId, lobbyId, chapterTitle
│
└─ UI displays: GameBoard with battle in progress

Step 4: Complete Battle
├─ User wins battle (finalLP = 7800)
├─ Frontend: Battle completion detected
│   └─ Calls: api.progression.storyStages.completeStage
│       ├─ Mutation: convex/progression/storyStages.ts:109-227
│       ├─ Calculates stars: finalLP=7800 → 3 stars (>7500)
│       ├─ Calculates rewards:
│       │   ├─ Base gold: 100
│       │   ├─ First clear bonus: +200
│       │   ├─ Star multiplier: 1 + (3-1)*0.2 = 1.4
│       │   └─ Total gold: (100+200)*1.4 = 420
│       ├─ Awards gold via adjustPlayerCurrencyHelper
│       ├─ Awards XP via addXP (tracks level ups)
│       ├─ Updates stage progress:
│       │   ├─ status: "starred" (3 stars)
│       │   ├─ starsEarned: 3
│       │   ├─ bestScore: 7800
│       │   ├─ timesCompleted: 1
│       │   └─ firstClearClaimed: true
│       ├─ Unlocks next stage:
│       │   └─ Stage 2 progress: status = "available"
│       └─ Returns: rewards, stars, levelUp, badges
│
└─ UI displays: Completion dialog with rewards

Step 5: Progress Tracking
├─ User returns to chapter view
│   ├─ Stage 1: Shows 3 stars, "Replay" button
│   └─ Stage 2: Shows "Available", "Start Battle" button
│
└─ User returns to story hub
    └─ Chapter 1: Shows 1/10 stages completed, 3 stars earned
```

## Database Schema

### Core Tables

```typescript
storyChapters {
  _id: Id<"storyChapters">
  actNumber: number          // 1
  chapterNumber: number      // 1-10
  title: string             // "Infernal Dragons"
  description: string
  archetype: string         // "infernal_dragons"
  aiOpponentDeckCode: string
  // ... other fields
}

storyStages {
  _id: Id<"storyStages">
  chapterId: Id<"storyChapters">
  stageNumber: number       // 1-10
  name: string             // "Stage 1: First Fire"
  description: string
  aiDifficulty: "easy" | "medium" | "hard" | "boss"
  rewardGold: number       // 100
  rewardXp: number         // 50
  firstClearBonus: number  // 200
}

storyProgress {
  _id: Id<"storyProgress">
  userId: Id<"users">
  actNumber: number
  chapterNumber: number
  difficulty: "normal" | "hard" | "legendary"
  status: "locked" | "available" | "in_progress" | "completed"
  starsEarned: number      // 0-30 (max 3 per stage × 10 stages)
  timesAttempted: number
  timesCompleted: number
}

storyStageProgress {
  _id: Id<"storyStageProgress">
  userId: Id<"users">
  stageId: Id<"storyStages">
  chapterId: Id<"storyChapters">
  stageNumber: number
  status: "locked" | "available" | "completed" | "starred"
  starsEarned: number      // 0-3
  bestScore: number        // Highest LP at completion
  timesCompleted: number
  firstClearClaimed: boolean
  lastCompletedAt?: number
}
```

## API Endpoints

### Queries (Read-only)

```typescript
// Get all chapters with user progress
api.progression.story.getAvailableChapters()
→ Returns: Array<Chapter & { status, stagesCompleted, starsEarned }>

// Get specific chapter with all stages
api.progression.story.getChapterDetails({ actNumber, chapterNumber })
→ Returns: Chapter & { stages: Array<Stage & Progress> }

// Get stage by chapter and number
api.progression.storyQueries.getStageByChapterAndNumber({ chapterId, stageNumber })
→ Returns: Stage

// Get player overall progress
api.progression.story.getPlayerProgress()
→ Returns: { progressByAct, totalChaptersCompleted, totalStarsEarned }
```

### Mutations (Write operations)

```typescript
// Initialize stage progress for a chapter
api.progression.storyStages.initializeChapterStageProgress({ chapterId })
→ Creates storyStageProgress for all stages

// Start a story battle
api.progression.storyBattle.initializeStoryBattle({ chapterId })
→ Returns: { gameId, lobbyId, chapterTitle }

// Complete a stage
api.progression.storyStages.completeStage({ stageId, won, finalLP })
→ Returns: { won, rewards, starsEarned, levelUp, badges }
```

## UI Component Tree

```
/play/story (Story Hub)
├─ CHAPTER_INFO (UI metadata for names/descriptions)
├─ useQuery: getAvailableChapters
│   └─ Auto-initializes first chapter progress
├─ useQuery: getPlayerProgress
│   └─ Shows total stats
└─ Renders: StoryChapterCard × 10

/play/story/[chapterId] (Chapter Detail)
├─ Parse chapterId: "1-1" → actNumber=1, chapterNumber=1
├─ useQuery: getChapterDetails
├─ useMutation: initializeChapterStageProgress
│   └─ Triggers in useEffect if no progress exists
└─ Renders: StoryStageNode × 10

/play/story/[chapterId]/battle/[stageNumber] (Battle)
├─ useMutation: initializeStoryBattle
│   └─ Runs on mount
├─ useQuery: getGameStateForPlayer
│   └─ Monitors game for completion
├─ useMutation: completeStage
│   └─ Calls when game ends
└─ Renders: GameBoard → StoryBattleCompleteDialog
```

## Reward Calculation

### Star Rating

```typescript
// Based on LP remaining at victory
finalLP >= 7500 → 3 stars (93.75%+ HP)
finalLP >= 6000 → 2 stars (75%+ HP)
finalLP > 0     → 1 star  (Victory)
finalLP = 0     → 0 stars (Defeat)
```

### Gold Rewards

```typescript
baseGold = stage.rewardGold              // e.g., 100
firstClearBonus = stage.firstClearBonus  // e.g., 200 (only once)
starMultiplier = 1 + (starsEarned - 1) * 0.2

totalGold = (baseGold + firstClearBonus) * starMultiplier

// Example:
// Stage 1, 3 stars, first clear:
// (100 + 200) * 1.4 = 420 gold

// Stage 1, 3 stars, replay:
// 100 * 1.4 = 140 gold
```

### XP Rewards

```typescript
baseXP = stage.rewardXp  // e.g., 50
starMultiplier = 1 + (starsEarned - 1) * 0.2

totalXP = baseXP * starMultiplier

// Example:
// 3 stars: 50 * 1.4 = 70 XP
// 2 stars: 50 * 1.2 = 60 XP
// 1 star:  50 * 1.0 = 50 XP
```

## Error Handling

### Common Errors and Solutions

1. **Chapter Not Found**
   - Error: "Chapter not found"
   - Cause: Invalid chapterId or chapter not in database
   - Solution: Ensure seeding script has run successfully

2. **Stage Progress Not Found**
   - Error: "Stage progress not found"
   - Cause: Stage progress not initialized
   - Solution: Auto-initialization via useEffect in chapter page

3. **Invalid Chapter ID Format**
   - Error: "Invalid chapter ID format. Expected format: '1-1'"
   - Cause: Wrong chapterId format passed to initializeStoryBattle
   - Solution: Ensure UI uses "actNumber-chapterNumber" format

4. **No Active Deck**
   - Error: "You must have an active deck to start a battle"
   - Cause: User hasn't selected a deck
   - Solution: Redirect to deck builder or show deck selection modal

## Testing Flow

```bash
# 1. Seed database
bun convex run scripts/seedStoryChapters:seedStoryChapters

# Expected output:
# {
#   "chaptersInserted": 10,
#   "stagesInserted": 100,
#   "success": true
# }

# 2. Navigate to /play/story
# → Should see 10 chapters, Chapter 1 unlocked

# 3. Click Chapter 1
# → Should see 10 stages, Stage 1 unlocked

# 4. Click Stage 1 → Start Battle
# → Should initialize battle and show game board

# 5. Win battle
# → Should award gold, XP, and unlock Stage 2

# 6. Check progress
# → Chapter should show 1/10 completed
# → Should have earned gold and XP
# → Stage 2 should be unlocked
```

## Success Indicators

✅ All queries return data without errors
✅ Chapter progress auto-initializes on first access
✅ Stage progress auto-initializes when viewing chapter
✅ Battles start successfully with AI opponent
✅ Rewards (gold, XP) are awarded on completion
✅ Next stage unlocks after completing current stage
✅ Stars are calculated correctly based on final LP
✅ First-clear bonus only awarded once
✅ Replays don't give first-clear bonus but still award rewards
✅ Level ups tracked and returned in completion result
