# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack e-commerce bookstore application with separate frontend and backend directories.

- **Frontend**: `frontend/` - Next.js 16 with shadcn/ui and Zustand
- **Backend**: `backend/` - FastAPI with async SQLAlchemy

Each directory has its own `CLAUDE.md` with detailed guidance for that part of the stack.

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python seeds/seed_data.py                    # Seed sample data
uvicorn app.main:app --reload --port 8000    # http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                                  # http://localhost:3000
```

**Test credentials:**
- Admin: `admin@bookstore.com` / `admin123456`
- User: `user@bookstore.com` / `user123456`

## Architecture Overview

```
bookstore/
├── frontend/          # Next.js App Router
│   ├── src/app/       # Pages (/, /books, /cart, /checkout, /orders, /admin)
│   ├── src/components/# React components (ui/, layout/, feature-specific)
│   ├── src/stores/    # Zustand stores (auth.ts, cart.ts)
│   └── src/lib/api.ts # Centralized API client
│
└── backend/           # FastAPI
    └── app/
        ├── routers/   # API endpoints
        ├── services/  # Business logic
        ├── repositories/ # Data access layer
        ├── models/    # SQLAlchemy ORM
        └── schemas/   # Pydantic validation
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

SQLite file at `backend/bookstore.db`. Migrations via Alembic:

```bash
cd backend
alembic upgrade head              # Apply migrations
alembic revision --autogenerate -m "description"  # Create migration
```
