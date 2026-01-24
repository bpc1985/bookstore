# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

From the monorepo root (requires venv activated):
```bash
pnpm backend:dev             # Start dev server at http://localhost:8000
pnpm backend:seed            # Seed database with sample data
pnpm backend:migrate         # Run migrations
```

From this directory:
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or via pnpm
pnpm dev                     # Same as uvicorn command above

# Database migrations
alembic upgrade head                              # Apply all migrations
alembic downgrade -1                              # Rollback one migration
alembic revision --autogenerate -m "message"      # Create new migration

# Seed database with sample data
python seeds/seed_data.py
# Or via pnpm
pnpm seed
```

**Test credentials (from seed data):**
- Admin: `admin@bookstore.com` / `admin123456`
- User: `user@bookstore.com` / `user123456`

## Architecture

FastAPI backend with async SQLAlchemy, following a layered architecture pattern:

```
app/
├── routers/       # API endpoints - define routes, validate input, call services
├── services/      # Business logic - orchestrate operations, handle validation
├── repositories/  # Data access - database queries using SQLAlchemy async
├── models/        # SQLAlchemy ORM models with relationships
├── schemas/       # Pydantic models for request/response validation
├── utils/         # Helpers (security.py for JWT/passwords, pagination.py)
├── dependencies.py # FastAPI DI functions for auth and DB session
└── exceptions.py   # Custom exception hierarchy (BookStoreException base)
```

**Key patterns:**

- **Repository Pattern**: `BaseRepository[ModelType]` provides generic CRUD; specific repos extend with domain methods
- **Dependency Injection**: Use `Depends()` for session and auth. Auth dependencies: `get_current_user`, `get_current_active_user`, `get_admin_user`, `get_optional_user`
- **Schema naming**: `Create`, `Update`, `Response` suffixes for each resource (e.g., `BookCreate`, `BookResponse`)
- **Async throughout**: All DB operations use `AsyncSession` and async/await

**API routes:** `/auth`, `/users`, `/categories`, `/books`, `/cart`, `/orders`, `/payments`, `/reviews`, `/admin`, `/health`

## Database

SQLite with aiosqlite async driver. Database file: `bookstore.db`

Models use SQLAlchemy 2.0 declarative style with `Mapped[Type]` annotations. All models have `created_at`/`updated_at` timestamps. Books support soft delete via `is_deleted` field.

## Authentication

JWT-based with access tokens (15 min) and refresh tokens (7 days). Uses HTTPBearer scheme. Token blacklisting for logout. Role-based access control with `UserRole.ADMIN` and `UserRole.USER`.
