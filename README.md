# Bookstore Monorepo

Full-stack e-commerce bookstore application using Turborepo monorepo with pnpm workspaces.

## Project Structure

```
bookstore/
├── apps/
│   ├── frontend/          # Next.js 16 with shadcn/ui and Zustand
│   └── backend/           # FastAPI with async SQLAlchemy
├── packages/
│   ├── types/             # Shared TypeScript types
│   ├── api/               # Shared API client
│   └── stores/            # Shared Zustand stores
└── package.json
```

## Quick Start

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
pnpm frontend:dev            # http://localhost:3000
pnpm backend:dev             # http://localhost:8000 (requires venv)
```

## Shared Packages

### @bookstore/types
TypeScript type definitions shared between apps.

### @bookstore/api
HTTP API client. Supports:
- Authentication (login, register, logout, token refresh)
- Books CRUD operations
- Cart management
- Orders and payments
- Reviews
- Admin operations

### @bookstore/stores
Zustand state management stores for:
- Auth (user session, JWT tokens)
- Cart (shopping cart state)

## Backend Setup (Python)

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

## Architecture

### Data Flow
1. Frontend app uses Zustand stores for state
2. Stores call methods on API client from `@bookstore/api`
3. API client makes HTTP requests to FastAPI backend
4. Backend routers validate input → services handle logic → repositories access SQLite DB

### API URL Configuration
- Frontend: Uses `NEXT_PUBLIC_API_URL` env var (default: `http://localhost:8000`)

## Development

### Monorepo Commands
| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm clean` | Clean all build artifacts and node_modules |

### Database

SQLite file at `apps/backend/bookstore.db`. Migrations via Alembic:

```bash
cd apps/backend
alembic upgrade head              # Apply migrations
alembic revision --autogenerate -m "description"  # Create migration
```
