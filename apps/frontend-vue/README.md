# Bookstore Frontend (Vue)

Vue 3 frontend for the Bookstore e-commerce application.

## Tech Stack

- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **UI Components**: [shadcn-vue](https://www.shadcn-vue.com/) with Radix Vue
- **Styling**: Tailwind CSS 4
- **State Management**: Pinia with persistence plugin
- **Data Fetching**: TanStack Vue Query
- **Routing**: Vue Router
- **Icons**: Lucide Vue
- **Notifications**: Vue Sonner

## Getting Started

### From Monorepo Root

```bash
pnpm frontend-vue:dev      # Start dev server
pnpm frontend-vue:build    # Build for production
```

### From This Directory

```bash
pnpm dev               # Start dev server at http://localhost:3001
pnpm build             # Build for production
pnpm preview           # Preview production build
pnpm lint              # Run ESLint
```

## Project Structure

```
src/
├── views/                  # Page components
│   ├── HomeView.vue        # Home page
│   ├── BooksView.vue       # Book listing
│   ├── BookDetailView.vue  # Book details
│   ├── CartView.vue        # Shopping cart
│   ├── CheckoutView.vue    # Checkout flow
│   ├── OrdersView.vue      # Order history
│   └── admin/              # Admin pages
├── components/
│   ├── ui/                 # shadcn-vue components
│   └── layout/             # Header, Footer
├── composables/            # Vue composables
├── lib/
│   ├── api.ts              # API client
│   └── utils.ts            # Utility functions
├── stores/
│   ├── auth.ts             # Authentication state (Pinia)
│   └── cart.ts             # Shopping cart state (Pinia)
├── router/
│   └── index.ts            # Vue Router with auth guards
└── types/                  # TypeScript interfaces
```

## Auto-Imports

This project uses `unplugin-auto-import` and `unplugin-vue-components`:

- **Vue APIs** (`ref`, `computed`, `onMounted`, etc.) are auto-imported
- **Vue Router** functions (`useRouter`, `useRoute`) are auto-imported
- **Pinia** functions (`storeToRefs`) are auto-imported
- **VueUse** composables are auto-imported
- **All components** in `src/components/` are auto-resolved

Generated type files (do not edit):
- `src/auto-imports.d.ts`
- `src/components.d.ts`

## Route Guards

Routes use meta properties for protection:

```typescript
meta: { requiresAuth: true }              // Requires login
meta: { requiresAuth: true, requiresAdmin: true }  // Requires admin
```

Guard logic is in `router.beforeEach()` in `src/router/index.ts`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

## Adding shadcn-vue Components

```bash
npx shadcn-vue@latest add <component-name>
```

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@bookstore.com` | `admin123456` |
| User | `user@bookstore.com` | `user123456` |
