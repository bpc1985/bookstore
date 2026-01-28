# Bookstore Monorepo

Full-stack e-commerce bookstore application using **Turborepo** monorepo with pnpm workspaces.

## Features

- 📚 Browse and search books by category, price, and keywords
- 🛒 Shopping cart with stock validation
- 📦 Order management with status tracking
- ⭐ Book reviews with verified purchase badges
- 👤 User authentication with JWT (access + refresh tokens)
- 🔐 Admin panel for inventory, orders, and reviews

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (React) or Vue 3 |
| UI | shadcn/ui (Radix) or shadcn-vue |
| State | Zustand (Next.js) or Pinia (Vue) |
| Backend | FastAPI (Python) or NestJS (TypeScript) |
| ORM | SQLAlchemy (FastAPI) or Prisma (NestJS) |
| Database | SQLite |
| Monorepo | Turborepo + pnpm workspaces |

## Project Structure

```
bookstore/
├── apps/
│   ├── frontend/          # Next.js 16 — http://localhost:3000
│   ├── frontend-vue/      # Vue 3 + Vite — http://localhost:3001
│   ├── backend/           # FastAPI + SQLAlchemy — http://localhost:8000
│   └── backend-nestjs/    # NestJS + Prisma — http://localhost:8001
├── packages/
│   ├── types/             # @bookstore/types — shared TypeScript types
│   ├── api/               # @bookstore/api — API client (Next.js)
│   └── stores/            # @bookstore/stores — Zustand stores (Next.js)
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
# Frontends
pnpm frontend:dev            # Next.js at http://localhost:3000
pnpm frontend-vue:dev        # Vue at http://localhost:3001

# Backends (choose one)
pnpm backend:dev             # FastAPI at http://localhost:8000 (requires venv)
pnpm backend-nestjs:dev      # NestJS at http://localhost:8001
```

## Backend Setup

### Option 1: FastAPI (Python)

```bash
cd apps/backend
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..
pnpm backend:seed            # Seed sample data
pnpm backend:migrate         # Run Alembic migrations
```

### Option 2: NestJS (TypeScript)

```bash
pnpm backend-nestjs:migrate  # Apply Prisma schema
pnpm backend-nestjs:seed     # Seed sample data
pnpm backend-nestjs:dev      # Start server
```

Both backends are **functionally equivalent** with the same 33+ API endpoints.

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@bookstore.com` | `admin123456` |
| User | `user@bookstore.com` | `user123456` |

## API Documentation

- **FastAPI**: http://localhost:8000/docs (Swagger UI)
- **NestJS**: http://localhost:8001/docs (Swagger UI)

## Monorepo Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm clean` | Clean all build artifacts and node_modules |

### Frontend Commands

| Command | Description |
|---------|-------------|
| `pnpm frontend:dev` | Start Next.js frontend |
| `pnpm frontend:build` | Build Next.js frontend |
| `pnpm frontend-vue:dev` | Start Vue frontend |
| `pnpm frontend-vue:build` | Build Vue frontend |

### Backend Commands

| Command | Description |
|---------|-------------|
| `pnpm backend:dev` | Start FastAPI (requires venv) |
| `pnpm backend:seed` | Seed FastAPI database |
| `pnpm backend:migrate` | Run FastAPI Alembic migrations |
| `pnpm backend-nestjs:dev` | Start NestJS |
| `pnpm backend-nestjs:seed` | Seed NestJS database |
| `pnpm backend-nestjs:migrate` | Run NestJS Prisma migrations |

## Environment Variables

### Frontends

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | API base URL (Next.js) |
| `VITE_API_URL` | `http://localhost:8000` | API base URL (Vue) |

### Backends

See `.env` files in each backend directory.

## Shared Packages

### @bookstore/types

TypeScript type definitions shared between frontend apps.

### @bookstore/api

HTTP API client with support for:
- Authentication (login, register, logout, token refresh)
- Books CRUD and search
- Cart management
- Orders and payments
- Reviews
- Admin operations

### @bookstore/stores

Zustand state management stores for:
- Auth (user session, JWT tokens with auto-refresh)
- Cart (shopping cart with persistence)

## Database

Each backend maintains its own SQLite database:

| Backend | Database File | Migrations |
|---------|--------------|------------|
| FastAPI | `apps/backend/bookstore.db` | Alembic |
| NestJS | `apps/backend-nestjs/prisma/bookstore.db` | Prisma |

## License

MIT
