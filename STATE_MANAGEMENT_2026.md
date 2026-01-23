# State Management - 2026 Best Practices ✅

## Overview

This project follows 2026 best practices for state management using the modern React + TypeScript ecosystem.

## Stack

### 1. **Zustand 5.0** - Global Client State
- **Why**: Lightweight, TypeScript-native, no boilerplate
- **When to use**: Cross-component state, temporary auth flows, UI state
- **File**: [src/stores/authStore.ts](src/stores/authStore.ts)

### 2. **TanStack Query 5.0** - Server State
- **Why**: Industry standard for server state, caching, and data fetching
- **When to use**: REST API calls, data synchronization, background refetching
- **Status**: Installed but not yet used (Convex handles server state)

### 3. **Convex React Hooks** - Real-time Database State
- **Why**: Real-time sync, optimistic updates, built-in caching
- **When to use**: Database queries, mutations, real-time subscriptions
- **Hooks**: `useQuery`, `useMutation`, `useAction`

## State Management Hierarchy

```
┌─────────────────────────────────────────────┐
│ 1. Local Component State (useState)        │
│    - Form inputs, UI toggles, loading      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. Zustand Stores (Global Client State)    │
│    - Auth flow, sidebar state, modals      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. Convex Hooks (Database State)           │
│    - User data, game state, messages       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. TanStack Query (External APIs)          │
│    - Future: External REST APIs, web3      │
└─────────────────────────────────────────────┘
```

## Zustand Store Pattern

### File Structure
```
src/stores/
├── authStore.ts        # Auth flow state
├── uiStore.ts          # UI state (future)
├── gameStore.ts        # Game state (future)
└── index.ts            # Barrel exports
```

### Store Template

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreInterface {
  // State
  value: string;
  count: number;

  // Actions
  setValue: (value: string) => void;
  increment: () => void;
  reset: () => void;
}

export const useStore = create<StoreInterface>()(
  persist(
    (set, get) => ({
      // Initial state
      value: '',
      count: 0,

      // Actions
      setValue: (value: string) => set({ value }),
      increment: () => set((state) => ({ count: state.count + 1 })),
      reset: () => set({ value: '', count: 0 }),
    }),
    {
      name: 'store-name',
      // Only persist what's needed
      partialize: (state) => ({
        value: state.value,
      }),
    }
  )
);
```

## Current Stores

### 1. Auth Store ([src/stores/authStore.ts](src/stores/authStore.ts))

**Purpose**: Manage temporary auth state during signup → onboarding flow

**State**:
- `pendingUsername`: Username from signup
- `pendingPassword`: Password for wallet encryption

**Actions**:
- `setPendingCredentials(username, password)`: Store credentials after signup
- `clearPendingCredentials()`: Clear after onboarding complete
- `hasPendingCredentials()`: Check if credentials exist

**Persistence**: localStorage (via Zustand persist middleware)

**Usage Example**:
```typescript
// In signup form
const setPendingCredentials = useAuthStore((state) => state.setPendingCredentials);
setPendingCredentials(username, password);

