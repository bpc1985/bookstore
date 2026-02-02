---
trigger: model_decision
description: Develop with Next.js 16 App Router, Server Components, and the project's auth/API patterns
---

# Next.js Frontend Development

## Data Fetching Strategy

### Server Components (Default)

Fetch data directly in `page.tsx` using the API client:

```typescript
// app/books/page.tsx
import { api } from '@/lib/api';

export default async function BooksPage() {
  const books = await api.getBooks();
  return <BookList books={books} />;
}
```

### Client Components

Use `'use client'` only when hooks, events, or browser APIs are needed:

```typescript
'use client';

import { useAuthStore } from '@/stores/auth';

export function AddToCartButton({ bookId }: { bookId: number }) {
  const { user } = useAuthStore();
  // ... event handlers
}
```

### API Routes Policy

- **Forbidden**: DO NOT create internal API routes (`app/api/...`) for frontend data fetching
- **Allowed**: API routes only for external webhooks or third-party integrations
- **Pattern**: Use Server Components or call the FastAPI backend directly via `lib/api.ts`

## State Management

### Zustand Stores

The project uses Zustand for client-side state:

```typescript
// Auth state - stores/auth.ts
const { user, isAuthenticated, login, logout } = useAuthStore();

// Cart state - stores/cart.ts
const { items, addItem, removeItem, clearCart } = useCartStore();
```

### When to Use Stores vs Props

| Use Store | Use Props |
|-----------|-----------|
| Auth state (user, tokens) | Data from Server Components |
| Cart state | Component-specific data |
| Global UI state | Parent-to-child data flow |

## API Client Pattern

All API calls go through `lib/api.ts`:

```typescript
import { api } from '@/lib/api';

// The client handles auth headers automatically
const books = await api.getBooks();
const user = await api.login(email, password);
```

**Token management**: Auth store automatically sets the access token on the API client via `api.setAccessToken()`.

## Component Patterns

### Server vs Client Decision

```
Does it need hooks (useState, useEffect)?     → Client Component
Does it need event handlers (onClick)?        → Client Component
Does it need browser APIs (localStorage)?     → Client Component
Does it only render data?                     → Server Component (default)
```

### Composing Server and Client

```typescript
// app/books/[id]/page.tsx (Server Component)
export default async function BookPage({ params }: { params: { id: string } }) {
  const book = await api.getBook(params.id);

  return (
    <div>
      <BookDetails book={book} />           {/* Server */}
      <AddToCartButton bookId={book.id} />  {/* Client */}
      <ReviewSection bookId={book.id} />    {/* Client */}
    </div>
  );
}
```

## Performance Optimization

### Images

Always use `next/image` for optimization:

```typescript
import Image from 'next/image';

<Image
  src={book.coverImage}
  alt={book.title}
  width={200}
  height={300}
  className="object-cover"
/>
```

### Fonts

Use `next/font` for optimized font loading:

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
```

### Metadata

Define metadata for SEO:

```typescript
// Static metadata
export const metadata: Metadata = {
  title: 'Books | Bookstore',
  description: 'Browse our collection',
};

// Dynamic metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const book = await api.getBook(params.id);
  return {
    title: `${book.title} | Bookstore`,
    description: book.description,
  };
}
```

## UI Components

### shadcn/ui

Add components using:

```bash
npx shadcn@latest add button card dialog
```

Components are in `src/components/ui/` and use Tailwind CSS with CSS variables for theming.

### Notifications

Use Sonner for toast notifications:

```typescript
import { toast } from 'sonner';

toast.success('Item added to cart');
toast.error('Failed to add item');
```

## Route Structure Reference

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Home with featured books | No |
| `/books` | Book listing with search | No |
| `/books/[id]` | Book detail with reviews | No |
| `/cart` | Shopping cart | No |
| `/checkout` | Checkout flow | Yes |
| `/orders` | Order history | Yes |
| `/profile` | User profile | Yes |
| `/admin/*` | Admin dashboard | Admin role |

## Checklist

Before completing a feature:

- [ ] Server Components used by default
- [ ] `'use client'` added only when necessary
- [ ] No internal API routes created for frontend data
- [ ] Images use `next/image`
- [ ] Metadata defined for SEO
- [ ] Loading and error states handled
- [ ] Auth checks applied where needed
