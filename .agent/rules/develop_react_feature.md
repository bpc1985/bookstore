---
trigger: model_decision
description: React UI patterns for loading states, error handling, and async operations with REST API
---

# React UI Patterns

## Core Principles

1. **Never show stale UI** - Loading spinners only when actually loading
2. **Always surface errors** - Users must know when something fails
3. **Disable during operations** - Prevent double-submissions
4. **Provide empty states** - Every collection needs one

## Loading State Patterns

### The Golden Rule

**Show loading indicator ONLY when there's no data to display.**

```typescript
// CORRECT - Only show loading when no data exists
const { data, isLoading, error } = useQuery(['books'], api.getBooks);

if (error) return <ErrorState error={error} onRetry={refetch} />;
if (isLoading && !data) return <LoadingSkeleton />;
if (!data?.length) return <EmptyState />;

return <BookList books={data} />;
```

```typescript
// WRONG - Shows spinner even when we have cached data
if (isLoading) return <LoadingSkeleton />; // Flashes on refetch!
```

### Loading State Decision Tree

```
Is there an error?
  → Yes: Show error state with retry option
  → No: Continue

Is it loading AND we have no data?
  → Yes: Show loading indicator (spinner/skeleton)
  → No: Continue

Do we have data?
  → Yes, with items: Show the data
  → Yes, but empty: Show empty state
  → No: Show loading (fallback)
```

### Skeleton vs Spinner

| Use Skeleton | Use Spinner |
|--------------|-------------|
| Known content shape (cards, lists) | Unknown content shape |
| Initial page load | Button submissions |
| Content placeholders | Modal actions |

## Error Handling Patterns

### Error Hierarchy

```
1. Inline error (field-level)  → Form validation errors
2. Toast notification          → Recoverable errors, user can retry
3. Error banner               → Page-level errors, data still usable
4. Full error screen          → Unrecoverable, needs user action
```

### Always Surface Errors

**CRITICAL: Never swallow errors silently.**

```typescript
// CORRECT - Error surfaced to user
const handleAddToCart = async () => {
  try {
    await api.addToCart(bookId, quantity);
    toast.success('Added to cart');
  } catch (error) {
    console.error('addToCart failed:', error);
    toast.error('Failed to add to cart');
  }
};

// WRONG - Error caught but user sees nothing
const handleAddToCart = async () => {
  try {
    await api.addToCart(bookId, quantity);
  } catch (error) {
    console.log(error); // User has no idea it failed!
  }
};
```

### Error State Component

```typescript
interface ErrorStateProps {
  error: Error;
  onRetry?: () => void;
  title?: string;
}

const ErrorState = ({ error, onRetry, title }: ErrorStateProps) => (
  <div className="flex flex-col items-center gap-4 p-8">
    <AlertCircle className="h-12 w-12 text-destructive" />
    <h3 className="font-semibold">{title ?? 'Something went wrong'}</h3>
    <p className="text-muted-foreground">{error.message}</p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline">
        Try Again
      </Button>
    )}
  </div>
);
```

## Button State Patterns

### Disable During Operations

**CRITICAL: Always disable triggers during async operations.**

```tsx
// CORRECT - Button disabled and shows loading
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  setIsSubmitting(true);
  try {
    await api.checkout(cartItems);
    toast.success('Order placed!');
  } catch (error) {
    toast.error('Checkout failed');
  } finally {
    setIsSubmitting(false);
  }
};

<Button onClick={handleSubmit} disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Processing...
    </>
  ) : (
    'Place Order'
  )}
</Button>
```

```tsx
// WRONG - User can click multiple times
<Button onClick={handleSubmit}>
  {isSubmitting ? 'Processing...' : 'Place Order'}
</Button>
```

## Empty States

### Every Collection Needs One

```tsx
// WRONG - No empty state
return <div>{books.map(book => <BookCard key={book.id} book={book} />)}</div>;

// CORRECT - Explicit empty state
if (!books.length) {
  return (
    <EmptyState
      icon={BookOpen}
      title="No books found"
      description="Try adjusting your search or filters"
    />
  );
}

return <div>{books.map(book => <BookCard key={book.id} book={book} />)}</div>;
```

### Contextual Empty States

```tsx
// Search with no results
<EmptyState
  icon={Search}
  title="No results found"
  description="Try different search terms"
/>

// Cart is empty
<EmptyState
  icon={ShoppingCart}
  title="Your cart is empty"
  description="Browse our collection to find your next read"
  action={<Button asChild><Link href="/books">Browse Books</Link></Button>}
/>

// No orders yet
<EmptyState
  icon={Package}
  title="No orders yet"
  description="Your order history will appear here"
/>
```

## Form Submission Pattern

```tsx
const CheckoutForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.checkout(formData);
      toast.success('Order placed successfully!');
      router.push('/order-confirmation');
    } catch (error) {
      toast.error('Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Processing...' : 'Complete Order'}
      </Button>
    </form>
  );
};
```

## Anti-Patterns Summary

| Anti-Pattern | Correct Pattern |
|--------------|-----------------|
| `if (loading) return <Spinner />` | `if (loading && !data) return <Spinner />` |
| `catch (e) { console.log(e) }` | `catch (e) { toast.error('Failed'); }` |
| `<Button onClick={submit}>` | `<Button onClick={submit} disabled={loading}>` |
| No empty state for lists | Always provide `EmptyState` component |

## Checklist

Before completing any UI component:

**UI States:**
- [ ] Error state handled and shown to user (toast or inline)
- [ ] Loading state shown only when no data exists
- [ ] Empty state provided for collections
- [ ] Buttons disabled during async operations

**User Feedback:**
- [ ] Success actions show toast confirmation
- [ ] Failed actions show toast error
- [ ] Form validation errors displayed inline
