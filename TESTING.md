# Testing Guide - Global Chat

## Quick Start

```bash
# Install test dependencies
bun install convex-test vitest --save-dev

# Run tests
bun test convex/globalChat.test.ts

# Run tests in watch mode
bun test --watch convex/globalChat.test.ts
```

## What These Tests Do

These tests are designed to **EXPOSE BUGS**, not just pass. They test:

1. **Critical Bugs** - Will cause crashes or allow exploits
2. **Race Conditions** - Concurrent operations that break assumptions
3. **Edge Cases** - Unusual inputs that reveal validation gaps
4. **DoS Vectors** - Inputs that waste server resources

## Expected Results

**Most tests WILL FAIL** because they expose real bugs in the code. This is intentional.

### Test Results Summary

| Test Category | Expected Status | Reason |
|---------------|----------------|---------|
| System Message ID | ❌ FAIL | Invalid user ID type cast |
| Rate Limit Race | ❌ FAIL | Concurrent sends bypass rate limit |
| Content Validation | ❌ FAIL | Accepts huge payloads before rejecting |
| Presence Duplication | ❌ FAIL | `.unique()` crashes on duplicates |
| Query Parameter Validation | ❌ FAIL | No bounds checking on `limit` |
| Edge Cases | ⚠️ UNDEFINED | Behavior varies |

## How to Use These Tests

### Step 1: Run Tests to See Failures

```bash
bun test convex/globalChat.test.ts
```

You'll see output like:
```
❌ FAIL: should FAIL - system user ID 'system' is not a valid Convex ID
❌ FAIL: should FAIL - concurrent sends bypass rate limit
   BUG EXPOSED: 2 of 2 messages succeeded (expected 1)
❌ FAIL: should FAIL - concurrent presence updates create duplicates
   BUG EXPOSED: 3 presence records for one user
```

### Step 2: Fix the Bugs

See [CODE_REVIEW.md](./CODE_REVIEW.md) for detailed bug descriptions and fixes.

### Step 3: Re-run Tests

After fixing, tests should pass:
```
✓ System messages use valid user ID
✓ Rate limiting blocks concurrent sends
✓ Only one presence record per user
```

## Test Categories

### 1. Critical Security Tests

**What they test:** Exploits that allow spam, DoS, or data corruption

**Files tested:**
- `/Users/home/Desktop/LTCG/convex/globalChat.ts`
- `/Users/home/Desktop/LTCG/convex/lib/auth.ts`

**Examples:**
```typescript
// Test: Race condition in rate limiting
test("concurrent sends bypass rate limit", async () => {
  // Send 2 messages at exact same time
  // Expected: 1 succeeds
  // Actual: 2 succeed (BUG!)
});
```

### 2. Data Integrity Tests

**What they test:** Database consistency and constraint violations

**Examples:**
```typescript
// Test: Presence record duplication
test("user can have multiple presence records", async () => {
  // Create 3 presence records for same user
  // Expected: Error or upsert
  // Actual: 3 records exist (BUG!)
});
```

### 3. Input Validation Tests

**What they test:** Malformed, missing, or extreme inputs

**Examples:**
```typescript
// Test: Negative limit parameter
test("negative limit crashes query", async () => {
  const messages = await getRecentMessages({ limit: -1 });
  // Expected: Error or clamped to 0
  // Actual: Crash (BUG!)
});
```

### 4. Concurrency Tests

**What they test:** Race conditions and timing issues

**Examples:**
```typescript
// Test: Presence updates
test("rapid presence updates cause duplicates", async () => {
  // Call updatePresence 5 times in parallel
  // Expected: 1 record, updated 5 times
  // Actual: 5 separate records (BUG!)
});
```

## Writing More Tests

### Test Template

