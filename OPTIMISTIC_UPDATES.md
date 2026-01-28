# Optimistic Updates Implementation

## Overview

Optimistic updates provide instant visual feedback for player actions, making the game feel responsive even with network latency. When a player performs an action, the UI updates immediately before the server confirms, creating a smooth, lag-free experience.

## Implemented Optimistic Updates

### 1. Normal Summon ⚡
**Location**: `useGameBoard.ts:101-122`

**What happens instantly:**
- Card disappears from hand
- Card appears on board in selected position (attack/defense)
- Board visual updates immediately

**Rollback scenario:** If summon fails (e.g., no normal summon remaining), the card returns to hand.

```typescript
normalSummonMutation.withOptimisticUpdate((localStore, args) => {
  // Remove from hand, add to board
  const newHand = currentState.myHand.filter(id => id !== args.cardId);
  const newBoardCard = { cardId: args.cardId, position: args.position === "attack" ? 1 : -1 };
  localStore.setQuery(..., { ...currentState, myHand: newHand, myBoard: [...currentState.myBoard, newBoardCard] });
});
```

### 2. Set Monster ⚡
**Location**: `useGameBoard.ts:124-143`

**What happens instantly:**
- Card disappears from hand
- Face-down card appears on board
- Board visual updates immediately

**Rollback scenario:** If set fails, card returns to hand.

### 3. Phase Advancement ⚡
**Location**: `useGameBoard.ts:148-162`

**What happens instantly:**
- Phase bar updates to next phase
- Phase indicator changes color
- Available actions update

**Phase sequence:** Draw → Standby → Main1 → Battle Start → Battle → Battle End → Main2 → End

**Rollback scenario:** If phase advance is invalid, phase remains unchanged.

### 4. End Turn ⚡
**Location**: `useGameBoard.ts:164-177`

**What happens instantly:**
- Turn indicator switches to opponent
- Phase resets to Draw phase
- Turn counter increments
- "Your Turn" / "Opponent's Turn" badge updates

**Rollback scenario:** If end turn fails, turn state reverts.

### 5. Attack Declaration ⚡
**Location**: `useGameBoard.ts:181-196`

**What happens instantly:**
- Attacking monster marked as "has attacked"
- Monster visual state changes (grayed out)
- Attack animation triggers immediately

**Rollback scenario:** If attack is invalid, monster returns to attackable state.

## How Optimistic Updates Work

### Flow Diagram
```
Player Action → Optimistic UI Update → Server Mutation → Server Response
                      ↓                                          ↓
                 Instant Feedback                      Confirm or Rollback
```

### Example: Normal Summon Flow
1. **Player clicks "Summon in Attack Position"**
2. **Optimistic Update (0ms)**: Card moves from hand to board instantly
3. **Server Mutation (50-200ms)**: Request sent to Convex
4. **Server Validation**: Checks turn, phase, normal summon count, tributes
5. **Response**:
   - ✅ **Success**: Optimistic state matches server state, no visible change
   - ❌ **Failure**: Optimistic state rolls back, card returns to hand, error shown

## Benefits

### 1. **Zero Perceived Latency**
Players see their actions immediately, making the game feel instant even with 100-200ms network latency.

### 2. **Smoother Gameplay**
No waiting for server confirmation between actions. Players can chain actions quickly:
- Summon → Set Spell/Trap → Advance Phase → Attack → End Turn
- All happen instantly with smooth transitions

### 3. **Better User Experience**
Matches the feel of local games rather than slow turn-based network games.

### 4. **Automatic Rollback**
If server rejects the action, Convex automatically rolls back the optimistic update and shows the error.

## Limitations & Edge Cases

### 1. **Complex Game State Dependencies**
Some actions depend on hidden information (opponent's hand, face-down cards). These can't be fully optimistic.

**Example**: Activating a trap that negates an attack - opponent won't see the trap until server confirms.

### 2. **Card Effect Chains**
Complex card effects that modify game state can't be fully predicted client-side.

**Solution**: Show generic "Resolving effect..." state for complex chains.

### 3. **Race Conditions**
If both players act simultaneously, one may see their optimistic update rolled back.

**Example**:
- Player 1: Optimistically attacks
- Player 2: Activates Mirror Force (destroys all attack position monsters)
- Server resolves: Player 1's attack is negated, their optimistic update rolls back

## Testing Optimistic Updates

### Visual Test Checklist
- [ ] Normal summon shows card moving instantly
- [ ] Set monster shows face-down card instantly
- [ ] Phase bar updates without delay
- [ ] Turn indicator switches immediately on end turn
- [ ] Attack animation starts before server confirms
- [ ] Failed actions roll back smoothly
- [ ] Error messages show when rollback occurs

### Network Simulation
Test with throttled network (Chrome DevTools → Network → Slow 3G):
1. Perform rapid actions (summon, set, attack)
2. Verify UI updates instantly despite latency
3. Verify server eventually confirms or rolls back
4. Check for visual glitches during rollback

## Performance Impact

**Client-side overhead**: Minimal (~5-10ms per optimistic update)
**Memory usage**: Negligible (shallow copies of game state)
**Network traffic**: No change (same mutations sent)

## Future Enhancements

### Potential Additions
1. **Spell/Trap Activation**: Optimistically show activation animation
2. **Position Changes**: Optimistically switch attack/defense position
3. **Tribute Animations**: Show tribute cards being sent to graveyard instantly
4. **Draw Cards**: Optimistically show card backs being drawn (real cards revealed on server confirm)

### Advanced Features
1. **Optimistic Animation Queue**: Chain multiple animations smoothly
2. **Predictive AI Responses**: Show predicted opponent reactions (ghosted/tentative)
3. **Undo Buffer**: Allow players to undo actions before server confirms

## Implementation Notes

### Convex Best Practices
✅ All optimistic updates are synchronous (no async in optimistic update handlers)
✅ Updates only modify local query cache, not database
✅ Automatic rollback on mutation failure
✅ Type-safe with full TypeScript support

### Code Organization
- All optimistic updates defined in `useGameBoard.ts`
- Mutations wrapped with `.withOptimisticUpdate()`
- Query cache updated via `localStore.setQuery()`
- Rollback handled automatically by Convex

## Debugging

### Enable Verbose Logging
```typescript
// Add to optimistic update handlers
console.log('[OPTIMISTIC]', action, args);
```

### Common Issues
1. **Update doesn't show**: Check if query is loaded in `localStore.getQuery()`
2. **Flicker on rollback**: Server state differs from optimistic state
3. **Multiple updates**: Ensure `setQuery` is called once per update

## Sources
- [Convex Optimistic Updates Documentation](https://docs.convex.dev/client/react/optimistic-updates)
- [Building Fast Multiplayer Games](https://dev.to/efekrskl/building-a-multiplayer-game-with-convex-over-a-weekend-1o59)
