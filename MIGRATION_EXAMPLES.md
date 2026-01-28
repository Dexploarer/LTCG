# Migration Examples - Before & After

## Example 1: Simple Mutation (usePromoCode.ts)

### Before
```typescript
import { useAuth } from "@/components/ConvexAuthProvider";

export function usePromoCode() {
  const { token } = useAuth();
  const redeemMutation = useMutation(api.economy.redeemPromoCode);

  const redeemCode = async (code: string) => {
    if (!token) throw new Error("Not authenticated");
    const result = await redeemMutation({ token, code });
    return result;
  };
}
```

### After
```typescript
import { useAuth } from "../auth/useConvexAuthHook";

export function usePromoCode() {
  const { isAuthenticated } = useAuth();
  const redeemMutation = useMutation(api.economy.redeemPromoCode);

  const redeemCode = async (code: string) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    const result = await redeemMutation({ code });
    return result;
  };
}
```

**Changes:**
- Import path updated to relative path
- `token` → `isAuthenticated`
- Removed `token` from mutation args

---

## Example 2: Queries (useCurrency.ts)

### Before
```typescript
import { useAuth } from "@/components/ConvexAuthProvider";

export function useCurrency() {
  const { token } = useAuth();

  const balance = useQuery(
    api.economy.getPlayerBalance,
    token ? { token } : "skip"
  );

  const transactions = useQuery(
    api.economy.getTransactionHistory,
    token ? { token } : "skip"
  );
}
```

### After
```typescript
import { useAuth } from "../auth/useConvexAuthHook";

export function useCurrency() {
  const { isAuthenticated } = useAuth();

  const balance = useQuery(
    api.economy.getPlayerBalance,
    isAuthenticated ? {} : "skip"
  );

  const transactions = useQuery(
    api.economy.getTransactionHistory,
    isAuthenticated ? {} : "skip"
  );
}
```

**Changes:**
- Import path updated
- `token` → `isAuthenticated`
- `token ? { token } : "skip"` → `isAuthenticated ? {} : "skip"`

---

## Example 3: Multiple Mutations (useShop.ts)

### Before
```typescript
const purchasePack = async (productId: string, useGems: boolean) => {
  if (!token) throw new Error("Not authenticated");
  const result = await purchasePackMutation({
    token,
    productId,
    useGems,
  });
  return result;
};
```

### After
```typescript
const purchasePack = async (productId: string, useGems: boolean) => {
  if (!isAuthenticated) throw new Error("Not authenticated");
  const result = await purchasePackMutation({
    productId,
    useGems,
  });
  return result;
};
```

**Changes:**
- Auth check: `!token` → `!isAuthenticated`
- Removed `token` from mutation args, kept other params

---

## Example 4: Nested Queries (useDeckBuilder.ts)

### Before
```typescript
const useDeck = (deckId: Id<"userDecks"> | null) => {
  return useQuery(
    api.decks.getDeckWithCards,
    token && deckId ? { token, deckId } : "skip"
  );
};
```

### After
```typescript
const useDeck = (deckId: Id<"userDecks"> | null) => {
  return useQuery(
    api.decks.getDeckWithCards,
    isAuthenticated && deckId ? { deckId } : "skip"
  );
};
```

**Changes:**
- Auth check: `token` → `isAuthenticated`
- Removed `token` from query args, kept `deckId`

---

## Example 5: UseEffect Dependencies (useGlobalChat.ts)

### Before
```typescript
useEffect(() => {
  if (!token) return;
  
  updatePresence();
  const interval = setInterval(updatePresence, 30000);
  
  return () => clearInterval(interval);
}, [token]);
```

### After
```typescript
useEffect(() => {
  if (!isAuthenticated) return;
  
  updatePresence();
  const interval = setInterval(updatePresence, 30000);
  
  return () => clearInterval(interval);
}, [isAuthenticated]);
```

**Changes:**
- Auth check: `!token` → `!isAuthenticated`
- Dependency: `[token]` → `[isAuthenticated]`

---

## Pattern Summary

### Query Patterns

**Token only:**
```typescript
// Before: token ? { token } : "skip"
// After:  isAuthenticated ? {} : "skip"
```

**Token + other args:**
```typescript
// Before: token ? { token, arg1, arg2 } : "skip"
// After:  isAuthenticated ? { arg1, arg2 } : "skip"
```

**Multiple conditions:**
```typescript
// Before: token && otherId ? { token, otherId } : "skip"
// After:  isAuthenticated && otherId ? { otherId } : "skip"
```

### Mutation Patterns

**Token only:**
```typescript
// Before: await mutation({ token })
// After:  await mutation({})
```

**Token + args:**
```typescript
// Before: await mutation({ token, arg1, arg2 })
// After:  await mutation({ arg1, arg2 })
```

### Auth Check Patterns

```typescript
// Before: if (!token) throw new Error(...)
// After:  if (!isAuthenticated) throw new Error(...)

// Before: if (!token) return;
// After:  if (!isAuthenticated) return;

// Before: token ? doSomething() : skip()
// After:  isAuthenticated ? doSomething() : skip()
```
