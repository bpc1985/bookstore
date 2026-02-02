---
trigger: model_decision
description: Ensure all changes are tested with adequate coverage
---

# Unit Testing & Coverage Standards

## Required Tests

### Before Committing

Every feature or bug fix must include corresponding tests.

```bash
# Run all unit tests
pnpm frontend:test

# Run tests with coverage report
pnpm frontend:test:coverage
```

### Test Requirements

- ✅ All existing tests must pass
- ✅ New features must have tests for happy path
- ✅ Error cases must be tested
- ✅ Edge cases must be covered
- ✅ Test coverage should not decrease significantly

## Test Patterns

### Zustand Store Testing

Use direct store state access instead of renderHook for simpler testing:

```typescript
// CORRECT - Direct store testing
import { createAuthStore } from '@/stores/auth';

describe('AuthStore', () => {
  let store: ReturnType<typeof createAuthStore>;

  beforeEach(() => {
    store = createAuthStore();
    vi.clearAllMocks();
  });

  it('should set user on login', async () => {
    const mockUser = { id: 1, email: 'test@test.com', ... };
    store.setState({ user: mockUser });
    expect(store.getState().user).toEqual(mockUser);
  });

  it('should handle async actions', async () => {
    const mockApiClient = { login: vi.fn().mockResolvedValue(mockToken) };
    await act(async () => {
      await store.getState().login(mockApiClient, 'test@test.com', 'password');
    });
    expect(store.getState().user).toEqual(mockUser);
  });
});
```

### React Hook Testing

```typescript
// CORRECT - Test hook with wrapper
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('useBooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  it('should fetch books successfully', async () => {
    (api.getBooks as any).mockResolvedValue(mockBooks);

    const { result } = renderHook(() => useBooks(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockBooks);
    });
  });
});
```

### API Client Testing

```typescript
// CORRECT - Mock fetch globally
import { ApiClient } from '@/lib/api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    mockFetch.mockClear();
    apiClient = new ApiClient({ baseUrl: 'http://test.com' });
  });

  it('should handle successful responses', async () => {
    const mockData = { id: 1, title: 'Test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await apiClient.getBook(1);
    expect(result).toEqual(mockData);
  });

  it('should throw on error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ detail: 'Not found' }),
    } as Response);

    await expect(apiClient.getBook(999)).rejects.toThrow('Not found');
  });
});
```

### Component Testing

```typescript
// CORRECT - Use userEvent for realistic interactions
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Button', () => {
  it('should handle click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button', { name: 'Click me' });
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Coverage Standards

### Coverage Targets

| Module Type | Target Coverage |
|-------------|----------------|
| Stores (Zustand) | ≥ 90% |
| API Client | ≥ 80% |
| React Hooks | ≥ 70% |
| Utility Functions | ≥ 90% |
| UI Components | ≥ 50% |

### Coverage Configuration

Ensure `.next/` is excluded from coverage in `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  exclude: [
    'node_modules/',
    '.next/',  // Important: exclude Next.js build artifacts
    'src/__tests__/',
    '**/*.d.ts',
    '**/*.config.*',
  ],
}
```

## Mock Patterns

### Setup Mocks in `src/__tests__/setup.ts`

```typescript
// Mock Next.js internals
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
}));

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: vi.fn(),
  __esModule: true,
}));

// Mock external services
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
```

### API Client Mocking

```typescript
// Mock API client methods
const mockApiClient = {
  login: vi.fn(),
  register: vi.fn(),
  getCurrentUser: vi.fn(),
  setAccessToken: vi.fn(),
} as unknown as ApiClient;

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Common Pitfalls & Fixes

### 1. Unhandled Promise Rejections

**Problem:** Test passes but unhandled rejection appears in errors.

**Fix:** Ensure all async operations are awaited or properly caught.

```typescript
// WRONG - Unhandled rejection
store.getState().login(mockApiClient, 'test@test.com', 'password');

// CORRECT - Properly awaited
await act(async () => {
  await store.getState().login(mockApiClient, 'test@test.com', 'password');
});
```

### 2. Mock Not Returning Values

**Problem:** `Cannot read properties of undefined (reading 'ok')`

**Fix:** Ensure mock returns proper Response object.

```typescript
// WRONG
mockFetch.mockResolvedValueOnce({ ok: true });

// CORRECT - Full Response type
mockFetch.mockResolvedValueOnce({
  ok: true,
  status: 200,
  json: async () => mockData,
} as Response);
```

### 3. Store Methods Not Available

**Problem:** `Cannot read properties of null (reading 'login')`

**Fix:** Use store directly, not via renderHook.

```typescript
// WRONG - accessing result.current before it's set
const { result } = renderHook(() => store());
expect(result.current.login).toBeDefined(); // result.current is null

// CORRECT - Direct store access
const store = createAuthStore();
expect(store.getState().login).toBeDefined();
```

### 4. JSX Parsing Errors in Tests

**Problem:** `Expected ">" but found "client"` when using JSX in tests

**Fix:** Import React and use React.createElement for wrappers.

```typescript
// WRONG - JSX not transpiled correctly in some test environments
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

// CORRECT - Explicit React.createElement
import React from 'react';
const wrapper = function({ children }: { children: React.ReactNode }) {
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};
```

### 5. State Not Updated After Async Actions

**Problem:** Test checks state before async action completes.

**Fix:** Use `await act()` or `waitFor()`.

```typescript
// WRONG - State checked immediately
store.getState().login(mockApiClient, ...);
expect(store.getState().user).toEqual(mockUser); // Fails - login not complete

// CORRECT - Wait for completion
await act(async () => {
  await store.getState().login(mockApiClient, ...);
});
expect(store.getState().user).toEqual(mockUser);
```

### 6. Missing UserEvent Import

**Problem:** `Cannot read properties of undefined (reading 'setup')`

**Fix:** Import userEvent correctly.

```typescript
// WRONG - Destructuring default export incorrectly
const { user } = await import('@testing-library/user-event');
const userEvent = user.setup(); // Error

// CORRECT - Import default directly
const userEvent = (await import('@testing-library/user-event')).default;
await userEvent.click(button);
```

## Test Organization

### File Structure

```
src/
├── __tests__/
│   └── setup.ts              # Global test setup (mocks, cleanup)
├── lib/
│   └── __tests__/
│       ├── api.test.ts         # API client tests
│       ├── utils.test.ts       # Utility function tests
│       └── hooks/
│           └── __tests__/
│               └── use-books.test.ts  # Hook tests
├── stores/
│   └── __tests__/
│       ├── auth.test.ts       # Store tests
│       └── cart.test.ts
└── components/
    └── ui/
        └── __tests__/
            ├── button.test.tsx   # Component tests
            └── card.test.tsx
```

### Test Naming

- File: `{moduleName}.test.ts` or `{moduleName}.test.tsx`
- Describe: `'{ModuleName}'` or `'{ComponentName}'`
- Nested describes: Group by functionality (e.g., `'login'`, `'fetchCart'`)

## Pre-Commit Checklist

Before committing code changes:

- [ ] All existing tests pass (`pnpm frontend:test`)
- [ ] New code has corresponding tests
- [ ] Test coverage hasn't decreased (run `pnpm frontend:test:coverage`)
- [ ] Edge cases and error paths are tested
- [ ] No `console.log` left in production code
- [ ] Mocks are properly reset in `beforeEach`
- [ ] Async operations are properly awaited
- [ ] `.next/` is excluded from coverage
