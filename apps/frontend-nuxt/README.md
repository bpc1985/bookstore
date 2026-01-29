# Bookstore Nuxt Frontend

Nuxt.js frontend application for the bookstore e-commerce platform.

## Commands

From the monorepo root:
```bash
pnpm frontend-nuxt:dev        # Start dev server at http://localhost:3002
pnpm frontend-nuxt:build      # Build for production
```

From this directory:
```bash
pnpm dev                     # Start dev server at http://localhost:3002
pnpm build                   # Build for production
pnpm generate                 # Generate static site
pnpm preview                 # Preview production build
pnpm lint                    # Run ESLint
pnpm typecheck              # Run TypeScript type checking
```

## Default Port

The development server runs on **port 3002** by default. You can override this with:

```bash
pnpm dev --port 3000
```

## Architecture

### Stack
- **Framework**: Nuxt 3 with Vue 3
- **UI Components**: shadcn-vue with Radix Vue primitives
- **Styling**: Tailwind CSS 4
- **State Management**: Pinia with persist plugin
- **Data Fetching**: TanStack Vue Query
- **Icons**: Lucide Vue Next
- **Notifications**: Vue Sonner

### Key Directories

```
src/
├── assets/          # Static assets (styles, images)
├── components/      # Vue components
│   ├── ui/          # shadcn-vue components
│   └── layout/      # Header, Footer
├── composables/     # Vue composables
├── lib/             # Utilities (api.ts, utils.ts)
├── pages/           # Nuxt file-based routing
├── stores/          # Pinia stores
└── types/           # TypeScript types
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
| `/cart` | Shopping cart |
| `/login` | Login page |
| `/register` | Registration page |
| `/profile` | User profile |
| `/admin/*` | Admin dashboard (requires admin role) |

## Backend Integration

The frontend connects to FastAPI backend at `NUXT_PUBLIC_API_URL` (default: `http://localhost:8000`).

**Test Accounts:**
- Admin: `admin@bookstore.com` / `admin123456`
- User: `user@bookstore.com` / `user123456`

## Adding shadcn-vue Components

```bash
npx shadcn-nuxt@latest add <component-name>
```

Components config: `components.json` (New York style, Lucide icons, CSS variables enabled)

## Absolute Path Imports

Use `@/` prefix for imports from `src/` directory:

```typescript
import { useApi } from '@/composables/useApi'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

## Environment Variables

Create a `.env` file in the project root:

```env
NUXT_PUBLIC_API_URL=http://localhost:8000
```

See `.env.example` for reference.
