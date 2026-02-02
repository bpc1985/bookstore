---
trigger: model_decision
description: Run commands in the Turborepo monorepo using pnpm workspaces
---

# Turborepo Commands

## Core Principle

**Always run commands from the repository root.** Do NOT `cd` into package directories.

## Package Names

| Directory | Package Name |
|-----------|--------------|
| `apps/frontend` | `@bookstore/frontend` |
| `apps/backend` | `@bookstore/backend` |
| `packages/types` | `@bookstore/types` |

## Common Commands

### Development

```bash
# Start all apps
pnpm dev

# Start specific app
pnpm frontend:dev          # Next.js at localhost:3000
pnpm backend:dev           # FastAPI at localhost:8000

# Alternative using --filter
pnpm --filter=@bookstore/frontend dev
pnpm --filter=@bookstore/backend dev
```

### Build & Check

```bash
# Build all
pnpm build

# Build specific package
pnpm --filter=@bookstore/frontend build

# Type check all
pnpm typecheck

# Lint all
pnpm lint
```

### Database (Backend)

```bash
# Seed database
pnpm backend:seed

# Run migrations
pnpm backend:migrate

# Or using --filter
pnpm --filter=@bookstore/backend seed
pnpm --filter=@bookstore/backend migrate
```

### Dependencies

```bash
# Add dependency to frontend
pnpm --filter=@bookstore/frontend add <package>

# Add dev dependency to frontend
pnpm --filter=@bookstore/frontend add -D <package>

# Add dependency to types package
pnpm --filter=@bookstore/types add <package>

# Add to root (for tooling)
pnpm add -w <package>

# Install all dependencies
pnpm install
```

### Cleanup

```bash
# Clean all build artifacts
pnpm clean

# Nuclear option - remove everything and reinstall
pnpm clean && pnpm install
```

## Filter Syntax

The `--filter` flag targets specific packages:

```bash
# By package name
pnpm --filter=@bookstore/frontend <command>

# By directory
pnpm --filter=./apps/frontend <command>

# Multiple packages
pnpm --filter=@bookstore/frontend --filter=@bookstore/types <command>

# All packages matching pattern
pnpm --filter="@bookstore/*" <command>
```

## Turbo-Specific Commands

```bash
# Run with verbose output
pnpm turbo run build --verbosity=2

# Run without cache
pnpm turbo run build --force

# See what would run (dry run)
pnpm turbo run build --dry-run
```

## Common Mistakes

| Wrong | Correct |
|-------|---------|
| `cd apps/frontend && pnpm dev` | `pnpm frontend:dev` |
| `cd apps/backend && pnpm seed` | `pnpm backend:seed` |
| `npm install` | `pnpm install` |
| `pnpm add react` (in subdir) | `pnpm --filter=@bookstore/frontend add react` |
