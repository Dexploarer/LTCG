# Story Mode Quick Start Guide

## Prerequisites

Before testing story mode, ensure your database is seeded:

```bash
# Run the seeding script
bun convex run scripts/seedStoryChapters
```

This creates:
- 10 story chapters (Act 1: Chapters 1-10)
- 100 stages (10 stages per chapter)
- Difficulty progression (Easy → Medium → Hard → Boss)

## How to Play Story Mode

### 1. Access Story Mode

Navigate to: `/play/story`

You'll see:
- Your player level and XP progress bar
- All 10 chapters with unlock status
- Current badges earned
- Visual progression indicators

### 2. Select a Chapter

Click on any **unlocked** chapter to view its stages.

**Unlock Rules:**
- Chapter 1 is unlocked by default
- Complete Chapter 1's boss (Stage 10) to unlock Chapter 2
- Each subsequent chapter unlocks after completing the previous boss

### 3. Choose a Stage

Each chapter has **10 stages**:
- **Stages 1-3**: Easy (Tutorial/Warmup)
- **Stages 4-6**: Medium (Standard Challenge)
- **Stages 7-9**: Hard (Tough Encounters)
- **Stage 10**: Boss (Chapter Finale)

**Stage Status:**
- 🔒 **Locked**: Must complete previous stage first
- ✅ **Available**: Ready to play
- ⭐ **Completed**: Finished with 1-3 stars
- 🌟 **Starred**: Perfect 3-star completion

### 4. Battle Against AI

The battle starts automatically:
- You play with your selected deck
- AI opponent uses chapter-themed deck
- **Your Turn**: Play cards normally
  - Click cards in hand to summon/set/activate
  - Enter battle phase to declare attacks
  - End turn when ready
- **AI Turn**: Happens automatically (1 second delay)
  - AI evaluates board state
  - Makes optimal plays based on difficulty
  - You see "AI Opponent Thinking..." overlay

### 5. Card Playing Actions

**Main Phase:**
- Click a card in your hand
- Choose action:
  - **Normal Summon** (Attack/Defense position)
  - **Set Monster** (Face-down defense)
  - **Set Spell/Trap** (Face-down in backrow)
  - **Activate Spell** (Quick-play/Normal spells)

**Battle Phase:**
- Click your monsters to attack
- Select target or direct attack
- Combat resolves automatically

**End Turn:**
- Click "End Turn" button
- AI automatically takes its turn
- Returns to your turn after AI completes

### 6. Battle Completion

**Victory Conditions:**
- Reduce opponent LP to 0
- Opponent has no cards to draw

**Defeat Conditions:**
- Your LP reaches 0
- You have no cards to draw

**After Battle:**
- Completion dialog shows results
- Star rating (1-3 based on LP remaining):
  - 1 star: Victory (any LP)
  - 2 stars: 75%+ LP (6000+)
  - 3 stars: 93.75%+ LP (7500+)
- Rewards breakdown:
  - Gold (base + star bonus + first clear bonus)
  - XP (base + star bonus)
  - Cards (random from chapter archetype)
  - Level ups (if applicable)
  - Badges (if earned)

### 7. Progression System

**Stars:**
- Earn 1-3 stars per stage based on performance
- Higher stars = better rewards
- Can replay stages to improve star rating

**Unlocking:**
- Complete Stage 1 to unlock Stage 2
- Complete Stage 2 to unlock Stage 3
- ... and so on
- Complete Stage 10 (Boss) to unlock next chapter

**Rewards Scale:**
- Later chapters give more gold and XP
- Star bonuses: +20% per star above 1
- First clear bonus: Extra gold (2x-10x base)

**XP and Leveling:**
- Gain XP from stage completions
- Level up to unlock new features
- View progress in story hub

**Badges:**
- Special achievements for milestones
- Displayed in story hub and profile

## AI Difficulty Levels

### Easy (Stages 1-3)
- Random decisions
- 20% spell usage
- No tribute summons
- Good for learning mechanics

### Medium (Stages 4-6)
- Basic strategy
- 50% spell usage
- Simple tributes (if beneficial)
- Balanced challenge

### Hard (Stages 7-9)
- Advanced tactics
- 70% spell usage
- Smart tribute decisions (800+ ATK gain)
- Optimal monster choices
- Aggressive playstyle

### Boss (Stage 10)
- Perfect play
- 90% spell usage
- Complex tribute calculations
- Predicts opponent moves
- Maximum difficulty

## Tips for Success

1. **Build a Strong Deck**: Use the Deck Builder to optimize your deck before challenging harder stages
2. **Preserve LP**: Higher LP at victory = more stars = better rewards
3. **Learn AI Patterns**: Each difficulty has consistent behavior you can exploit
4. **Use Spell/Trap Cards**: Set backrow cards to disrupt AI strategies
5. **Replay for Stars**: Replaying stages won't give first-clear bonus, but can improve star rating
6. **Complete Full Chapters**: Finish all 10 stages to unlock the next chapter and maximize rewards

## Testing Checklist

- [ ] Navigate to story hub and see chapters
- [ ] Click unlocked chapter and see stages
- [ ] Start Stage 1 battle
- [ ] Play cards from hand (summon, set, activate)
- [ ] Declare attacks in battle phase
- [ ] End turn and watch AI take turn automatically
- [ ] Complete battle and see rewards dialog
- [ ] Verify Stage 2 is now unlocked
- [ ] Check gold, XP, and cards were awarded
- [ ] Replay completed stage and verify no first-clear bonus
- [ ] Progress through stages to unlock next ones

## Troubleshooting

### "Battle Failed" Error
- Check that chapter data exists in database
- Verify you have a valid deck selected
- Ensure database is seeded with stages

### AI Turn Not Executing
- Check browser console for errors
- Verify `executeAITurn` mutation is accessible
- Ensure game mode is set to "story"

### Stages Not Showing
- Run seeding script again
- Check that chapter has 10 stages in database
- Verify storyStages collection exists

### Rewards Not Received
- Check `completeStage` mutation succeeded
- Verify user economy records exist
- Check browser console for mutation errors

## Need More Details?

See comprehensive documentation:
- [STORY_MODE_IMPLEMENTATION.md](./STORY_MODE_IMPLEMENTATION.md) - Full technical implementation
- [STORY_MODE_TESTING_GUIDE.md](./STORY_MODE_TESTING_GUIDE.md) - Detailed testing procedures
