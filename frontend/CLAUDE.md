# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **frontend** of a full-stack bookstore e-commerce application. The backend (FastAPI) is located at `/Users/hungho/Code/bookstore/backend`.

## Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000

# Build & Production
npm run build        # Build for production
npm start            # Run production build

# Linting
npm run lint         # Run ESLint
```

## Architecture

### Stack
- **Framework**: Next.js 16 with App Router
- **UI Components**: shadcn/ui (New York style) with Radix UI primitives
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand with persist middleware
- **Data Fetching**: TanStack React Query
- **Icons**: Lucide React
- **Notifications**: Sonner

### Key Directories

```
src/
├── app/              # Next.js App Router pages
├── components/
│   ├── ui/           # shadcn/ui components
│   └── layout/       # Header, Footer, Providers
├── lib/
│   ├── api.ts        # Centralized API client class
│   └── utils.ts      # cn() utility for class merging
├── stores/           # Zustand stores (auth.ts, cart.ts)
└── types/            # TypeScript interfaces
```

### State Management Pattern

- **Auth Store** (`stores/auth.ts`): Handles user authentication, token management with persistence
- **Cart Store** (`stores/cart.ts`): Shopping cart state synced with backend

### API Client Pattern

All API calls go through `lib/api.ts` which provides:
- Centralized token management via `setAccessToken()`
- Automatic `Authorization` header injection
- Consistent error handling

### Route Structure

| Route | Description |
|-------|-------------|
| `/` | Home page with featured books |
| `/books` | Book listing with search/filters |
| `/books/[id]` | Book detail with reviews |
| `/cart` | Shopping cart |
| `/checkout` | Checkout flow |
| `/orders` | User order history |
| `/profile` | User profile |
| `/admin/*` | Admin dashboard (requires admin role) |

## Backend Integration

The frontend connects to FastAPI backend at `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`).

**Test Accounts:**
- Admin: `admin@bookstore.com` / `admin123`
- User: `john@example.com` / `password123`

## Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

Components config: `components.json` (New York style, Lucide icons, CSS variables enabled)
