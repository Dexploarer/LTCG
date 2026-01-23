# Binder Page Backend Implementation Plan

## Executive Summary

The binder page at `/apps/web/app/(app)/binder/page.tsx` has two main sections:
1. **Collection Tab** - Fully functional with complete backend support ✅
2. **Deck Builder Tab** - Currently using mock data with NO backend persistence ❌

This document outlines what backend functions are needed to make the Deck Builder fully functional.

---

## Current State Analysis

### Collection Tab - FULLY FUNCTIONAL ✅

**Frontend Features:**
- Display all owned cards with quantities
- Search/filter/sort cards
- Toggle favorites
- View detailed card information
- Grid/list view modes
- Collection statistics

**Backend Support (COMPLETE):**
- ✅ `api.cards.getUserCards` - Gets all user-owned cards with quantities
- ✅ `api.cards.getUserCollectionStats` - Gets collection statistics
- ✅ `api.cards.getUserFavoriteCards` - Gets favorite cards
- ✅ `api.cards.toggleFavorite` - Toggle favorite status on cards

**Schema Tables (COMPLETE):**
- ✅ `cardDefinitions` - Master card database
- ✅ `playerCards` - User card ownership with quantities
- ✅ Indexes: by_user, by_user_card, by_user_favorite

---

### Deck Builder Tab - MISSING BACKEND ❌

**Frontend Features (lines 1041-1361):**
- Create new decks with custom names
- Select and save a deck for editing
- Add/remove cards from deck
- View deck statistics (card count, avg cost, creature/spell count)
- Deck validation (30 cards required, max 3 copies per card, max 1 legendary)
- Rename decks
- Delete decks
- Save deck changes
- Clear deck contents
- Search cards while building
- View cards currently in deck

**Current Implementation:**
- Uses `MOCK_DECKS` constant for testing (line 70-85)
- All deck operations stored in local React state
- No persistence - decks lost on page refresh
- No backend queries or mutations called

**Missing Backend Support:**

#### 1. Schema Tables - NOT IMPLEMENTED ❌
No tables exist to store user decks. Need:
```typescript
// convex/schema.ts additions needed:

userDecks: defineTable({
  userId: v.id("users"),
  name: v.string(),
  description: v.optional(v.string()),
  deckArchetype: v.optional(v.union(
    v.literal("fire"),
    v.literal("water"),
    v.literal("earth"),
    v.literal("wind"),
    v.literal("neutral")
  )),
  isActive: v.boolean(), // for soft deletes
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_active", ["userId", "isActive"]),

deckCards: defineTable({
  deckId: v.id("userDecks"),
  cardDefinitionId: v.id("cardDefinitions"),
  quantity: v.number(), // 1-3 copies per card
  position: v.optional(v.number()), // for card ordering
})
  .index("by_deck", ["deckId"])
  .index("by_deck_card", ["deckId", "cardDefinitionId"]),
```

#### 2. Queries - NOT IMPLEMENTED ❌

**getUserDecks** (Priority: HIGH)
- Purpose: Load all decks for a user
- Args: `{ token: string }`
- Returns: Array of deck objects with metadata
- Used: When user opens Deck Builder tab
- Location: Should be in `convex/decks.ts`

**getDeckWithCards** (Priority: HIGH)
- Purpose: Load a specific deck with all its cards
- Args: `{ token: string, deckId: Id<"userDecks"> }`
- Returns: Deck object with full card list
- Used: When user selects a deck to edit
- Location: Should be in `convex/decks.ts`

**getDeckStats** (Priority: MEDIUM)
- Purpose: Calculate deck statistics
- Args: `{ deckId: Id<"userDecks"> }`
- Returns: Element distribution, rarity counts, avg cost, etc.
- Used: Display deck statistics panel
- Location: Should be in `convex/decks.ts`

**validateDeck** (Priority: MEDIUM)
- Purpose: Check if deck meets game rules
- Args: `{ deckId: Id<"userDecks"> }`
- Returns: Validation result with errors
- Used: Before saving deck or entering match
- Location: Should be in `convex/decks.ts`

#### 3. Mutations - NOT IMPLEMENTED ❌

**createDeck** (Priority: HIGH)
- Purpose: Create a new empty deck
- Args: `{ token: string, name: string, description?: string }`
- Returns: `{ deckId: Id<"userDecks"> }`
- Used: When user clicks "Create New Deck"
- Validation: Check name length, user deck limit (max 50?)
- Location: Should be in `convex/decks.ts`

