# LTCG Monorepo Structure

Successfully restructured the project as a proper monorepo with all apps in the `apps/` directory.

## 📁 Directory Structure

```
LTCG/
├── apps/
│   ├── web/           # Main Next.js application (port 3333)
│   ├── admin/         # Admin dashboard (port 5555)
│   └── wiki/          # Astro documentation site (port 4321)
├── convex/            # Shared Convex backend
├── packages/          # Shared packages (future)
├── node_modules/      # Hoisted dependencies
├── package.json       # Workspace root
└── turbo.json         # Turborepo configuration
```

## 🏗️ Changes Made

### 1. Moved Main App to `apps/web/`
- Moved `app/` → `apps/web/app/`
- Moved `src/` → `apps/web/src/`
- Moved `public/` → `apps/web/public/`
- Moved config files to `apps/web/`

### 2. Updated Configuration

#### Root `package.json`
- Added workspace configuration
- Hoisted all shared dependencies to root
- Updated all scripts to reference `apps/*`

#### `apps/web/package.json`
- Created app-specific package.json
- Scoped to `@ltcg/web`
- References hoisted dependencies

#### `apps/web/tsconfig.json`
- Updated `@convex` path to `../../convex/*`
- Removed `apps` from exclude (no longer needed)

#### `apps/web/next.config.ts`
- Added webpack alias for `@convex` resolution
- Points to `../../convex` directory

#### `turbo.json`
- Configured for monorepo builds
- Added proper task dependencies
- Supports parallel builds

### 3. Created Symlink
- Created `apps/web/convex` → `../../convex` symlink
- Allows relative imports to continue working
- Supports both `@convex/*` and relative paths

## 📦 Package Management

All dependencies are managed at the workspace root and hoisted via Bun workspaces:

```bash
bun install              # Install all workspace dependencies
bun add <package>        # Add to root (shared across apps)
cd apps/web && bun add <package>   # Add to specific app
```

## 🚀 Development Commands

```bash
# Start web app with Convex
bun run dev              # web + convex

# Start individual apps
bun run dev:web          # Just web app (port 3333)
bun run dev:admin        # Just admin (port 5555)
bun run dev:wiki         # Just wiki (port 4321)
bun run dev:convex       # Just Convex backend

# Start everything
bun run dev:all          # All apps + Convex
```

## 🔨 Build Commands

```bash
# Build all apps (via Turbo)
bun run build

# Build specific apps
bun run build:web
bun run build:admin
bun run build:wiki
```

## 🧹 Clean Command

```bash
bun run clean            # Remove all node_modules, .next, dist folders
```

## ✅ Verification

Build tested and passing:
- ✅ TypeScript compilation successful
- ✅ All 23 pages generated
- ✅ Convex imports resolving correctly
- ✅ Shared dependencies hoisted properly

## 🎯 Next Steps

1. **Add Shared Packages** (optional)
   ```
   packages/
   ├── ui/              # Shared UI components
   ├── config/          # Shared configuration
   └── types/           # Shared TypeScript types
   ```

2. **Environment Variables**
   - Keep `.env.local` in `apps/web/` for web app
   - Add separate `.env` for admin/wiki if needed
   - Root `.env.local` for Convex

3. **Deploy Configuration**
   - Vercel: Configure `apps/web` as root directory
   - Admin: Deploy as separate Vercel project pointing to `apps/admin`
   - Wiki: Deploy as separate project pointing to `apps/wiki`

## 🔑 Key Benefits

- **Better Organization**: Clear separation of apps
- **Shared Dependencies**: Single source of truth for versions
- **Parallel Builds**: Turborepo orchestrates efficient builds
- **Scalability**: Easy to add new apps or shared packages
- **Type Safety**: Shared types across all apps
- **Development Speed**: Fast rebuilds with caching

## 📝 Notes

- All apps share the same `convex/` backend directory
- Dependencies are hoisted to root `node_modules/`
- Each app has its own build output (`.next/`, `dist/`)
- Turbo handles build orchestration and caching
- Bun workspaces manages dependency installation
