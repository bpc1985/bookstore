## Context

**Current State:**
- Admin functionality exists as routes within the customer-facing frontend app at `apps/frontend/src/app/admin/`
- Backend provides comprehensive admin APIs at `/admin/*` (orders, analytics, reviews)
- Frontend uses Next.js 16, shadcn/ui, Zustand, and connects to FastAPI backend
- Monorepo structure with `apps/frontend/`, `apps/backend/`, and `packages/types/`

**Constraints:**
- Must integrate with existing backend admin APIs (no backend changes)
- Should leverage existing infrastructure and patterns where possible
- Need to maintain separation between customer and admin experiences
- Admin users must have `admin` role to access the app

**Stakeholders:**
- Store administrators who need to manage books, orders, users, and reviews
- Developers who need to maintain and extend the admin system
- Customers (indirectly benefit from improved book/order management)

## Goals / Non-Goals

**Goals:**
- Create a standalone Next.js 16 admin application at `apps/admin/` independent of the customer app
- Provide comprehensive CRUD operations for all admin resources (books, categories, orders, reviews, users)
- Implement a rich dashboard with key metrics and interactive charts using Recharts
- Share common infrastructure (types, utilities) with the customer app where possible
- Ensure proper authentication with admin role validation
- Set up monorepo scripts for admin development, build, linting, and testing

**Non-Goals:**
- Backend API modifications (admin endpoints already exist)
- Creation of a shared UI package in phase 1 (components will be duplicated initially, can extract later)
- Complex permission/role system beyond admin vs user roles
- Advanced analytics beyond basic charts and widgets
- Multi-tenant or multi-admin store support

## Decisions

### 1. Separate Next.js Application

**Decision:** Create `apps/admin/` as a fully independent Next.js 16 application with its own `package.json`, `next.config.js`, and configuration.

**Rationale:**
- Provides complete separation of concerns between customer and admin concerns
- Enables independent deployment, scaling, and versioning
- Prevents admin-specific code from bloating the customer app bundle
- Allows for admin-specific configurations (different port, different middleware, etc.)

**Alternatives Considered:**
- *Keep admin in customer app*: Rejected due to mixed concerns and bundle size
- *Use Next.js multi-zone deployment*: Rejected as overly complex for this use case

### 2. Admin Dev Server on Port 3001

**Decision:** Run admin development server on port 3001 (customer app on 3000) via `pnpm admin:dev`.

**Rationale:**
- Simple and straightforward separation
- Avoids port conflicts with customer app
- Makes it easy to run both apps simultaneously during development
- Clear distinction: `localhost:3000` for customers, `localhost:3001` for admins

**Alternatives Considered:**
- *Use subdomain routing*: Rejected as overkill for development
- *Use same port with route guards*: Rejected due to potential conflicts

### 3. Duplicate UI Components Initially

**Decision:** Copy shadcn/ui components from `apps/frontend/` to `apps/admin/` rather than creating a shared `packages/ui/` immediately.

**Rationale:**
- Faster initial implementation (no package creation/maintenance overhead)
- Simpler monorepo structure
- Allows admin app to evolve independently (may need different customizations)
- Can extract shared components to a package later if duplication becomes problematic
- Frontend and admin may diverge in UI requirements over time

**Alternatives Considered:**
- *Create `packages/ui/` immediately*: Rejected as premature optimization without clear duplication patterns yet

### 4. Shared Types via @bookstore/types

**Decision:** Use existing `@bookstore/types` package for shared TypeScript interfaces (User, Book, Order, etc.).

**Rationale:**
- Already exists and is maintained
- Ensures type consistency across frontend, admin, and backend
- Reduces duplication of type definitions
- Single source of truth for data contracts

**Alternatives Considered:**
- *Duplicate types in admin*: Rejected due to inconsistency risk
- *Create separate admin types package*: Rejected as unnecessary complexity

### 5. Separate Admin API Client

**Decision:** Create `apps/admin/src/lib/api.ts` with admin-specific API methods that call backend `/admin/*` endpoints.

**Rationale:**
- Clear separation of customer vs admin API concerns
- Simpler than extending the existing frontend API client
- Allows for admin-specific error handling and logic
- Prevents accidental use of customer endpoints in admin context

**API Methods to Implement:**
- `getAnalytics()` - Dashboard metrics
- `getAdminOrders()` - List all orders
- `getAdminOrder()` - Get order details
- `updateOrderStatus()` - Update order status
- `listPendingReviews()` - Get pending reviews
- `approveReview()` - Approve/reject review
- Plus existing CRUD methods for books, categories, users

**Alternatives Considered:**
- *Extend frontend API client*: Rejected due to mixed concerns

### 6. Separate Admin Auth Store

**Decision:** Create `apps/admin/src/stores/auth.ts` (Zustand) with admin role validation.

**Rationale:**
- Separates admin authentication state from customer authentication
- Allows for different auth flows if needed (e.g., different redirect behavior)
- Simplifies role checking (admin can check `user.role === 'admin'` centrally)
- Independent persistence and token management

**Pattern:**
```typescript
- Check on app init: if not admin, redirect to login
- Middleware/route guards to protect all admin routes
- Reuse existing JWT token exchange with backend
- Redirect to admin login page if unauthorized
```

**Alternatives Considered:**
- *Share auth store with frontend*: Rejected due to different roles and flows

