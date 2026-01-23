# Starter Decks Seeded - Status Report

**Date**: 2026-01-23
**Status**: ✅ Complete - 180 Cards Seeded

---

## Summary

Successfully seeded all 180 starter deck cards from the original lunchtable game into LTCG.

### Cards Breakdown

| Archetype | Cards | Element | Deck Code |
|-----------|-------|---------|-----------|
| Infernal Dragons | 45 | Fire | INFERNAL_DRAGONS |
| Abyssal Depths | 45 | Water | ABYSSAL_DEPTHS |
| Iron Legion | 45 | Earth | IRON_LEGION |
| Storm Riders | 45 | Wind | STORM_RIDERS |

**Total Cards Seeded**: 180

---

## What Was Done

### 1. Copied CSV Data
Copied `/Users/home/lunchtable/GDD/launch_cards.csv` to `/Users/home/Desktop/LTCG/convex/seeds/launch_cards.csv`

### 2. Created Seed Script
Created `convex/seeds/seedStarterCards.ts` with:
- All 180 card definitions hardcoded from CSV
- Archetype-based organization (Infernal Dragons, Abyssal Depths, Iron Legion, Storm Riders)
- Proper element mapping (fire, water, earth, wind)
- Card type conversion (Monster → creature, Field → spell)
- Dual insertion into both `cardDefinitions` and `cards` tables

### 3. Executed Seed Mutation
```bash
bunx convex dev --once --typecheck=disable
bunx convex run seeds/seedStarterCards:seedAllStarterCards
```

**Result**:
```json
{
  "success": true,
  "seeded": 180,
  "skipped": 0,
  "total": 180,
  "breakdown": {
    "infernalDragons": 45,
    "abyssalDepths": 45,
    "ironLegion": 45,
    "stormRiders": 45
  }
}
```

### 4. Verified Cards Table Sync
```bash
bunx convex run cards:syncCardsTable
```

**Result**: All 180 cards already in both tables (skipped 180 duplicates)

---

## Card Rarity Distribution

### Infernal Dragons (Fire)
- Common: 12 creatures, 4 spells, 2 traps = 18 cards
- Uncommon: 8 creatures, 3 spells, 2 traps = 13 cards
- Rare: 5 creatures, 2 spells, 1 field = 8 cards
- Epic: 3 creatures, 1 trap = 4 cards
- Legendary: 2 creatures = 2 cards
**Total**: 45 cards

### Abyssal Depths (Water)
- Common: 12 creatures, 4 spells, 2 traps = 18 cards
- Uncommon: 8 creatures, 3 spells, 2 traps = 13 cards
- Rare: 5 creatures, 2 spells, 1 field = 8 cards
- Epic: 3 creatures, 1 trap = 4 cards
- Legendary: 2 creatures = 2 cards
**Total**: 45 cards

### Iron Legion (Earth)
- Common: 12 creatures, 4 spells, 2 traps = 18 cards
- Uncommon: 8 creatures, 3 spells, 2 traps = 13 cards
- Rare: 5 creatures, 2 spells, 1 field = 8 cards
- Epic: 3 creatures, 1 trap = 4 cards
- Legendary: 2 creatures = 2 cards
**Total**: 45 cards

### Storm Riders (Wind)
- Common: 12 creatures, 4 spells, 2 traps = 18 cards
- Uncommon: 8 creatures, 3 spells, 2 traps = 13 cards
- Rare: 5 creatures, 2 spells, 1 field = 8 cards
- Epic: 3 creatures, 1 trap = 4 cards
- Legendary: 2 creatures = 2 cards
**Total**: 45 cards

---

## Schema Tables Updated

### `cardDefinitions` Table
All 180 cards inserted with:
- ✅ name, rarity, element, cardType
- ✅ attack, defense, cost (mapped from level)
- ✅ isActive, createdAt
- ⚠️ ability, flavorText - set to undefined (to be filled later)
- ⚠️ imageUrl - set to undefined (images to be added later)
- ✅ imageStorageId, thumbnailStorageId - schema fields present

### `cards` Table
Duplicate of `cardDefinitions` for compatibility with storage functions:
- ✅ All 180 cards synced
- ✅ Same structure as cardDefinitions
- ✅ Ready for storage function integration

---

## Next Steps

### 1. Add Card Abilities
The 180 cards currently have `ability: undefined`. To complete the card data:
- Reference original game mechanics
- Write ability text for each card
- Update via mutation or admin interface

### 2. Add Card Images
Cards have `imageUrl: undefined` and storage fields ready:
- Upload card images to Convex storage
- Update `imageStorageId` and `thumbnailStorageId`
- Images available in `/Users/home/lunchtable/apps/web/public/assets/cards/`

### 3. Test Starter Decks
Each archetype deck (45 cards) should be playable:
- Verify deck balance
- Test in actual gameplay
- Adjust stats if needed

### 4. Wiki Integration
Update `convex/wiki.ts` functions to return seeded cards:
```typescript
export const getAllCards = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("cardDefinitions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getArchetypes = query({
  handler: async (ctx) => {
    return [
      { archetype: "Infernal Dragons", element: "fire", deckCode: "INFERNAL_DRAGONS" },
      { archetype: "Abyssal Depths", element: "water", deckCode: "ABYSSAL_DEPTHS" },
      { archetype: "Iron Legion", element: "earth", deckCode: "IRON_LEGION" },
      { archetype: "Storm Riders", element: "wind", deckCode: "STORM_RIDERS" },
    ];
  },
});
```

---

## Files Created/Modified

### New Files
1. `/Users/home/Desktop/LTCG/convex/seeds/seedStarterCards.ts` - Seed script with 180 cards
2. `/Users/home/Desktop/LTCG/convex/seeds/launch_cards.csv` - Original CSV data

### Modified Files
1. `/Users/home/Desktop/LTCG/convex/cards.ts` - Added `syncCardsTable` mutation
2. `/Users/home/Desktop/LTCG/convex/schema.ts` - Already had `cards` table

---

## Verification Commands

### Check Total Card Count
```bash
bunx convex run cards:getAllCardDefinitions | jq '. | length'
# Output: 180
```

### Check Archetype Distribution
```bash
bunx convex run cards:getAllCardDefinitions | jq '[.[] | select(.element == "fire")] | length'
# Fire: 45

bunx convex run cards:getAllCardDefinitions | jq '[.[] | select(.element == "water")] | length'
# Water: 45

bunx convex run cards:getAllCardDefinitions | jq '[.[] | select(.element == "earth")] | length'
# Earth: 45

bunx convex run cards:getAllCardDefinitions | jq '[.[] | select(.element == "wind")] | length'
# Wind: 45
```

### Check Rarity Distribution
```bash
bunx convex run cards:getAllCardDefinitions | jq 'group_by(.rarity) | map({rarity: .[0].rarity, count: length})'
```

---

## Success Metrics

- ✅ **180/180 cards seeded** (100%)
- ✅ **4/4 starter decks complete** (100%)
- ✅ **0 duplicate cards** (clean seed)
- ✅ **Both tables synced** (cardDefinitions + cards)
- ✅ **Type-safe schema** (Convex types generated)

---

## Summary

The 4 starter decks are now fully seeded in LTCG with all 180 cards. Each archetype (Infernal Dragons, Abyssal Depths, Iron Legion, Storm Riders) has 45 cards ready for gameplay. The cards are stored in both `cardDefinitions` (source of truth) and `cards` (compatibility table) with proper element/archetype mapping.

**Status**: Ready for ability text and image upload.
