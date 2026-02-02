---
trigger: model_decision
description: Run code quality checks before committing changes
---

# Code Quality Checks

## Required Checks

Run these checks from the monorepo root before committing:

### 1. TypeScript Type Check

```bash
pnpm typecheck
```

- Must pass with zero errors
- Catches type mismatches, missing properties, incorrect imports
- If errors exist, fix them before proceeding

### 2. Lint Check

```bash
pnpm lint
```

- Enforces code style and catches common issues
- Auto-fix available: `pnpm lint --fix` (in frontend)

### 3. Build Verification

```bash
pnpm build
```

- Ensures production build succeeds
- Catches issues that only appear in build (dead code, missing exports)

## Package-Specific Checks

### Frontend Only

```bash
pnpm --filter=@bookstore/frontend typecheck
pnpm --filter=@bookstore/frontend lint
pnpm --filter=@bookstore/frontend build
```

### Backend Only

```bash
# Python has no typecheck in this project
# Verify the server starts without errors
pnpm backend:dev
# Then Ctrl+C after confirming it starts
```

## Common Issues and Fixes

### TypeScript Errors

| Error | Fix |
|-------|-----|
| `Cannot find module` | Check import path, run `pnpm install` |
| `Property does not exist` | Add property to type or use optional chaining |
| `Type 'X' is not assignable to 'Y'` | Fix type mismatch or add proper type assertion |
| `Implicit any` | Add explicit type annotation |

### Import Errors

```typescript
// Use @bookstore/types for shared types
import type { Book, User } from '@bookstore/types';

// Use path aliases for local imports
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
```

## Pre-Commit Checklist

Before every commit:

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes (or issues are intentional)
- [ ] `pnpm build` succeeds
- [ ] No `console.log` statements left in (except error logging)
- [ ] No commented-out code
- [ ] No `any` types added without justification
- [ ] Imports use proper aliases (`@/`, `@bookstore/types`)
