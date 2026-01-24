# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack e-commerce bookstore application using **Turborepo** monorepo with pnpm workspaces.

- **Frontend**: `apps/frontend/` - Next.js 16 with shadcn/ui and Zustand
- **Backend**: `apps/backend/` - FastAPI with async SQLAlchemy

Each app has its own `CLAUDE.md` with detailed guidance for that part of the stack.

## Quick Start

### Install Dependencies
```bash
pnpm install
```

### Run Both Apps (Development)
```bash
pnpm dev                     # Starts both frontend and backend
```

### Run Individual Apps
```bash
pnpm frontend:dev            # http://localhost:3000
pnpm backend:dev             # http://localhost:8000 (requires venv activated)
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
| `pnpm frontend:dev` | Start frontend only |
| `pnpm frontend:build` | Build frontend only |
| `pnpm backend:dev` | Start backend only (requires venv) |
| `pnpm backend:seed` | Seed backend database |
| `pnpm backend:migrate` | Run backend migrations |

## Architecture Overview

```
bookstore/
├── apps/
│   ├── frontend/          # Next.js App Router
│   │   ├── src/app/       # Pages (/, /books, /cart, /checkout, /orders, /admin)
│   │   ├── src/components/# React components (ui/, layout/, feature-specific)
│   │   ├── src/stores/    # Zustand stores (auth.ts, cart.ts)
│   │   └── src/lib/api.ts # Centralized API client
│   │
│   └── backend/           # FastAPI
│       └── app/
│           ├── routers/   # API endpoints
│           ├── services/  # Business logic
│           ├── repositories/ # Data access layer
│           ├── models/    # SQLAlchemy ORM
│           └── schemas/   # Pydantic validation
│
├── packages/              # Shared packages (for future use)
├── package.json           # Root workspace config
├── pnpm-workspace.yaml    # pnpm workspace definition
└── turbo.json             # Turborepo configuration
```

### Data Flow
1. Frontend components use Zustand stores for state
2. Stores and components call methods on `lib/api.ts`
3. API client makes HTTP requests to FastAPI backend
4. Backend routers validate input → services handle logic → repositories access SQLite DB

### Key Integration Points

- **Auth**: JWT tokens stored in Zustand with persist middleware. Access token (15 min) + refresh token (7 days)
- **API URL**: Frontend uses `NEXT_PUBLIC_API_URL` env var (default: `http://localhost:8000`)
- **CORS**: Backend allows all origins in development

## Database

SQLite file at `apps/backend/bookstore.db`. Migrations via Alembic:

```bash
cd apps/backend
alembic upgrade head              # Apply migrations
alembic revision --autogenerate -m "description"  # Create migration
```
