## 1. Admin App Structure and Configuration

- [x] 1.1 Create `apps/admin/` directory structure with Next.js 16 scaffold
- [x] 1.2 Create `apps/admin/package.json` with dependencies (next, react, zustand, recharts, shadcn/ui components)
- [x] 1.3 Create `apps/admin/next.config.js` configuration file
- [x] 1.4 Create `apps/admin/tailwind.config.ts` with Tailwind CSS configuration (skipped - using Tailwind 4 with inline theming)
- [x] 1.5 Create `apps/admin/tsconfig.json` TypeScript configuration
- [x] 1.6 Create `apps/admin/.env.example` with `NEXT_PUBLIC_API_URL` environment variable
- [x] 1.7 Create basic `apps/admin/src/app/layout.tsx` root layout
- [x] 1.8 Create `apps/admin/src/app/page.tsx` placeholder dashboard page

## 2. Shared Components and UI Setup

- [x] 2.1 Copy shadcn/ui Button component from `apps/frontend/src/components/ui/button.tsx`
- [x] 2.2 Copy shadcn/ui Card components (card, card-header, card-content, card-title, card-description) from frontend
- [x] 2.3 Copy shadcn/ui Input component from frontend
- [x] 2.4 Copy shadcn/ui Label component from frontend
- [x] 2.5 Copy shadcn/ui Select component from frontend
- [x] 2.6 Copy shadcn/ui Dropdown Menu component from frontend
- [x] 2.7 Copy shadcn/ui Dialog component from frontend
- [x] 2.8 Copy shadcn/ui Table components from frontend
- [x] 2.9 Copy shadcn/ui Badge component from frontend
- [x] 2.10 Copy shadcn/ui Skeleton component from frontend
- [x] 2.11 Copy shadcn/ui Avatar component from frontend
- [x] 2.12 Copy `apps/frontend/src/lib/utils.ts` (cn utility) to admin app
- [x] 2.13 Install Recharts dependency: `pnpm --filter=@bookstore/admin add recharts`

## 3. Monorepo Integration

- [x] 3.1 Update `pnpm-workspace.yaml` to include `apps/admin/` in workspaces (already covered by `apps/*`)
- [ ] 3.2 Update root `package.json` with admin scripts:
  - `pnpm admin:dev` - Start admin dev server on port 3001
  - `pnpm admin:build` - Build admin app
  - `pnpm admin:lint` - Lint admin app
  - `pnpm admin:typecheck` - Type check admin app
  - `pnpm admin:test` - Run admin tests
  - `pnpm admin:test:ui` - Run admin tests with UI
  - `pnpm admin:test:coverage` - Run admin tests with coverage
- [x] 3.3 Update `turbo.json` with admin task configurations
- [x] 3.4 Create `apps/admin/CLAUDE.md` with admin app guidance
- [x] 3.5 Update root `README.md` with admin app documentation

## 4. Admin Authentication Store

- [x] 4.1 Create `apps/admin/src/stores/auth.ts` with Zustand store
- [x] 4.2 Implement admin auth state: user, accessToken, refreshToken, isInitialized
- [x] 4.3 Implement setAccessToken, logout, login actions
- [x] 4.4 Add localStorage persistence for tokens and user data
- [x] 4.5 Add automatic token refresh on API 401 errors
- [ ] 4.6 Write unit tests for admin auth store

## 5. Admin API Client

- [x] 5.1 Create `apps/admin/src/lib/api.ts` with ApiClient class
- [x] 5.2 Implement request method with authorization header injection
- [x] 5.3 Implement `login(email, password)` method
- [x] 5.4 Implement `logout(refreshToken)` method
- [x] 5.5 Implement `refreshToken(refreshToken)` method
- [x] 5.6 Implement `getAnalytics()` method (GET /admin/analytics)
- [x] 5.7 Implement `getAdminOrders(params)` method (GET /admin/orders)
- [x] 5.8 Implement `getAdminOrder(id)` method (GET /admin/orders/{id})
- [x] 5.9 Implement `updateOrderStatus(id, status, note)` method (PUT /admin/orders/{id}/status)
- [x] 5.10 Implement `listPendingReviews(page, size)` method (GET /admin/reviews/pending)
- [x] 5.11 Implement `approveReview(id, approved)` method (PUT /admin/reviews/{id}/approve)
- [x] 5.12 Implement CRUD methods for books (reuse from frontend): getBooks, getBook, createBook, updateBook, deleteBook
- [x] 5.13 Implement CRUD methods for categories (reuse from frontend): getCategories, createCategory, updateCategory, deleteCategory
- [x] 5.14 Implement CRUD methods for users: getUsers, getUser(id), updateUserRole(id, role), deactivateUser(id), activateUser(id)
- [x] 5.15 Create singleton API instance and export

