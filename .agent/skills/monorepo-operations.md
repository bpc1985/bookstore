---
trigger: monorepo_operations
description: Manage the Turborepo monorepo, add dependencies to specific packages, and run commands across the workspace
---

# Monorepo Operations Skill

## Technology Stack

- **Monorepo Manager**: Turborepo
- **Package Manager**: pnpm with workspaces
- **Language**: TypeScript (frontend), Python (backend)
- **Shared Package**: @bookstore/types

## Project Structure

```
bookstore/
├── apps/
│   ├── frontend/           # Next.js 16 app
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── backend/            # FastAPI app
│       ├── app/
│       ├── requirements.txt
│       └── pyproject.toml
├── packages/
│   └── types/              # Shared TypeScript types
│       ├── src/
│       └── package.json
├── package.json            # Root package.json
├── pnpm-workspace.yaml     # pnpm workspace config
└── turbo.json              # Turborepo config
```

## Workspace Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^test"],
      "cache": true
    }
  }
}
```

## Root Package Scripts

### package.json

```json
{
  "name": "bookstore",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules",
    "format": "turbo run format",
    "frontend:dev": "pnpm --filter @bookstore/frontend dev",
    "frontend:build": "pnpm --filter @bookstore/frontend build",
    "frontend:lint": "pnpm --filter @bookstore/frontend lint",
    "frontend:typecheck": "pnpm --filter @bookstore/frontend typecheck",
    "frontend:test": "pnpm --filter @bookstore/frontend test",
    "backend:dev": "pnpm --filter @bookstore/backend dev",
    "backend:lint": "pnpm --filter @bookstore/backend lint",
    "backend:typecheck": "pnpm --filter @bookstore/backend typecheck",
    "backend:test": "pnpm --filter @bookstore/backend test",
    "backend:seed": "pnpm --filter @bookstore/backend seed",
    "backend:migrate": "pnpm --filter @bookstore/backend migrate"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

## Adding Dependencies

### Add to Frontend (Next.js)

```bash
# Add to frontend only
pnpm --filter @bookstore/frontend add <package>

# Add dev dependency to frontend
pnpm --filter @bookstore/frontend add -D <package>

# Add multiple packages
pnpm --filter @bookstore/frontend add react-hook-form @hookform/resolvers zod

# Examples
pnpm --filter @bookstore/frontend add framer-motion
pnpm --filter @bookstore/frontend add -D @types/node
```

### Add to Backend (Python)

```bash
# Add Python dependency to backend
cd apps/backend
pip install <package>

# Update requirements.txt
pip freeze > requirements.txt

# Example
pip install httpx
pip install python-multipart
```

### Add to Shared Types Package

```bash
# Add to shared types package
pnpm --filter @bookstore/types add <package>

# Example
pnpm --filter @bookstore/types add zod
```

### Add to Root (Dev Dependencies)

```bash
# Add to root (shared dev dependencies)
pnpm add -D -w <package>

# Example
pnpm add -D -w prettier eslint-config-custom
```

## Running Commands

### Run Across All Apps

```bash
# Start all apps in development
pnpm dev

# Build all apps
pnpm build

# Lint all apps
pnpm lint

# Type check all apps
pnpm typecheck

# Test all apps
pnpm test
```

### Run Specific App Commands

```bash
# Start frontend only
pnpm frontend:dev

# Build frontend only
pnpm frontend:build

# Lint frontend only
pnpm frontend:lint

# Start backend only (requires venv)
pnpm backend:dev
```

### Run Command in Specific Package

```bash
# Using filter
pnpm --filter @bookstore/frontend dev

# Run custom script in package
pnpm --filter @bookstore/frontend run custom-script
```

## Working with Shared Types

### Creating Shared Types

```typescript
// packages/types/src/book.ts
export interface Book {
  id: number;
  title: string;
  author: string;
  description?: string;
  price: number;
  stock: number;
  category_id?: number;
  cover_image?: string;
  created_at: string;
  updated_at: string;
}

export interface BookCreate {
  title: string;
  author: string;
  description?: string;
  price: number;
  stock: number;
  category_id?: number;
  cover_image?: string;
}

export interface BookUpdate {
  title?: string;
  author?: string;
  description?: string;
  price?: number;
  stock?: number;
  category_id?: number;
  cover_image?: string;
}
```

### Building Shared Types

```bash
# Build shared types package
pnpm --filter @bookstore/types build

# Watch mode for development
pnpm --filter @bookstore/types build --watch
```

### Using Shared Types in Frontend

```typescript
// apps/frontend/src/components/BookCard.tsx
import type { Book } from '@bookstore/types';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  return <div>{book.title}</div>;
}
```

### Using Shared Types in Backend (Pydantic)

```python
# apps/backend/app/schemas/book.py
from pydantic import BaseModel
from datetime import datetime

class BookCreate(BaseModel):
    title: str
    author: str
    description: str | None = None
    price: float
    stock: int
    category_id: int | None = None
    cover_image: str | None = None

class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    description: str | None
    price: float
    stock: int
    category_id: int | None
    cover_image: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

## Turborepo Caching

### Understanding Caching

Turborepo caches outputs based on:
1. Input files (source code)
2. Environment variables
3. Dependencies
4. Global dependencies (.env files)

### Cache Configuration

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"],
      "inputs": ["src/**", "package.json", "tsconfig.json"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**", "tests/**", "package.json"]
    }
  }
}
```

### Cache Commands

```bash
# Clear cache
pnpm turbo prune
rm -rf .turbo

# Run with cache disabled
pnpm dev --force
pnpm build --force

# Run specific task with cache
pnpm turbo run build --filter=@bookstore/frontend
```

## Task Dependencies

### Defining Task Dependencies

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

- `^build` means "run build in all dependencies first"
- Tasks run in parallel when possible

### Dependency Graph Example

```
@bookstore/types (no dependencies)
    ↓
@bookstore/frontend (depends on @bookstore/types)
    ↓
@bookstore/frontend:build
```

## Monorepo Best Practices

### 1. Shared Dependencies

Place shared dependencies in root:

```bash
# Add to root (all packages can use)
pnpm add -D -w typescript @types/react
```

Update `package.json` in each app to use the shared version.

### 2. Internal Dependencies

When one package needs another:

```bash
# Frontend needs shared types
pnpm --filter @bookstore/frontend add @bookstore/types
```

### 3. Version Management

Use consistent versions across packages:

```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "eslint": "^8.0.0"
  }
}
```

Use pnpm workspace protocol:

```json
{
  "dependencies": {
    "@bookstore/types": "workspace:*"
  }
}
```

### 4. Scripts Organization

Keep scripts at root for common tasks:

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "clean": "turbo run clean && rm -rf node_modules"
  }
}
```

### 5. Environment Variables

Use shared env files:

```
.env.local              # Local development (gitignored)
.env.example            # Example (committed)
.env.development        # Development (committed)
.env.production         # Production (committed)
```

## Troubleshooting

### Common Issues

#### 1. Package Not Found

```bash
# Error: Cannot find package '@bookstore/types'