```typescript
describe("Feature Name", () => {
  test("should FAIL - describe the bug", async () => {
    const t = convexTest(schema);

    // Setup: Create test data
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { /* ... */ });
    });

    // Execute: Trigger the bug
    const result = await t.run(async (ctx) => {
      return await ctx.runMutation(api.globalChat.sendMessage, {
        /* ... */
      });
    });

    // Assert: Verify bug exists
    expect(result).toBe(expectedValue);
  });
});
```

### Best Practices

1. **Name tests to describe bugs:** `"should FAIL - concurrent sends bypass rate limit"`
2. **Log when bugs are exposed:** `console.log(\`BUG EXPOSED: \${count} records\`)`
3. **Test the happy path AND the exploit:** Test both normal use and abuse
4. **Use realistic data:** Don't test with user ID "1", use actual Convex IDs
5. **Test boundaries:** -1, 0, 1, max, max+1

## Common Testing Patterns

### Testing Mutations

```typescript
await t.run(async (ctx) => {
  const messageId = await ctx.runMutation(api.globalChat.sendMessage, {
    token: "valid-token",
    content: "Test message",
  });
  expect(messageId).toBeDefined();
});
```

### Testing Queries

```typescript
await t.run(async (ctx) => {
  const messages = await ctx.runQuery(api.globalChat.getRecentMessages, {
    limit: 50,
  });
  expect(Array.isArray(messages)).toBe(true);
});
```

### Testing Race Conditions

```typescript
// Run multiple operations in parallel
const results = await Promise.allSettled([
  t.run(async (ctx) => await ctx.runMutation(/* ... */))),
  t.run(async (ctx) => await ctx.runMutation(/* ... */))),
  t.run(async (ctx) => await ctx.runMutation(/* ... */))),
]);

// Check how many succeeded
const successes = results.filter(r => r.status === "fulfilled");
expect(successes.length).toBe(1); // Should only allow one
```

### Testing Error Cases

```typescript
await expect(async () => {
  await t.run(async (ctx) => {
    await ctx.runMutation(api.globalChat.sendMessage, {
      token: "invalid",
      content: "",
    });
  });
}).rejects.toThrow(/cannot be empty/i);
```

## Debugging Failed Tests

### 1. Read the test output carefully

```
❌ FAIL: should FAIL - concurrent sends bypass rate limit
   BUG EXPOSED: 2 of 2 messages succeeded (expected 1)
```

This tells you:
- **What failed:** Rate limit bypass
- **How many:** 2 messages (should be 1)
- **Root cause:** Check rate limiting code in globalChat.ts lines 180-191

### 2. Check CODE_REVIEW.md

Each bug has a detailed explanation:
- Why it's broken
- How to exploit it
- How to fix it

### 3. Add console.logs to mutations

```typescript
console.log("Rate limit check:", { lastMessage, timeSince, limit: RATE_LIMIT_MS });
```

### 4. Use Convex Dashboard

The convex-test runs against a real (local) backend, so you can:
- View database state after failed tests
- Check for orphaned records
- Verify indexes are used correctly

## CI/CD Integration

### GitHub Actions

```yaml
name: Test Convex Functions

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test convex/globalChat.test.ts
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

bun test convex/globalChat.test.ts --run
if [ $? -ne 0 ]; then
  echo "Tests failed. Fix bugs before committing."
  exit 1
fi
```

## Resources

- [Convex Testing Docs](https://docs.convex.dev/testing/convex-test)
- [Testing Patterns](https://stack.convex.dev/testing-patterns)
- [Vitest Docs](https://vitest.dev/)
- [convex-test on npm](https://www.npmjs.com/package/convex-test)
- [Convex Test GitHub](https://github.com/get-convex/convex-test)

## Next Steps

1. Run tests: `bun test convex/globalChat.test.ts`
2. Review failures in CODE_REVIEW.md
3. Fix bugs one by one
4. Re-run tests until all pass
5. Add more tests for new features

**Remember:** Tests that fail are valuable! They expose bugs before users do.
