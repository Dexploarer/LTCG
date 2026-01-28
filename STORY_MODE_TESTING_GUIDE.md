# Story Mode Testing Guide

## Prerequisites

Before testing, ensure you've completed these setup steps:

### 1. Database Seeding

Run the seeding script to populate story chapters and stages:

```bash
npx convex run scripts/seedStoryChapters:seedStoryChapters
```

This will create:
- 10 story chapters (across Acts 1-2)
- 100 story stages (10 per chapter)
- Each stage with difficulty, rewards, and progression

### 2. User Initialization

New users need story progress initialized. You have two options:

**Option A: Automatic (Recommended)**
Add to your user signup flow:
```typescript
await ctx.scheduler.runAfter(0, internal.progression.story.initializeStoryProgress, {
  userId: newUser._id
});
```

**Option B: Manual (For Testing)**
Run in Convex dashboard:
```typescript
await ctx.runMutation(internal.progression.story.initializeStoryProgress, {
  userId: "your-user-id"
});
```

This initializes:
- Player XP record (Level 1, 0 XP)
- Act 1, Chapter 1 unlocked for Normal difficulty
- All other chapters locked

### 3. Initialize Stage Progress

When a user starts a chapter for the first time, stage progress needs to be initialized:

```typescript
await ctx.runMutation(internal.progression.storyStages.initializeChapterStageProgress, {
  userId: "your-user-id",
  chapterId: "chapter-id-from-database"
});
```

This will:
- Create progress records for all 10 stages
- Unlock stage 1, lock stages 2-10
- Set up first-clear bonus tracking

## Testing Checklist

### Phase 1: Story Hub
- [ ] Navigate to `/play/story`
- [ ] Verify chapter cards display with correct info:
  - Chapter names and descriptions
  - Archetype themes
  - Lock status (only Chapter 1-1 should be unlocked initially)
  - Progress indicators (0/10 stages)
- [ ] Verify player stats dashboard shows:
  - Current level (should be 1)
  - XP progress bar
  - Chapters completed (0/10)
  - Stages cleared (0/100)
  - Stars earned (0)
- [ ] Click on locked chapter → Should show "Chapter Locked" message
- [ ] Click on unlocked chapter → Should navigate to chapter detail page

### Phase 2: Chapter Detail Page
- [ ] Navigate to `/play/story/1-1` (Chapter 1-1)
- [ ] Verify chapter information displays:
  - Chapter title and description
  - Background image for archetype
  - Story text/lore
- [ ] Verify stage map renders:
  - 10 stage nodes in grid layout
  - Stage 1 is unlocked (colored, clickable)
  - Stages 2-10 are locked (grayed out)
  - Difficulty badges (Easy, Medium, Hard, Boss)
- [ ] Click on Stage 1 node → Stage detail dialog appears
- [ ] Verify dialog shows:
  - Stage name and description
  - Difficulty indicator
  - Reward amounts (Gold, XP)
  - First Clear Bonus indicator
  - "Start Battle" button (enabled for unlocked stages)
- [ ] Click "Start Battle" → Navigate to battle page

### Phase 3: Battle Initialization
- [ ] Battle page at `/play/story/1-1/battle/1`
- [ ] Verify loading screen appears briefly:
  - "Preparing battle..." message
  - Loading spinner
- [ ] Verify battle initializes:
  - GameBoard component renders
  - Player's deck is loaded
  - AI opponent appears with deck
  - Both players start with 8000 LP
  - Player goes first (Draw Phase)
- [ ] Check battle UI elements:
  - Hand cards visible for player
  - Opponent hand count visible (hidden cards)
  - Monster zones (empty initially)
  - Spell/Trap zones
  - Graveyard zones
  - Phase indicator shows "Draw Phase"

### Phase 4: Player Turn
- [ ] Test normal summon:
  - Click on a low-cost monster (cost ≤ 4)
  - Drag to monster zone or click summon button
  - Verify monster appears on field in attack position
  - Try to summon another → Should be blocked (only 1 normal summon/turn)
- [ ] Test setting a card:
  - Click on a monster
  - Select "Set" option
  - Verify monster appears face-down in defense position
- [ ] Test spells/traps:
  - Activate a spell card
  - Verify effect resolves (if applicable)
