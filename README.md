# LTCG - Clean Architecture Foundation

A modern, type-safe foundation for building scalable applications with:

- ⚡️ **Bun** - Fast all-in-one JavaScript runtime
- 🔍 **Zod v4** - TypeScript-first schema validation
- 🔄 **TanStack Query** - Powerful async state management
- 🧹 **Biome** - Fast linter and formatter (ESLint + Prettier replacement)
- ⚛️ **React 19** - Latest React with modern patterns
- 🔐 **Convex Auth** - Email/password authentication with user management
- 💰 **Solana Wallets** - Non-custodial wallet generation on signup (2026 pattern)

## Quick Start

```bash
# Install dependencies
bun install

# Start Convex backend
bunx convex dev

# Run linting and formatting
bun run check

# Auto-fix issues
bun run check:fix

# Type check
bun run typecheck
```

### Environment Variables

Create `.env.local`:
```bash
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

## Project Structure

```
LTCG/
├── convex/
│   ├── auth.ts            # Convex Auth configuration
│   ├── schema.ts          # Database schema (with authTables + Solana wallets)
│   ├── users.ts           # User profiles and wallet management
│   ├── http.ts            # HTTP routes for auth
│   └── lib/
│       └── crypto.ts      # Solana wallet generation and encryption
├── src/
│   ├── api/               # API client and HTTP utilities
│   ├── queries/           # TanStack Query hooks
│   ├── types/             # TypeScript types and Zod schemas
│   ├── lib/               # Shared utilities and configuration
│   └── components/        # React components
│       ├── ConvexAuthProvider.tsx  # Auth + Convex provider
│       └── Auth.tsx                # Sign-up/sign-in/wallet components
├── biome.json             # Biome configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## Key Features

### Type-Safe API Client

```typescript
import { createApiClient } from "./api/client";
import { userSchema } from "./types/schemas";

const api = createApiClient({ baseUrl: "https://api.example.com" });

// Automatic validation with Zod
const user = await api.get(userSchema, "/users/123");
```

### TanStack Query Hooks

```typescript
import { useUsers, useCreateUser } from "./queries/example";

function UserList() {
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();

  return (/* ... */);
}
```

### Zod v4 Validation

```typescript
import { z } from "zod";

const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
});

type User = z.infer<typeof userSchema>;
```

### Convex Auth + Solana Wallets (2026 Pattern)

```typescript
import { SignUpForm, WalletDisplay } from "./components/Auth";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

// Sign up with automatic Solana wallet generation
function SignUp() {
  return <SignUpForm />;
}

// Display user's Solana wallet
function Dashboard() {
  const wallet = useQuery(api.users.getSolanaPublicKey);

  return (
    <div>
      <h1>Your Wallet</h1>
      <p>Public Key: {wallet?.publicKey}</p>
      <WalletDisplay />
    </div>
  );
}
```

**Security Features:**
- 🔐 **Non-custodial**: Users own their private keys
- 🔒 **AES-GCM 256-bit encryption**: Private keys encrypted with password
- 🔑 **PBKDF2 key derivation**: 100,000 iterations for security
- ⚠️ **No recovery**: Password must be backed up - cannot be recovered

📖 **Full Documentation**: See [CONVEX_AUTH_SOLANA.md](CONVEX_AUTH_SOLANA.md)

## Scripts

| Command | Description |
|---------|-------------|
| `bun run lint` | Check code for issues |
| `bun run lint:fix` | Auto-fix linting issues |
| `bun run format` | Check code formatting |
| `bun run format:fix` | Auto-format code |
| `bun run check` | Run all checks (lint + format) |
| `bun run check:fix` | Auto-fix all issues |
| `bun run typecheck` | TypeScript type checking |

## Architecture Principles

### 1. Single Source of Truth

- **Schemas**: All data validation in `src/types/schemas.ts`
- **Query Keys**: Centralized query key factory
- **API Client**: Single HTTP client instance

### 2. Type Safety

- Zod schemas automatically infer TypeScript types
- API responses validated at runtime
- No `any` types allowed (Biome enforces this)

### 3. Separation of Concerns

- **API Layer** (`src/api/`): HTTP communication
- **Query Layer** (`src/queries/`): Data fetching and caching
- **Type Layer** (`src/types/`): Validation and type definitions

### 4. Clean Code

- Biome ensures consistent formatting
- Import organization automatic
- No unused variables or imports

## Best Practices

### Query Keys

Always use the query key factory:

```typescript
// ✅ Good
queryKey: queryKeys.users.detail(userId)

// ❌ Bad
queryKey: ['users', userId]
```

### Error Handling

```typescript
try {
  const data = await api.get(schema, "/endpoint");
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}:`, error.message);
  }
}
```

### Validation

Validate at boundaries:

```typescript
// Validate user input
const input = createUserSchema.parse(formData);

// Validate API responses (automatic in api.get/post/etc)
const user = await api.get(userSchema, "/users/1");
```

## Why This Stack?

### Bun

- **30x faster** than npm install
- Built-in TypeScript support
- Single runtime for everything

### Zod v4

- Runtime validation + TypeScript types
- Excellent error messages
- Composable schemas

### TanStack Query

- Automatic caching and background refetching
- Optimistic updates
- Request deduplication
- Industry standard for React data fetching

### Biome

- **10x faster** than ESLint + Prettier
- Single configuration file
- Zero config needed (works out of the box)
- Auto-organizes imports

## Next Steps

1. **Add UI Framework**: Integrate Next.js, Remix, or Vite
2. **Add State Management**: Zustand, Jotai, or Context
3. **Add Testing**: Vitest + React Testing Library
4. **Add Components**: shadcn/ui or your component library
5. **Add Backend**: Convex, Supabase, or custom API

## Migration from Old Codebase

Key differences:

- **Zod v3 → v4**: Compatible, minimal changes needed
- **Biome vs ESLint**: Biome is drop-in replacement
- **TanStack Query**: Replace direct API calls with hooks
- **Centralized schemas**: Move all validation to `types/schemas.ts`

## License

MIT
