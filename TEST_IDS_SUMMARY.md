# Test IDs Added - Quest and Achievement Components

## Summary

Successfully added test IDs to quest, achievement, and player rank components across the codebase.

## Files Modified

### 1. `/apps/web/app/(app)/quests/page.tsx`

**Test IDs added:**
- `data-testid="player-rank"` - Player level/rank display (line 57)
- `data-testid="quests-list"` - Quests list container (line 174)
- `data-testid="quest-progress"` - Quest progress bars/indicators (line 208)
- `data-testid="achievement"` - Individual achievement items (line 337)
- `data-testid="achievement-progress"` - Achievement progress displays (line 382)
- `data-testid="achievement-reward"` - Achievement reward displays (line 395)

### 2. `/apps/web/app/(app)/lunchtable/components/profile/ProfileHeader.tsx`

**Test IDs added:**
- `data-testid="player-rank"` - Player ranked tier display (line 59)

### 3. `/apps/web/app/(app)/lunchtable/components/profile/StatsTab.tsx`

**Test IDs added:**
- `data-testid="player-stats"` - Player stats grid (line 28)
- `data-testid="player-wins"` - Player wins stat (line 33)
- `data-testid="win-count"` - Win count number (line 34)
- `data-testid="player-badges"` - Badges/achievements section (line 70)
- `data-testid="achievement"` - Individual achievement items (line 84)
- `data-testid="achievement-progress"` - Achievement progress bars (line 102)

### 4. `/apps/web/app/(app)/lunchtable/components/profile/BadgesTab.tsx`

**Test IDs added:**
- `data-testid="achievement"` - Individual badge/achievement items (line 39)

### 5. `/apps/web/src/components/notifications/NotificationToast.tsx`

**Test IDs added:**
- `data-testid="achievement-reward"` - Achievement reward displays in toast notifications (line 46)

## Test ID Coverage

All requested test IDs have been implemented:

✅ `data-testid="quests-list"` - Quests list container
✅ `data-testid="quest-progress"` - Quest progress bars/indicators
✅ `data-testid="achievement"` - Individual achievement items (multiple locations)
✅ `data-testid="achievement-progress"` - Achievement progress displays (multiple locations)
✅ `data-testid="achievement-reward"` - Achievement reward displays (multiple locations)
✅ `data-testid="player-rank"` - Player rank/level displays (multiple locations)

## Additional Test IDs Added

For improved test coverage, the following bonus test IDs were also added:

- `data-testid="player-stats"` - Overall player stats container
- `data-testid="player-wins"` - Player wins stat card
- `data-testid="win-count"` - Win count value
- `data-testid="player-badges"` - Badges section container

## Usage in Tests

Example usage in E2E tests:

```typescript
// Quests
await page.getByTestId('quests-list').isVisible();
await page.getByTestId('quest-progress').first().isVisible();

// Achievements
const achievements = page.getByTestId('achievement');
await expect(achievements).toHaveCount(10);
await page.getByTestId('achievement-progress').first().isVisible();
await page.getByTestId('achievement-reward').first().isVisible();

// Player Rank
await page.getByTestId('player-rank').isVisible();
await expect(page.getByTestId('player-rank')).toContainText('Level');
```

## Notes

- Test IDs follow the kebab-case naming convention
- Multiple components may have the same test ID (e.g., "achievement" appears in multiple locations)
- All test IDs are semantic and descriptive
- Test IDs are added to the appropriate container elements for reliable selection

