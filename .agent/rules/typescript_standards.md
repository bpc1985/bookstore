---
trigger: model_decision
description: TypeScript coding standards for type safety and consistency
---

# TypeScript Standards

## Type Safety Rules

### No Implicit Any

Every variable, parameter, and return type must be explicitly typed or inferable:

```typescript
// WRONG
function processItem(item) { ... }
const data = response.json();

// CORRECT
function processItem(item: Book): void { ... }
const data: BookResponse = await response.json();
```

### Use Shared Types

Import types from `@bookstore/types` instead of redefining:

```typescript
// WRONG - Redefining types
interface Book {
  id: number;
  title: string;
}

// CORRECT - Import from shared package
import type { Book, User, Order } from '@bookstore/types';
```

### Type-Only Imports

Use `import type` for type-only imports:

```typescript
// CORRECT
import type { Book, Category } from '@bookstore/types';
import { api } from '@/lib/api';
```

## Type Definition Patterns

### Discriminated Unions for State

```typescript
// CORRECT - Discriminated union
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Usage
function handleState(state: RequestState<Book>) {
  switch (state.status) {
    case 'success':
      return state.data.title; // TypeScript knows data exists
    case 'error':
      return state.error.message; // TypeScript knows error exists
  }
}
```

### Component Props

```typescript
// Define explicit prop types
interface BookCardProps {
  book: Book;
  onAddToCart?: (bookId: number) => void;
  className?: string;
}

export function BookCard({ book, onAddToCart, className }: BookCardProps) {
  // ...
}
```

### API Response Types

```typescript
// Use generics for paginated responses
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// Usage
const response: PaginatedResponse<Book> = await api.getBooks(page, size);
```

## Validation at Boundaries

Validate external data at system boundaries:

### API Responses

```typescript
import { z } from 'zod';

const BookSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number().positive(),
});

// Validate API response
const book = BookSchema.parse(await response.json());
```

### Form Data

```typescript
const CheckoutSchema = z.object({
  email: z.string().email(),
  address: z.string().min(10),
  cardNumber: z.string().regex(/^\d{16}$/),
});

// Validate before submission
const result = CheckoutSchema.safeParse(formData);
if (!result.success) {
  setErrors(result.error.flatten().fieldErrors);
  return;
}
```

## Common Type Patterns

### Optional vs Nullable

```typescript
// Optional - may be undefined
interface User {
  name: string;
  avatar?: string; // string | undefined
}

// Nullable - explicitly null
interface Book {
  discount: number | null; // Can be null from API
}
```

### Record Types

```typescript
// For dynamic keys
type ErrorMap = Record<string, string>;

const errors: ErrorMap = {
  email: 'Invalid email',
  password: 'Too short',
};
```

### Utility Types

```typescript
// Partial - all properties optional
type BookUpdate = Partial<Book>;

// Pick - select specific properties
type BookSummary = Pick<Book, 'id' | 'title' | 'price'>;

// Omit - exclude properties
type BookCreate = Omit<Book, 'id' | 'createdAt'>;
```

## Build Requirements

### Before Committing

```bash
pnpm typecheck
```

**Goal: Zero TypeScript errors.**

### Common Errors and Fixes

| Error | Fix |
|-------|-----|
| `Type 'X' is not assignable to type 'Y'` | Check type compatibility, add conversion |
| `Property 'x' does not exist` | Add to type definition or use optional chaining `?.` |
| `Object is possibly 'undefined'` | Add null check or use non-null assertion `!` (sparingly) |
| `Cannot find module` | Check path, ensure package is installed |

## Anti-Patterns

```typescript
// AVOID: any type
const data: any = await fetch(...); // No type safety

// AVOID: Type assertions without validation
const user = response as User; // Trusting unvalidated data

// AVOID: Non-null assertion abuse
const name = user!.profile!.name!; // Hiding potential bugs

// PREFER: Proper null handling
const name = user?.profile?.name ?? 'Unknown';
```