- [ ] Test battle phase:
  - Advance to Battle Phase
  - Try to attack with a monster
  - If opponent has no monsters → Direct attack deals damage
  - If opponent has monsters → Battle resolves correctly
- [ ] Test ending turn:
  - Click "End Turn" button
  - Phase advances to End Phase
  - Turn switches to AI opponent

### Phase 5: AI Turn
- [ ] Verify AI turn executes automatically:
  - Brief delay (~1.5 seconds) after player ends turn
  - AI draws a card
  - AI makes decisions:
    - Summons monsters from hand
    - Attacks with monsters when advantageous
    - Sets cards defensively
  - AI turn completes and returns to player
- [ ] Test AI difficulty behaviors:
  - **Easy**: Sometimes makes suboptimal plays (random summons, reckless attacks)
  - **Medium**: Basic strategy (summons strongest, attacks when safe)
  - **Hard**: Smarter tribute logic, better targeting
  - **Boss**: Optimal plays, predicts opponent moves

### Phase 6: Battle End
- [ ] Play until one player's LP reaches 0
- [ ] Verify battle ends automatically:
  - Winner is determined correctly
  - Completion dialog appears immediately
- [ ] Test victory scenario:
  - "VICTORY" header displays
  - Stars earned (1-3) based on remaining LP:
    - 3 stars: 93.75%+ LP (7500+)
    - 2 stars: 75%+ LP (6000+)
    - 1 star: Any LP > 0
  - Rewards displayed:
    - Gold amount
    - XP amount
    - Cards received (1-3 cards based on stars)
  - Level up notification (if XP threshold reached)
  - Badges earned (if applicable)
  - "Continue" button returns to chapter page
- [ ] Test defeat scenario:
  - "DEFEAT" message displays
  - No rewards shown
  - "Try Again" button returns to chapter

### Phase 7: Progression System
- [ ] After winning a stage:
  - Return to chapter page
  - Verify stage 1 status updated to "Completed" or "Starred"
  - Verify stage 2 is now unlocked
  - Stars appear on stage 1 node
  - First Clear bonus indicator removed
- [ ] Play stage 2-10:
  - Each victory unlocks the next stage
  - Stage 10 (Boss) is hardest difficulty
  - Completing all stages marks chapter as complete
- [ ] Test replaying stages:
  - Click on a completed stage
  - Can replay for additional rewards (reduced)
  - Can earn higher star rating if better performance
  - First Clear bonus not available

### Phase 8: Rewards and Economy
- [ ] After each victory, verify:
  - Gold is added to player wallet
  - XP is added and level increases if threshold met
  - Cards are added to collection/inventory
  - Player stats on story hub update correctly
- [ ] Test level up:
  - Earn enough XP to level up
  - Level up dialog/notification appears
  - Player level increases
  - New chapters may unlock based on level requirements

### Phase 9: Badges and Achievements
- [ ] Test badge awards:
  - **Perfect Chapter**: Earn 3 stars on a stage
  - **Archetype Master**: Complete all stages of an archetype
  - **Act Champion**: Complete all chapters in an act
- [ ] Verify badges appear:
  - In completion dialog when earned
  - In player profile
  - In story progress view

### Phase 10: Chapter Progression
- [ ] Complete Chapter 1-1:
  - All 10 stages completed
  - Chapter marked as "Completed"
- [ ] Verify Chapter 1-2 unlocks:
  - Chapter 1-2 now shows as "Available" on story hub
  - Can click and enter Chapter 1-2
  - Chapter 1-3+ still locked (require previous completion)
- [ ] Test difficulty tiers:
  - Normal difficulty: Always available for unlocked chapters
  - Hard difficulty: Unlocks at player level 10
  - Legendary difficulty: Unlocks at player level 20

### Phase 11: Edge Cases and Error Handling
- [ ] Test invalid navigation:
  - Try accessing `/play/story/99-99` → Shows "Chapter Not Found"
  - Try accessing locked chapter → Shows "Chapter Locked" message
  - Try accessing locked stage → Button is disabled
- [ ] Test battle interruption:
  - Start a battle
  - Navigate away (back button)
  - Return to story hub → Battle should be abandonable/resumable
- [ ] Test network errors:
  - Simulate connection loss during battle
  - Verify error handling and recovery
- [ ] Test multiple concurrent battles:
  - Only one story battle should be active at a time
