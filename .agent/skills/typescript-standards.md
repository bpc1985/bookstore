---
trigger: typescript_standards
description: Follow TypeScript best practices, type safety rules, and project-specific conventions
---

# TypeScript Standards Skill

## Project Configuration

### Type Checking Command
```bash
pnpm typecheck
```

### tsconfig.json Structure
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"],
      "@bookstore/types": ["../../packages/types/src"]
    },
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Type Safety Rules

### 1. No Implicit Any

**Never** use `any` type. Use `unknown` or `Record<string, unknown>` for unknown data:

```typescript
// ❌ Wrong
function processData(data: any) { }

// ✅ Correct
function processData(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
  throw new Error('Invalid data');
}
```

### 2. Use Type Assertions Carefully

Prefer type guards over assertions:

```typescript
// ❌ Wrong - Unsafe assertion
const value = unknownData as string;

// ✅ Correct - Type guard
if (typeof unknownData === 'string') {
  const value = unknownData; // Type is narrowed to string
}
```

### 3. Prefer Interface for Object Shapes

```typescript
// ✅ Use interface for public API
interface Book {
  id: number;
  title: string;
  author: string;
}

// ✅ Use type for unions, tuples, and utilities
type BookOrMovie = Book | Movie;
type Coordinates = [number, number];
```

### 4. Use Discriminated Unions

```typescript
// ✅ Discriminated union
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleResponse<T>(response: ApiResponse<T>) {
  if (response.success) {
    return response.data; // Type is T
  }
  throw new Error(response.error);
}
```

## Shared Types Package

Import types from `@bookstore/types` instead of defining locally:

```typescript
// ✅ Correct - Import from shared package
import type { Book, User, Cart, Order } from '@bookstore/types';

// ❌ Wrong - Redefining locally
interface Book {
  id: number;
  title: string;
}
```

## Component Typing

### 1. Props Interface

```typescript
// ✅ Use interface for props
interface BookCardProps {
  book: Book;
  onAddToCart?: (bookId: number) => void;
  priority?: boolean;
}

export function BookCard({ book, onAddToCart, priority = false }: BookCardProps) {
  // ...
}
```

### 2. Generic Components

```typescript
// ✅ Generic component with constraints
interface ListProps<T extends { id: string | number }> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

export function List<T extends { id: string | number }>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>;
}
```

### 3. Children Prop

```typescript
// ✅ Explicitly type children
interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
}

export function Card({ children, header }: CardProps) {
  return (
    <div className="card">
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
    </div>
  );
}
```

## API Client Typing

### 1. Typed API Client

```typescript
// lib/api.ts
import type {
  Book,
  User,
  Cart,
  Order,
  CreateBookRequest,
  UpdateBookRequest,
  LoginRequest,
} from '@bookstore/types';

class ApiClient {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL!;
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  async getBooks(): Promise<Book[]> {
    const response = await fetch(`${this.baseUrl}/books`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch books');
    return response.json();
  }

  async getBook(id: number): Promise<Book> {
    const response = await fetch(`${this.baseUrl}/books/${id}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Book not found');
    return response.json();
  }

  async createBook(data: CreateBookRequest): Promise<Book> {
    const response = await fetch(`${this.baseUrl}/books`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create book');
    return response.json();
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }
}

export const api = new ApiClient();
```

## Zustand Store Typing

```typescript
// stores/auth.ts
import type { User } from '@bookstore/types';
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken }),
  clearAuth: () =>
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
}));
```

## Form Typing (React Hook Form + Zod)

```typescript
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Zod schema
const bookFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  author: z.string().min(1, 'Author is required'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  category_id: z.number().optional(),
  description: z.string().optional(),
});

// Infer TypeScript type from Zod schema
type BookFormData = z.infer<typeof bookFormSchema>;

// Use in component
export function BookForm() {
  const form = useForm<BookFormData>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: '',
      author: '',
      price: 0,
      stock: 0,
    },
  });

  const onSubmit = async (data: BookFormData) => {
    await api.createBook(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

## Server Components Typing

```typescript
// app/books/[id]/page.tsx
import { api } from '@/lib/api';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function BookPage({ params }: PageProps) {
  const book = await api.getBook(Number(params.id));
  return <BookDetail book={book} />;
}

// For metadata generation
export async function generateMetadata({ params }: PageProps) {
  const book = await api.getBook(Number(params.id));
  return {
    title: book.title,
    description: book.description,
  };
}
```

## Utility Types

### 1. Common Utility Types

```typescript
// Make all properties optional recursively
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Extract array item type
type ArrayItem<T> = T extends (infer U)[] ? U : never;

// Extract promise resolved type
type AsyncReturnType<T> = T extends Promise<infer U> ? U : never;

// Make specific keys required
type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
```

### 2. Project-Specific Utilities

```typescript
// lib/types.ts
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type ApiError = {
  detail: string;
  status?: number;
};
```

## Type Guards

```typescript
// lib/type-guards.ts
export function isBook(value: unknown): value is Book {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'author' in value
  );
}

export function isValidBookId(id: unknown): id is number {
  return typeof id === 'number' && Number.isInteger(id) && id > 0;
}

// Usage
function processBook(data: unknown) {
  if (isBook(data)) {
    console.log(data.title); // Type is Book
  }
}
```

## Error Handling Typing

```typescript
// lib/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Use in API client
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError('Request failed', response.status, error.detail);
  }
  return response.json();
}
```

## Type Safety Checklist

Before committing code:

- [ ] `pnpm typecheck` passes with zero errors
- [ ] No `any` types used (use `unknown` instead)
- [ ] All functions have explicit return types
- [ ] All props are typed with interfaces
- [ ] Types imported from `@bookstore/types` when available
- [ ] Type assertions minimized; type guards preferred
- [ ] Discriminated unions used for alternatives
- [ ] Zod schemas for runtime validation
- [ ] API client methods have correct return types
- [ ] Zustand stores are properly typed
- [ ] Server component params are typed
- [ ] No implicit `any` in config files
- [ ] Strict mode enabled in tsconfig.json
