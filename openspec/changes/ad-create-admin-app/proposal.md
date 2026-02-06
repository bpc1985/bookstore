## Why

The current admin functionality is embedded within the customer-facing frontend app (`/admin` routes in `apps/frontend/`), mixing concerns and limiting the ability to scale admin features independently. A dedicated admin application will provide better separation of responsibilities, allow independent deployment/scaling, and enable role-specific features without impacting the customer experience. The backend already provides comprehensive admin APIs at `/admin/*`, so this change completes the separation by creating a dedicated frontend.

## What Changes

- Create new Next.js 16 application at `apps/admin/` with its own independent build, dev server, and routing
- Set up shared dependencies between `apps/frontend/` and `apps/admin/` via `packages/ui/` (optional) and existing `packages/types/`
- Migrate existing admin pages from `apps/frontend/src/app/admin/` to `apps/admin/src/app/`:
  - Dashboard overview
  - Books management (list, detail, create, edit, delete)
  - Orders management (list, detail, status updates)
- Implement new admin capabilities:
  - Categories CRUD management
  - Reviews moderation (approve/reject)
  - Users management and role assignment
- Add admin dashboard widgets using Recharts:
  - Total books, authors, categories, users (stat cards)
  - Books per category (pie/bar chart)
  - Recently added books (line chart)
  - User growth (line chart over time)
- Update monorepo configuration (`pnpm-workspace.yaml`, `turbo.json`, root `package.json`) with admin-specific scripts
- Create admin-specific API client (`lib/api.ts`) for backend admin endpoints
- Set up admin authentication flow with admin role validation

## Capabilities

### New Capabilities
- `admin-dashboard`: Overview page displaying key metrics (total books, authors, categories, users) and interactive charts (books per category, recent additions, user growth)
- `admin-books`: Complete CRUD operations for book management including list, view, create, edit, delete with category assignment and image handling
- `admin-categories`: Full CRUD for category management with parent-child relationships
- `admin-orders`: Order listing, detail view, and status updates (pending → paid → shipped → completed/cancelled)
- `admin-reviews`: Review moderation dashboard to approve or reject user-submitted reviews
- `admin-users`: User management with ability to view users, update roles, and manage user status
- `admin-auth`: Admin-specific authentication flow with role validation ensuring only users with `admin` role can access

### Modified Capabilities

## Impact

**Affected Code:**
- New directory: `apps/admin/` with full Next.js app structure
- Existing admin routes in `apps/frontend/src/app/admin/` will be removed after migration
- Monorepo config files: `pnpm-workspace.yaml`, `turbo.json`, root `package.json`
- Optional: Create `packages/ui/` for shared shadcn/ui components between frontend and admin

**Dependencies:**
- New dependencies for admin app: Next.js 16, React 19, Tailwind CSS, shadcn/ui, Zustand, Recharts
- Shared dependencies: `@bookstore/types` package

**Scripts (to be added to root package.json):**
- `pnpm admin:dev` - Start admin dev server at separate port (e.g., 3001)
- `pnpm admin:build` - Build admin app
- `pnpm admin:lint` - Lint admin app
- `pnpm admin:typecheck` - Type check admin app

**Backend:**
- No changes required - admin API endpoints already exist at `/admin/*`