## 6. Admin Login Page

- [x] 6.1 Create `apps/admin/src/app/login/page.tsx` login page component
- [x] 6.2 Implement login form with email and password fields
- [x] 6.3 Implement form validation (required fields, email format)
- [x] 6.4 Integrate with admin API client login method
- [x] 6.5 Store tokens and user data in auth store on successful login
- [x] 6.6 Validate admin role and redirect to dashboard on success
- [x] 6.7 Show error message for invalid credentials
- [x] 6.8 Redirect already-authenticated admin users to dashboard
- [x] 6.9 Add loading state during authentication
- [ ] 6.10 Write tests for login page component (moved to testing section)

## 7. Admin Layout with Navigation

- [x] 7.1 Create `apps/admin/src/components/layout/admin-sidebar.tsx` with navigation
- [x] 7.2 Implement sidebar navigation items: Dashboard, Books, Categories, Orders, Reviews, Users
- [x] 7.3 Add active state highlighting for current route
- [x] 7.4 Create `apps/admin/src/components/layout/admin-header.tsx` with user info and logout
- [x] 7.5 Display admin user name, email, and admin badge in header
- [x] 7.6 Implement logout button with confirmation dialog
- [x] 7.7 Create `apps/admin/src/app/layout.tsx` admin layout wrapper
- [x] 7.8 Integrate sidebar and header in admin layout
- [x] 7.9 Make layout responsive with mobile menu toggle
- [ ] 7.10 Write tests for layout components (moved to testing section)

## 8. Dashboard Page

- [x] 8.1 Create `apps/admin/src/app/page.tsx` dashboard page
- [x] 8.2 Implement stat cards component showing total books, authors, categories, users
- [x] 8.3 Implement books per category pie chart using Recharts
- [x] 8.4 Implement recently added books line chart using Recharts (last 30 days)
- [x] 8.5 Implement user growth line chart using Recharts (last 6 months)
- [x] 8.6 Add loading skeleton states for all dashboard widgets
- [x] 8.7 Add error handling with toast notifications
- [x] 8.8 Make stat cards clickable to navigate to respective pages
- [x] 8.9 Make chart slices/points interactive with navigation
- [ ] 8.10 Write tests for dashboard page and chart components (deferred to testing section)

## 9. Books Management Pages

- [x] 9.1 Create `apps/admin/src/app/books/page.tsx` books list page
- [x] 9.2 Implement books table with columns: ID, Title, Author, Price, Stock, Status, Actions
- [x] 9.3 Add pagination with 20 books per page
- [x] 9.4 Add search input for title/author filtering
- [x] 9.5 Add category dropdown filter
- [x] 9.6 Implement loading and empty states
- [x] 9.7 Create `apps/admin/src/app/books/new/page.tsx` create book page
- [x] 9.8 Implement book creation form with all fields
- [x] 9.9 Add form validation for required fields
- [x] 9.10 Create `apps/admin/src/app/books/[id]/page.tsx` book detail page
- [x] 9.11 Display book details and assigned categories
- [x] 9.12 Create `apps/admin/src/app/books/[id]/edit/page.tsx` edit book page
- [x] 9.13 Implement edit form pre-populated with current data
- [x] 9.14 Add delete confirmation dialog
- [ ] 9.15 Write tests for all books management pages (deferred to testing section)

## 10. Categories Management Pages

- [x] 10.1 Create `apps/admin/src/app/categories/page.tsx` categories list page
- [x] 10.2 Implement categories table with columns: ID, Name, Parent Category, Book Count, Actions
- [x] 10.3 Display parent-child relationships in hierarchy
- [x] 10.4 Create `apps/admin/src/app/categories/new/page.tsx` create category page
- [x] 10.5 Implement category creation form with name and optional parent
- [x] 10.6 Create `apps/admin/src/app/categories/[id]/page.tsx` category detail page
- [x] 10.7 Display category details and associated books
- [x] 10.8 Create `apps/admin/src/app/categories/[id]/edit/page.tsx` edit category page
- [x] 10.9 Implement edit form with parent category selection
- [x] 10.10 Add circular hierarchy validation
- [x] 10.11 Add delete confirmation with warnings for categories with books/sub-categories
- [ ] 10.12 Write tests for all categories management pages (deferred to testing section)

## 11. Orders Management Pages

