# Bookstore Monorepo

Full-stack e-commerce bookstore application using **Turborepo** monorepo with pnpm workspaces.

## Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | https://bookstore-web-5al8.onrender.com |
| **Backend API** | https://bookstore-api-i12k.onrender.com |
| **API Docs** | https://bookstore-api-i12k.onrender.com/docs |

> **Note**: Free tier services may take 30-60 seconds to wake up on first request.

**Test Credentials:**
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@bookstore.com` | `admin123456` |
| User | `user@bookstore.com` | `user123456` |

## Features

- 📚 Browse and search books by category, price, and keywords
- 🛒 Shopping cart with stock validation
- 📦 Order management with status tracking
- ⭐ Book reviews with verified purchase badges
- 👤 User authentication with JWT (access + refresh tokens)
- 🔐 Admin dashboard for books, categories, orders, reviews, and users

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 with App Router |
| UI | shadcn/ui (Radix UI primitives) |
| State | Zustand with persist middleware |
| Data Fetching | TanStack React Query |
| Backend | FastAPI (Python) |
| ORM | SQLAlchemy 2.0 (async) |
| Database | SQLite |
| Monorepo | Turborepo + pnpm workspaces |

## Project Structure

```
bookstore/
├── apps/
│   ├── frontend/          # Next.js 16 — http://localhost:3000 (customer)
│   ├── admin/             # Next.js 16 — http://localhost:3002 (admin)
│   └── backend           # FastAPI + SQLAlchemy — http://localhost:8000
├── packages/
│   └── types/             # @bookstore/types — shared TypeScript types
└── package.json
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9+
- Python 3.10+ (for FastAPI backend)

### Install Dependencies

```bash
pnpm install
```

### Run All Apps

```bash
pnpm dev                     # Starts all apps
```

### Run Individual Apps

```bash
pnpm frontend:dev            # Next.js at http://localhost:3000
pnpm admin:dev               # Next.js at http://localhost:3002
pnpm backend:dev             # FastAPI at http://localhost:8000 (requires venv)
```

## Backend Setup

```bash
cd apps/backend
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..
pnpm backend:seed            # Seed sample data
pnpm backend:migrate         # Run Alembic migrations
```

## API Documentation

- **Live Demo**: https://bookstore-api-i12k.onrender.com/docs
- **Local Swagger UI**: http://localhost:8000/docs
- **Local ReDoc**: http://localhost:8000/redoc

## Monorepo Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm typecheck` | Type check all TypeScript packages |
| `pnpm clean` | Clean all build artifacts and node_modules |

### Frontend Commands

| Command | Description |
|---------|-------------|
| `pnpm frontend:dev` | Start Next.js frontend (customer) |
| `pnpm frontend:build` | Build Next.js frontend |

### Admin Commands

| Command | Description |
|---------|-------------|
| `pnpm admin:dev` | Start Next.js admin dashboard |
| `pnpm admin:build` | Build Next.js admin |
| `pnpm admin:lint` | Lint admin code |
| `pnpm admin:typecheck` | Type check admin TypeScript |
| `pnpm admin:test` | Run admin tests (Vitest) |
| `pnpm admin:test:ui` | Run admin tests with Vitest UI |
| `pnpm admin:test:coverage` | Run admin tests with coverage |

### Backend Commands

| Command | Description |
|---------|-------------|
| `pnpm backend:dev` | Start FastAPI (requires venv) |
| `pnpm backend:seed` | Seed FastAPI database |
| `pnpm backend:migrate` | Run FastAPI Alembic migrations |

### Test Commands

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all tests |
| `pnpm frontend:test` | Run frontend tests (Vitest) |
| `pnpm frontend:test:ui` | Run frontend tests with Vitest UI |
| `pnpm frontend:test:coverage` | Run frontend tests with coverage |
| `pnpm backend:test` | Run backend tests (pytest) |
| `pnpm backend:test:unit` | Run backend unit tests only |
| `pnpm backend:test:coverage` | Run backend tests with coverage |

## Environment Variables

### Frontend (Customer)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

### Admin

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./bookstore.db` | Database connection string |
| `SECRET_KEY` | (generated) | JWT signing key |

## Shared Packages

### @bookstore/types

TypeScript type definitions shared between frontend and backend:
- `User`, `Book`, `Category`, `Cart`, `Order`, `Review`
- `PaginatedResponse`, `ApiError`
- Request/response types for API endpoints

## Database

SQLite database with Alembic migrations:

| File | Description |
|------|-------------|
| `apps/backend/bookstore.db` | SQLite database file |
| `apps/backend/alembic/` | Migration scripts |

## Deployment

The project includes Docker and Render configurations for deployment:

- **Dockerfiles**: `apps/backend/Dockerfile`, `apps/frontend/Dockerfile`
- **Render Blueprint**: `render.yaml` (auto-deploys backend, frontend, and PostgreSQL)

### Deploy to Render

1. Push your code to GitHub
2. Go to [Render Dashboard](https://render.com) → **New** → **Blueprint**
3. Connect your repository (Render auto-detects `render.yaml`)
4. After deploy, set `NEXT_PUBLIC_API_URL` in the frontend service environment

### Environment Variables (Production)

| Service | Variable | Description |
|---------|----------|-------------|
| Backend | `DATABASE_URL` | PostgreSQL connection string |
| Backend | `SECRET_KEY` | JWT signing key |
| Backend | `RUN_MIGRATIONS` | Set to `true` for auto-migrations |
| Backend | `AUTO_SEED` | Set to `true` for auto-seeding |
| Frontend | `NEXT_PUBLIC_API_URL` | Backend API URL |

## License

MIT