# Solution: Build shared package first
pnpm --filter @bookstore/types build

# Or link it
pnpm link --global --filter @bookstore/types
pnpm link --global --filter @bookstore/frontend @bookstore/types
```

#### 2. Dependency Conflicts

```bash
# Check for dependency conflicts
pnpm why <package>

# Install with specific version
pnpm --filter @bookstore/frontend add <package>@<version>
```

#### 3. Cache Issues

```bash
# Clear cache
rm -rf .turbo node_modules/.cache

# Rebuild
pnpm build --force
```

#### 4. TypeScript Path Issues

```json
// apps/frontend/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@bookstore/types": ["../../packages/types/src"]
    }
  }
}
```

## Performance Tips

### 1. Use Turborepo Caching

```bash
# Build with cache (faster after first run)
pnpm build

# Force rebuild when needed
pnpm build --force
```

### 2. Run in Parallel

```bash
# Turborepo automatically runs tasks in parallel
pnpm dev  # Starts frontend and backend simultaneously
```

### 3. Filter Packages

```bash
# Run only on specific package
pnpm --filter @bookstore/frontend build

# Run on package and dependencies
pnpm --filter @bookstore/frontend... build

# Run on package and dependents
pnpm --filter ...@bookstore/types build
```

## Monorepo Checklist

When working with the monorepo:

- [ ] Add dependencies to correct package using `--filter`
- [ ] Build shared types package after changes
- [ ] Use `workspace:*` for internal dependencies
- [ ] Run typecheck before committing: `pnpm typecheck`
- [ ] Test across all packages: `pnpm test`
- [ ] Clear cache if issues arise: `rm -rf .turbo`
- [ ] Keep shared dependencies in root package.json
- [ ] Use consistent versions across packages
- [ ] Update turbo.json when adding new tasks
- [ ] Use `.env.local` for local secrets