- [ ] Test LP edge cases:
  - Exactly 0 LP → Defeat
  - Opponent reaches 0 LP → Victory
  - Both reach 0 simultaneously → Player wins (typically)

## Known Issues / Future Enhancements

### Current Limitations
1. **Stage progression** requires manual initialization per chapter
2. **AI difficulty** is stage-specific but not yet fully differentiated
3. **Card rewards** are random from rarity pool, not archetype-specific
4. **No mid-battle save** - battles must be completed or abandoned
5. **Single difficulty per playthrough** - can't switch difficulty mid-chapter

### Future Improvements
- [ ] Add mid-battle save/resume functionality
- [ ] Implement archetype-specific card rewards
- [ ] Add combo detection for bonus rewards
- [ ] Implement speed-run challenges
- [ ] Add chapter cutscenes/story animations
- [ ] Implement co-op story mode (2 players vs AI)
- [ ] Add daily/weekly story challenges
- [ ] Implement difficulty scaling based on player performance

## Debugging Tips

### Common Issues

**1. Chapters not showing on story hub**
- Check if `seedStoryChapters` was run
- Verify `storyChapters` table has 10 entries
- Check user has `storyProgress` records

**2. Stages not appearing**
- Run `initializeChapterStageProgress` for the chapter
- Verify `storyStages` table has 100 entries (10 per chapter)
- Check `storyStageProgress` has records for user

**3. AI not taking turns**
- Check `gameState.isAIOpponent` is `true`
- Verify `gameState.gameMode === "story"`
- Check console for AI turn errors
- Ensure `executeAITurn` mutation exists

**4. Battle doesn't end**
- Check `gameState.myLifePoints` and `opponentLifePoints`
- Verify `completeStage` mutation is called
- Check for errors in completion dialog rendering

**5. Rewards not awarded**
- Verify `adjustPlayerCurrencyHelper` is working
- Check `addXP` function updates XP correctly
- Ensure `addCardsToInventory` adds cards

### Console Commands (Convex Dashboard)

**Check user progress:**
```javascript
await ctx.db.query("storyProgress")
  .withIndex("by_user", q => q.eq("userId", "user-id"))
  .collect()
```

**Check stage progress:**
```javascript
await ctx.db.query("storyStageProgress")
  .withIndex("by_user", q => q.eq("userId", "user-id"))
  .collect()
```

**Reset user progress (CAUTION):**
```javascript
await ctx.runMutation(api.scripts.seedStoryChapters.clearStoryProgress, {})
```

## Performance Considerations

- **AI Turn Execution**: Should complete within 2-3 seconds
- **Battle Initialization**: Should be under 1 second
- **Stage Completion**: Reward calculation should be instant
- **Chapter Loading**: Stage data should load within 500ms

## Accessibility Checklist

- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader announces game state changes
- [ ] Color contrast meets WCAG AA standards
- [ ] Text is readable at all zoom levels
- [ ] Controls are reachable on mobile devices

## Final Validation

After completing all tests, verify:
- [ ] Can complete a full chapter (all 10 stages)
- [ ] Progression unlocks next chapter correctly
- [ ] Rewards accumulate properly
- [ ] Player level increases with XP
- [ ] Badges are awarded correctly
- [ ] Can replay stages for better scores
- [ ] AI provides appropriate challenge at each difficulty
- [ ] No console errors during gameplay
- [ ] No visual glitches or UI breaks
- [ ] Performance is smooth (60fps on modern devices)

## Success Criteria

Story mode is fully functional when:
1. ✅ All 10 chapters are playable
2. ✅ All 100 stages are accessible through progression
3. ✅ AI opponents provide appropriate challenge
4. ✅ Rewards are calculated and awarded correctly
5. ✅ Progression unlocks work as intended
6. ✅ No critical bugs or game-breaking issues
7. ✅ Performance is acceptable across devices
8. ✅ UI is polished and user-friendly

## Next Steps After Testing

1. **Balance Adjustments**: Based on playtesting, adjust:
   - AI difficulty per stage
   - Reward amounts
   - Star thresholds
   - Unlock requirements

2. **Content Expansion**: Add:
   - More chapters (Acts 3-4)
   - Special event stages
   - Challenge modes

3. **Polish**: Improve:
   - Animations and transitions
   - Sound effects and music
   - Story text and lore
   - UI feedback and responsiveness

Good luck with testing! 🎮
