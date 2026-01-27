# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack e-commerce bookstore application using **Turborepo** monorepo with pnpm workspaces.

- **Frontend (Next.js)**: `apps/frontend/` - Next.js 16 with shadcn/ui and Zustand — http://localhost:3000
- **Frontend (Vue)**: `apps/frontend-vue/` - Vue 3 with shadcn-vue and Pinia — http://localhost:3001
- **Backend**: `apps/backend/` - FastAPI with async SQLAlchemy — http://localhost:8000

Each app has its own `CLAUDE.md` with detailed guidance for that part of the stack.

## Quick Start

### Install Dependencies
```bash
pnpm install
```

### Run All Apps (Development)
```bash
pnpm dev                     # Starts all apps
```

### Run Individual Apps
```bash
pnpm frontend:dev            # Next.js at http://localhost:3000
pnpm frontend-vue:dev        # Vue at http://localhost:3001
pnpm backend:dev             # FastAPI at http://localhost:8000 (requires venv activated)
```

### Backend Setup (Python)
```bash
cd apps/backend
python -m venv venv
source venv/bin/activate     # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..
pnpm backend:seed            # Seed sample data
pnpm backend:migrate         # Run migrations
```

**Test credentials:**
- Admin: `admin@bookstore.com` / `admin123456`
- User: `user@bookstore.com` / `user123456`

## Monorepo Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm clean` | Clean all build artifacts and node_modules |
| `pnpm frontend:dev` | Start Next.js frontend only |
| `pnpm frontend:build` | Build Next.js frontend only |
| `pnpm frontend-vue:dev` | Start Vue frontend only |
| `pnpm frontend-vue:build` | Build Vue frontend only |
| `pnpm backend:dev` | Start backend only (requires venv) |
| `pnpm backend:seed` | Seed backend database |
| `pnpm backend:migrate` | Run backend migrations |

## Architecture Overview

```
bookstore/
├── apps/
│   ├── frontend/            # Next.js 16 App Router
│   │   ├── src/app/         # Pages (/, /books, /cart, /checkout, /orders, /admin)
│   │   ├── src/components/  # React components (ui/, layout/)
│   │   ├── src/stores/      # Zustand stores (auth.ts, cart.ts)
│   │   └── src/lib/api.ts   # API client
│   │
│   ├── frontend-vue/        # Vue 3 + Vite
│   │   ├── src/views/       # Page components (routed via vue-router)
│   │   ├── src/components/  # Vue components (ui/, layout/)
│   │   ├── src/stores/      # Pinia stores (auth.ts, cart.ts)
│   │   ├── src/lib/api.ts   # API client (separate from Next.js)
│   │   └── src/router/      # Vue Router with auth guards
│   │
│   └── backend/             # FastAPI
│       └── app/
│           ├── routers/     # API endpoints
│           ├── services/    # Business logic
│           ├── repositories/# Data access layer
│           ├── models/      # SQLAlchemy ORM
│           └── schemas/     # Pydantic validation
│
├── packages/                # Shared packages
│   ├── types/               # @bookstore/types — TypeScript type definitions
│   ├── api/                 # @bookstore/api — API client (used by Next.js)
│   └── stores/              # @bookstore/stores — Zustand stores (used by Next.js)
├── package.json             # Root workspace config
├── pnpm-workspace.yaml      # pnpm workspace definition
└── turbo.json               # Turborepo configuration
```

### Data Flow
1. Frontend components use stores for state (Zustand in Next.js, Pinia in Vue)
2. Stores call methods on their respective API client
3. API client makes HTTP requests to FastAPI backend
4. Backend routers validate input → services handle logic → repositories access SQLite DB

### Two Frontends — Key Differences

Both frontends connect to the same FastAPI backend and should have matching UI/behavior.

| Aspect | Next.js (`apps/frontend/`) | Vue (`apps/frontend-vue/`) |
|--------|---------------------------|---------------------------|
| Port | 3000 | 3001 |
| State | Zustand + persist | Pinia + persistedstate |
| UI Library | shadcn/ui (Radix UI) | shadcn-vue (Radix Vue) |
| API Client | Shared `@bookstore/api` package | Local `src/lib/api.ts` |
| Env var for API | `NEXT_PUBLIC_API_URL` | `VITE_API_URL` |
| Routing | Next.js App Router (file-based) | vue-router (explicit routes in `src/router/index.ts`) |
| Auto-imports | None (standard React imports) | Vite plugins auto-import Vue, Pinia, VueUse, and components |

### Vue Frontend Auto-Import Behavior

The Vue app uses `unplugin-auto-import` and `unplugin-vue-components`:
- **Vue APIs** (`ref`, `computed`, `onMounted`, etc.), **vue-router**, **pinia**, and **@vueuse/core** are available globally without imports
- **All components** under `src/components/` are auto-resolved in templates (including nested `ui/` components like `<Button>`, `<Card>`, etc.)
- The `api` object from `src/lib/api.ts` is auto-imported
- Generated type files: `src/auto-imports.d.ts`, `src/components.d.ts` — do not edit manually

### Vue Router Auth Guards

Routes use meta properties for protection:
- `meta: { requiresAuth: true }` — redirects to `/login` if not authenticated
- `meta: { requiresAuth: true, requiresAdmin: true }` — requires admin role
- Guard logic is in `router.beforeEach()` in `src/router/index.ts`

### Key Integration Points

- **Auth**: JWT tokens with access token (15 min) + refresh token (7 days). Next.js persists in Zustand, Vue persists in Pinia (both use localStorage)
- **CORS**: Backend allows all origins in development

## Database

SQLite file at `apps/backend/bookstore.db`. Migrations via Alembic:

```bash
cd apps/backend
alembic upgrade head              # Apply migrations
alembic revision --autogenerate -m "description"  # Create migration
```
