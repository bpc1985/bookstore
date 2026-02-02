---
trigger: ui_design
description: Design and implement UI components using Next.js 16, shadcn/ui, and Tailwind CSS with accessibility and responsive best practices
---

# Bookstore UI Design Skill

## Technology Stack
- **Framework**: Next.js 16 App Router
- **UI Library**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Notifications**: Sonner (toast)
- **Animations**: Framer Motion (optional)

## Core Design Principles

### 1. Component Patterns

#### Server Components (Default)
```typescript
// app/books/page.tsx
import { api } from '@/lib/api';
import { BookList } from '@/components/BookList';

export default async function BooksPage() {
  const books = await api.getBooks();
  return <BookList books={books} />;
}
```

#### Client Components (When Needed)
```typescript
'use client';
import { useState } from 'react';
import { toast } from 'sonner';

export function AddToCartButton({ bookId }: { bookId: number }) {
  const [loading, setLoading] = useState(false);
  
  const handleAdd = async () => {
    setLoading(true);
    try {
      await api.addToCart(bookId);
      toast.success('Added to cart');
    } catch (error) {
      toast.error('Failed to add item');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button onClick={handleAdd} disabled={loading}>
      {loading ? 'Adding...' : 'Add to Cart'}
    </Button>
  );
}
```

### 2. shadcn/ui Component Usage

#### Add Components
```bash
cd apps/frontend
npx shadcn@latest add button card input select dialog
```

#### Available Components
- Button (primary, secondary, ghost, outline, destructive)
- Card (with CardHeader, CardContent, CardFooter)
- Dialog (modal dialogs)
- Dropdown Menu
- Form (with React Hook Form)
- Input, Textarea, Select
- Toast/Sonner
- Badge
- Avatar

### 3. Responsive Design

#### Mobile-First Approach
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* Book cards */}
</div>
```

#### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: 1024px - 1280px
- Large: > 1280px

### 4. Typography

#### Font Hierarchy
```typescript
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Page title
<h1 className="text-4xl font-bold tracking-tight">
  All Books
</h1>

// Section heading
<h2 className="text-2xl font-semibold">
  Featured
</h2>

// Card title
<h3 className="text-lg font-medium">
  Book Title
</h3>

// Body text
<p className="text-sm text-muted-foreground">
  Description
</p>
```

### 5. Color System

#### Using CSS Variables (from shadcn/ui)
```typescript
// Primary actions
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">

// Secondary actions
<Button variant="secondary" className="bg-secondary text-secondary-foreground">

// Destructive actions
<Button variant="destructive" className="bg-destructive text-destructive-foreground">

// Ghost/hover states
<Button variant="ghost" className="hover:bg-accent hover:text-accent-foreground">
```

#### Custom Colors for Bookstore
```css
/* apps/frontend/src/app/globals.css */
@layer base {
  :root {
    --brand-gold: #D4AF37;
    --brand-dark: #1a1a2e;
    --brand-light: #f8f9fa;
  }
}
```

### 6. Accessibility Standards

#### Focus Management
```typescript
// All interactive elements must be keyboard accessible
<button className="focus:ring-2 focus:ring-primary focus:outline-none">
  Click
</button>
```

#### Alt Text
```typescript
<Image
  src={book.coverImage}
  alt={book.title}
  width={200}
  height={300}
  className="object-cover rounded-lg"
/>
```

#### ARIA Labels
```typescript
<button aria-label="Add book to cart">
  <ShoppingCart />
</button>
```

### 7. Loading & Error States

#### Loading Skeletons
```typescript
import { Skeleton } from '@/components/ui/skeleton';

export function BookListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
```

#### Error Boundaries
```typescript
'use client';
import { Component, ReactNode } from 'react';

interface Props { children: ReactNode }

export class ErrorBoundary extends Component<Props, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Something went wrong</h2>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 8. Form Patterns

#### With React Hook Form + Zod
```typescript
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export function LoginForm() {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    await api.login(data.email, data.password);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Login</Button>
      </form>
    </Form>
  );
}
```

### 9. Book Card Component

```typescript
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Book } from '@bookstore/types';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <Link href={`/books/${book.id}`}>
        <div className="relative aspect-[2/3]">
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute top-2 right-2">
            <Badge>${book.price}</Badge>
          </div>
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/books/${book.id}`}>
          <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mt-1">{book.author}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <AddToCartButton bookId={book.id} />
      </CardFooter>
    </Card>
  );
}
```

### 10. Navigation Patterns

#### Navbar
```typescript
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-xl">
            Bookstore
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <NavLink href="/books" pathname={pathname}>Books</NavLink>
            <NavLink href="/cart" pathname={pathname}>Cart</NavLink>
            {user ? (
              <>
                <NavLink href="/orders" pathname={pathname}>Orders</NavLink>
                <Button variant="ghost" onClick={logout}>Logout</Button>
              </>
            ) : (
              <NavLink href="/login" pathname={pathname}>Login</NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

### 11. Admin Dashboard Layout

```typescript
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/10">
      <aside className="w-64 border-r bg-card h-screen fixed left-0 top-0">
        <nav className="p-4 space-y-2">
          <AdminNavLink href="/admin" icon={LayoutDashboard}>Dashboard</AdminNavLink>
          <AdminNavLink href="/admin/books" icon={Book}>Books</AdminNavLink>
          <AdminNavLink href="/admin/orders" icon={ShoppingBag}>Orders</AdminNavLink>
          <AdminNavLink href="/admin/users" icon={Users}>Users</AdminNavLink>
        </nav>
      </aside>
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
```

## Design System Checklist

Before implementing a new UI component:

- [ ] Server Component used unless hooks/events are needed
- [ ] Responsive breakpoints tested (mobile, tablet, desktop)
- [ ] Loading states provided for async operations
- [ ] Error states handled gracefully
- [ ] Accessibility: focus states, alt text, ARIA labels
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Touch targets minimum 44x44px on mobile
- [ ] Forms validated with Zod
- [ ] Toast notifications for user feedback
- [ ] Next.js Image component for all images
- [ ] Consistent with shadcn/ui design tokens