// In onboarding page
const { pendingUsername, pendingPassword, clearPendingCredentials } = useAuthStore();
await completeOnboarding({ username: pendingUsername, password: pendingPassword });
clearPendingCredentials();
```

## Best Practices

### ✅ DO

1. **Use Zustand for cross-component client state**
   - Auth flows, modals, sidebars, theme preferences
   - Temporary state that needs to persist across pages

2. **Use Convex hooks for database operations**
   - User data, game state, messages, real-time sync
   - Leverage Convex's built-in caching and optimistic updates

3. **Use TanStack Query for external REST APIs**
   - Third-party APIs, web3 providers, external services
   - When you need advanced caching, polling, or retry logic

4. **Use React useState for local component state**
   - Form inputs, loading states, UI toggles
   - State that doesn't need to leave the component

5. **Use persist middleware selectively**
   - Only persist what's needed (auth tokens, preferences)
   - Don't persist everything (performance + storage limits)

6. **Use TypeScript for type safety**
   - Define interfaces for all stores
   - Use generics for reusable patterns

### ❌ DON'T

1. **Don't use sessionStorage/localStorage directly**
   - Use Zustand with persist middleware instead
   - Better DX, type safety, and reactivity

2. **Don't over-engineer with Redux**
   - Zustand is simpler and sufficient for most apps
   - Redux is overkill unless you need advanced middleware

3. **Don't mix state management approaches**
   - Stick to the hierarchy: useState → Zustand → Convex → TanStack Query
   - Consistency makes code easier to maintain

4. **Don't put derived state in stores**
   - Use selectors or computed properties instead
   - Keep stores minimal and normalized

5. **Don't forget to clean up**
   - Clear temporary state after use (auth flows, modals)
   - Prevent memory leaks and stale data

## Migration from Old Patterns

### Before (2024 - sessionStorage hack):
```typescript
// Signup form
sessionStorage.setItem('pendingUsername', username);
sessionStorage.setItem('pendingPassword', password);

// Onboarding page
const username = sessionStorage.getItem('pendingUsername');
const password = sessionStorage.getItem('pendingPassword');
sessionStorage.removeItem('pendingUsername');
sessionStorage.removeItem('pendingPassword');
```

### After (2026 - Zustand store):
```typescript
// Signup form
const setPendingCredentials = useAuthStore((state) => state.setPendingCredentials);
setPendingCredentials(username, password);

// Onboarding page
const { pendingUsername, pendingPassword, clearPendingCredentials } = useAuthStore();
// Use credentials
clearPendingCredentials();
```

**Benefits**:
- ✅ Type-safe
- ✅ Reactive (auto re-renders)
- ✅ DevTools support
- ✅ Cleaner API
- ✅ Better testing

## Performance Considerations

### Selector Pattern (Prevent Unnecessary Re-renders)

```typescript
// ❌ Bad: Component re-renders on any store change
const store = useAuthStore();

// ✅ Good: Only re-renders when pendingUsername changes
const pendingUsername = useAuthStore((state) => state.pendingUsername);

// ✅ Good: Multiple selectors
const { setPendingCredentials, clearPendingCredentials } = useAuthStore((state) => ({
  setPendingCredentials: state.setPendingCredentials,
  clearPendingCredentials: state.clearPendingCredentials,
}));
```

### Shallow Equality (Advanced)

```typescript
import { shallow } from 'zustand/shallow';

// Only re-renders if both values change
const { pendingUsername, pendingPassword } = useAuthStore(
  (state) => ({
    pendingUsername: state.pendingUsername,
    pendingPassword: state.pendingPassword,
  }),
  shallow
);
```

## Testing

### Mock Zustand Store in Tests

```typescript
import { useAuthStore } from '@/stores/authStore';

// Mock the store
jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// In test
(useAuthStore as jest.Mock).mockReturnValue({
  pendingUsername: 'testuser',
  pendingPassword: 'password123',
  setPendingCredentials: jest.fn(),
  clearPendingCredentials: jest.fn(),
  hasPendingCredentials: () => true,
});
```

## DevTools

### Zustand DevTools

```typescript
import { devtools } from 'zustand/middleware';

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Store implementation
      }),
      { name: 'auth-storage' }
    ),
    { name: 'AuthStore' }
  )
);
```

**Usage**: Install Redux DevTools extension in browser

## Resources

- **Zustand Docs**: https://zustand.docs.pmnd.rs/
- **TanStack Query Docs**: https://tanstack.com/query/latest
- **Convex React Docs**: https://docs.convex.dev/client/react

---

**Status**: ✅ Implemented
**Last Updated**: 2026-01-22
**Current Stores**: 1 (authStore)
**Next**: Create uiStore for sidebar/modal state