### 7. Chart Library: Recharts

**Decision:** Use Recharts for all dashboard charts and visualizations.

**Rationale:**
- React-native and integrates well with Next.js
- Declarative API similar to other React charting libraries
- Good documentation and community support
- Supports required chart types: pie, bar, line
- Compatible with shadcn/ui styling approach

**Charts to Implement:**
- Books per category: Pie chart
- Recently added books: Line chart (last 30 days)
- User growth: Line chart (last 6 months)

**Alternatives Considered:**
- *Chart.js*: Rejected as React wrapper adds complexity
- *Victory*: Rejected as Recharts is more popular and better documented

### 8. App Structure Mirrors Frontend

**Decision:** Structure `apps/admin/` similarly to `apps/frontend/` for consistency.

**Structure:**
```
apps/admin/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── /             # Dashboard
│   │   ├── /books/       # Books CRUD
│   │   ├── /categories/  # Categories CRUD
│   │   ├── /orders/      # Orders management
│   │   ├── /reviews/     # Review moderation
│   │   ├── /users/       # User management
│   │   └── /login/       # Admin login
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   └── layout/       # Admin layout (sidebar, header)
│   ├── lib/
│   │   ├── api.ts        # Admin API client
│   │   └── utils.ts      # Utility functions
│   └── stores/
│       └── auth.ts       # Admin auth store
├── public/               # Static assets
└── package.json
```

**Rationale:**
- Familiar structure for developers working on both apps
- Consistent patterns for routing, components, and state management
- Makes onboarding easier

## Risks / Trade-offs

**Risk: Component Duplication Maintenance**
- **Mitigation:** Document shared components clearly. If duplication becomes problematic, extract to `packages/ui/` in a future change. Use TypeScript to catch inconsistencies.

**Risk: Admin App Bundle Size**
- **Mitigation:** Code splitting for routes, lazy loading of chart components, and tree-shaking for Recharts. Monitor bundle size during build.

**Trade-off: Separate Auth vs Shared Auth**
- Using separate auth stores means users need to log in separately to admin vs customer app
- **Justification:** Acceptable for this use case (admins and customers are typically different users with different sessions)

**Risk: Development Friction**
- Developers need to run two dev servers simultaneously to work on both apps
- **Mitigation:** Clear documentation in root README. Use Turbo's persistent task caching to optimize startup.

**Risk: API Client Code Duplication**
- Frontend and admin will have similar API client code (request handling, token injection)
- **Mitigation:** Extract common request logic to `packages/lib/` or `@bookstore/utils` if duplication becomes significant.

**Risk: Deployment Complexity**
- Need to deploy two separate frontend apps instead of one
- **Mitigation:** Use CI/CD with parallel builds. Document deployment process clearly. Consider using a reverse proxy for routing (admin.example.com vs example.com).

## Migration Plan

**Phase 1: Create Admin App Structure**
1. Create `apps/admin/` directory with Next.js scaffold
2. Set up `package.json` with dependencies (Next.js, React, shadcn/ui, Zustand, Recharts)
3. Configure `next.config.js`, `tailwind.config.js`, `tsconfig.json`
4. Copy shadcn/ui components from `apps/frontend/` to `apps/admin/`
5. Set up basic routing structure

**Phase 2: Implement Authentication**
1. Create admin auth store with role validation
2. Implement admin login page
3. Add middleware/route guards to protect all routes
4. Test with existing admin credentials

**Phase 3: Migrate Admin Pages from Frontend**
1. Move dashboard page to admin app
2. Move books management pages to admin app
3. Move orders management pages to admin app
4. Update API calls to use admin API client
5. Test all migrated functionality

**Phase 4: Implement New Admin Features**
1. Implement categories CRUD
2. Implement reviews moderation
3. Implement users management
4. Add dashboard widgets (stat cards)
5. Add charts using Recharts

**Phase 5: Monorepo Integration**
1. Update `pnpm-workspace.yaml` to include `apps/admin/`
2. Update `turbo.json` with admin tasks
3. Add admin scripts to root `package.json`:
   - `pnpm admin:dev` (port 3001)
   - `pnpm admin:build`
   - `pnpm admin:lint`
   - `pnpm admin:typecheck`
   - `pnpm admin:test`
4. Update root `README.md` with admin app documentation

**Phase 6: Cleanup**
1. Remove `/admin` routes from `apps/frontend/`
2. Add redirect from `/admin` in frontend to admin app URL (optional)
3. Update CLAUDE.md files with admin app guidance

**Rollback Strategy:**
- Keep `apps/frontend/src/app/admin/` until admin app is fully tested and deployed
- If issues arise, can quickly revert to using frontend admin routes
- Git tags can mark successful deployment points

## Open Questions

1. **Shared UI Package Timing:** Should `packages/ui/` be created in this change or deferred to a future change when duplication patterns are clearer?

2. **Port Configuration:** Should admin port be configurable via `.env` instead of hardcoded to 3001?

3. **Auth Redirect:** Should unauthorized users attempting to access admin routes be redirected to the admin login page or the customer home page?

4. **Chart Data Frequency:** How frequently should dashboard charts refresh? Real-time, on page load, or with a refresh interval?

5. **Testing Scope:** Should admin app have e2e tests in addition to unit tests with Vitest?