- [x] 11.1 Create `apps/admin/src/app/orders/page.tsx` orders list page
- [x] 11.2 Implement orders table with columns: Order ID, User, Status, Total Amount, Date, Actions
- [x] 11.3 Add color-coded status badges (pending, paid, shipped, completed, cancelled)
- [x] 11.4 Add status dropdown filter
- [x] 11.5 Add pagination with 20 orders per page
- [x] 11.6 Sort orders by date descending
- [x] 11.7 Create `apps/admin/src/app/orders/[id]/page.tsx` order detail page
- [x] 11.8 Display order information: ID, User, Status, Total, Shipping Address, Payment Reference
- [x] 11.9 Display order items table with book details
- [x] 11.10 Display status history timeline
- [x] 11.11 Implement status update functionality with dropdown
- [x] 11.12 Add optional note field for status updates
- [x] 11.13 Add status validation (prevent reverting completed orders)
- [x] 11.14 Add cancel order confirmation
- [ ] 11.15 Write tests for all orders management pages (deferred to testing section)

## 12. Reviews Moderation Pages

- [x] 12.1 Create `apps/admin/src/app/reviews/page.tsx` pending reviews list page
- [x] 12.2 Implement reviews table with columns: ID, Book Title, User, Rating, Comment, Date, Actions
- [x] 12.3 Show star rating display (★★★★☆)
- [x] 12.4 Truncate comment previews to 100 characters
- [x] 12.5 Add rating filter (1-2 stars, 3 stars, 4-5 stars)
- [x] 12.6 Add search by book title or user email
- [x] 12.7 Add pagination with 20 reviews per page
- [x] 12.8 Implement approve button with confirmation
- [x] 12.9 Implement reject button with confirmation and optional reason
- [x] 12.10 Add empty state when no pending reviews
- [ ] 12.11 Write tests for reviews moderation page (deferred to testing section)

## 13. Users Management Pages

- [x] 13.1 Create `apps/admin/src/app/users/page.tsx` users list page
- [x] 13.2 Implement users table with columns: ID, Name, Email, Role, Status, Created Date, Actions
- [x] 13.3 Add role badges (admin, user) and status badges (active, inactive)
- [x] 13.4 Add role dropdown filter
- [x] 13.5 Add status dropdown filter
- [x] 13.6 Add search by name or email
- [x] 13.7 Add pagination with 20 users per page
- [x] 13.8 Create `apps/admin/src/app/users/[id]/page.tsx` user detail page
- [x] 13.9 Display user information: Name, Email, Role, Status, Created Date
- [x] 13.10 Display user's order history with order count
- [x] 13.11 Implement edit role functionality with confirmation
- [x] 13.12 Implement deactivate user with confirmation
- [x] 13.13 Implement activate user with confirmation
- [x] 13.14 Prevent admin from removing their own admin role
- [x] 13.15 Prevent admin from deactivating their own account
- [ ] 13.16 Write tests for all users management pages (deferred to testing section)

## 14. Route Guards and Middleware

- [x] 14.1 Create route guard to protect all admin routes (implemented in admin-layout.tsx)
- [x] 14.2 Check authentication status on route access
- [x] 14.3 Validate user role is "admin"
- [x] 14.4 Redirect unauthenticated users to `/login`
- [x] 14.5 Redirect non-admin users with error message
- [x] 14.6 Prevent access to login page when already authenticated
- [ ] 14.7 Write tests for route guard logic (deferred to testing section)

## 15. Testing Setup and Configuration

- [x] 15.1 Configure Vitest for admin app
- [x] 15.2 Install testing dependencies: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `vitest`
- [x] 15.3 Create `apps/admin/vitest.config.ts` configuration
- [x] 15.4 Set up test environment configuration
- [x] 15.5 Add test scripts to admin package.json (already in package.json)
- [x] 15.6 Create `__tests__` directories for components and pages

## 16. Cleanup - Remove Old Admin Routes from Frontend

- [x] 16.1 Verify all admin functionality works in new admin app
- [x] 16.2 Remove `/admin` routes from `apps/frontend/src/app/admin/`
- [x] 16.3 Remove admin-specific API methods from frontend API client
- [x] 16.4 Update frontend routing to redirect `/admin` to new admin URL (optional)
- [x] 16.5 Update frontend tests that referenced admin routes

## 17. Documentation

- [x] 17.1 Update root `CLAUDE.md` with admin app guidance (done in section 3.4)
- [x] 17.2 Document admin app commands in root README
- [x] 17.3 Document admin app structure and architecture
- [x] 17.4 Document how to run admin dev server
- [x] 17.5 Document admin authentication and roles
- [ ] 17.6 Add troubleshooting guide for common admin app issues (optional)