**saveDeck** (Priority: HIGH)
- Purpose: Save/update deck card list
- Args: `{ token: string, deckId: Id<"userDecks">, cards: Array<{ cardDefinitionId, quantity }> }`
- Returns: `{ success: boolean }`
- Used: When user clicks "Save" button
- Validation:
  - Check user owns all cards in required quantities
  - Validate card counts (30 cards exactly)
  - Enforce max copies per card (3 normal, 1 legendary)
- Location: Should be in `convex/decks.ts`

**renameDeck** (Priority: MEDIUM)
- Purpose: Update deck name
- Args: `{ token: string, deckId: Id<"userDecks">, newName: string }`
- Returns: `{ success: boolean }`
- Used: When user edits deck name
- Validation: Check name length, uniqueness
- Location: Should be in `convex/decks.ts`

**deleteDeck** (Priority: MEDIUM)
- Purpose: Delete a deck (soft delete)
- Args: `{ token: string, deckId: Id<"userDecks"> }`
- Returns: `{ success: boolean }`
- Used: When user clicks delete button
- Implementation: Set `isActive: false` instead of hard delete
- Location: Should be in `convex/decks.ts`

**duplicateDeck** (Priority: LOW)
- Purpose: Clone an existing deck
- Args: `{ token: string, sourceDeckId: Id<"userDecks">, newName: string }`
- Returns: `{ deckId: Id<"userDecks"> }`
- Used: Future feature for deck copying
- Location: Should be in `convex/decks.ts`

---

## Implementation Priority

### Phase 1: Core Deck CRUD (MUST HAVE)
1. Add schema tables: `userDecks`, `deckCards`
2. Implement `createDeck` mutation
3. Implement `getUserDecks` query
4. Implement `getDeckWithCards` query
5. Implement `saveDeck` mutation
6. Implement `deleteDeck` mutation
7. Implement `renameDeck` mutation

### Phase 2: Validation & Stats (SHOULD HAVE)
8. Implement `validateDeck` query with game rules
9. Implement `getDeckStats` query
10. Add validation in `saveDeck` for card ownership
11. Add deck card count validation (exactly 30)
12. Add max copies validation (3 per card, 1 per legendary)

### Phase 3: Enhanced Features (NICE TO HAVE)
13. Implement `duplicateDeck` mutation
14. Add deck export to shareable code
15. Add deck import from code
16. Add deck tagging/categorization
17. Add deck archetype detection

---

## Reusable Code Analysis

### Existing Authentication Pattern
All card queries use this pattern - can reuse:
```typescript
const session = await ctx.db
  .query("sessions")
  .withIndex("token", (q) => q.eq("token", args.token))
  .first();

if (!session || session.expiresAt < Date.now()) {
  throw new Error("Unauthorized");
}
```
Location: `convex/cards.ts:40-47, 92-99, etc.`
**Action: Extract to `convex/lib/auth.ts` helper function**

### Existing Card Join Pattern
Several queries join playerCards with cardDefinitions - can reuse:
```typescript
const cardsWithDefinitions = await Promise.all(
  playerCards.map(async (pc) => {
    const cardDef = await ctx.db.get(pc.cardDefinitionId);
    if (!cardDef || !cardDef.isActive) return null;
    return { /* merged data */ };
  })
);
```
Location: `convex/cards.ts:56-82`
**Action: Can reuse for `getDeckWithCards` query**

### Existing Validators
File: `convex/validators.ts` (need to check if any reusable validators exist)
**Action: Add deck validation helpers if needed**

---

## Database Indexes Required

### New Indexes for Query Performance:
```typescript
userDecks:
  - by_user: ["userId"] - fetch all user's decks
  - by_user_active: ["userId", "isActive"] - fetch active decks only
  - by_updated: ["updatedAt"] - sort by recent

deckCards:
  - by_deck: ["deckId"] - fetch all cards in a deck
  - by_deck_card: ["deckId", "cardDefinitionId"] - check if card exists in deck
```

---

## Testing Considerations

### Unit Tests Needed:
1. Test deck creation with valid/invalid names
2. Test deck ownership validation
3. Test card quantity validation
4. Test max copies per card enforcement
5. Test legendary card limit
6. Test deck save with insufficient owned cards
7. Test concurrent deck edits

### Integration Tests:
1. Create deck → Add cards → Save → Load → Verify
2. Test deck deletion (soft delete check)
3. Test deck rename
4. Test adding more cards than owned

---

## Frontend Changes Required

### File: `apps/web/app/(app)/binder/page.tsx`

