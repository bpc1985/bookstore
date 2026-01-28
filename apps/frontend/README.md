# Bookstore Frontend (Next.js)

Next.js 16 frontend for the Bookstore e-commerce application.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (New York style) with Radix UI
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand with persist middleware
- **Data Fetching**: TanStack React Query
- **Icons**: Lucide React
- **Notifications**: Sonner

## Getting Started

### From Monorepo Root

```bash
pnpm frontend:dev      # Start dev server
pnpm frontend:build    # Build for production
```

### From This Directory

```bash
pnpm dev               # Start dev server at http://localhost:3000
pnpm build             # Build for production
pnpm start             # Run production build
pnpm lint              # Run ESLint
pnpm typecheck         # Run TypeScript type checking
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Home page
│   ├── books/              # Book listing and details
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Checkout flow
│   ├── orders/             # Order history
│   ├── profile/            # User profile
│   ├── login/              # Authentication
│   └── admin/              # Admin dashboard
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── layout/             # Header, Footer, Providers
├── lib/
│   ├── api.ts              # API client class
│   └── utils.ts            # Utility functions (cn)
├── stores/
│   ├── auth.ts             # Authentication state
│   └── cart.ts             # Shopping cart state
└── types/                  # TypeScript interfaces
```

## Features

- **Book browsing** with search, category filters, and pagination
- **Shopping cart** with quantity management and stock validation
- **User authentication** with JWT (auto token refresh)
- **Order management** with status tracking
- **Book reviews** with verified purchase badges
- **Admin panel** for inventory, orders, and reviews

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

## Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

Configuration is in `components.json` (New York style, Lucide icons, CSS variables).

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@bookstore.com` | `admin123456` |
| User | `user@bookstore.com` | `user123456` |