**Replace Mock Data (lines 70-85):**
```typescript
// REMOVE:
const MOCK_DECKS: Deck[] = [...]

// REPLACE WITH:
const userDecks = useQuery(api.decks.getUserDecks, token ? { token } : "skip");
```

**Update Deck Operations:**
- Line 547: `handleCreateDeck` - Call `api.decks.createDeck`
- Line 564: `handleSelectDeck` - Call `api.decks.getDeckWithCards`
- Line 570: `handleSaveDeck` - Call `api.decks.saveDeck`
- Line 579: `handleDeleteDeck` - Call `api.decks.deleteDeck`
- Line 588: `handleRenameDeck` - Call `api.decks.renameDeck`

**Add Loading States:**
- Add loading indicators for deck operations
- Add error handling for failed saves
- Add success toast notifications

**Add Optimistic Updates:**
- Update local state immediately
- Revert on error
- Sync with server response

---

## API Interface Design

### File: `convex/decks.ts` (NEW FILE)

```typescript
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getUserFromToken } from "./lib/auth";

// Constants
const MAX_DECKS_PER_USER = 50;
const DECK_SIZE = 30;
const MAX_COPIES_PER_CARD = 3;
const MAX_LEGENDARY_COPIES = 1;

// Queries
export const getUserDecks = query({ /* ... */ });
export const getDeckWithCards = query({ /* ... */ });
export const getDeckStats = query({ /* ... */ });
export const validateDeck = query({ /* ... */ });

// Mutations
export const createDeck = mutation({ /* ... */ });
export const saveDeck = mutation({ /* ... */ });
export const renameDeck = mutation({ /* ... */ });
export const deleteDeck = mutation({ /* ... */ });
export const duplicateDeck = mutation({ /* ... */ });
```

---

## Migration Strategy

### Step 1: Add Schema (No Breaking Changes)
- Add `userDecks` and `deckCards` tables
- Deploy schema changes
- Tables start empty - no data migration needed

### Step 2: Implement Backend Functions
- Create `convex/decks.ts`
- Implement all queries and mutations
- Add validation logic
- Test in development

### Step 3: Update Frontend
- Update binder page to use real API
- Remove mock data
- Add error handling
- Test all deck operations

### Step 4: User Migration
- Existing users start with 0 decks
- Users create decks from scratch
- No data loss (no existing decks to migrate)

---

## Success Criteria

### Definition of Done:
- ✅ Users can create multiple decks
- ✅ Decks persist across sessions
- ✅ Users can add/remove cards from decks
- ✅ Deck validation enforces game rules
- ✅ Users can rename and delete decks
- ✅ Deck statistics calculate correctly
- ✅ Only owned cards can be added
- ✅ Card quantity limits enforced
- ✅ Fast loading (<500ms for typical deck)
- ✅ No race conditions on concurrent edits
- ✅ Graceful error handling

---

## Estimated Effort

### Backend Implementation:
- Schema changes: 30 minutes
- Auth helpers: 15 minutes
- Core CRUD operations: 2-3 hours
- Validation logic: 1-2 hours
- Testing: 1 hour
**Total Backend: ~5 hours**

### Frontend Integration:
- Remove mock data: 15 minutes
- Hook up API calls: 1 hour
- Add loading/error states: 1 hour
- Testing: 1 hour
**Total Frontend: ~3 hours**

### **Grand Total: ~8 hours**

---

## Open Questions

1. **Deck Limits**: Should there be a max number of decks per user? (Recommend: 50)
2. **Deck Size**: Currently hardcoded to 30. Will this change? (Current: 30 cards)
3. **Card Limits**: Max 3 copies per card, 1 for legendary? (Current rules, confirm)
4. **Deck Archetype**: Should decks enforce single-archetype or allow mixed? (Current: Mixed allowed)
5. **Deck Sharing**: Future feature to share deck codes? (Phase 3)
6. **Deck History**: Track deck change history? (Nice to have, not MVP)

---

## Next Steps

1. **Approve this plan** and clarify any open questions
2. **Add schema tables** to `convex/schema.ts`
3. **Create `convex/decks.ts`** with all functions
4. **Update frontend** to remove mock data and use real API
5. **Test thoroughly** with multiple scenarios
6. **Deploy** and monitor for issues

---

## Notes

- The collection tab is **fully functional** and requires no changes
- All infrastructure for card ownership already exists
- This is purely adding deck storage and CRUD operations
- No breaking changes to existing functionality
- Can be deployed incrementally (backend first, then frontend)
