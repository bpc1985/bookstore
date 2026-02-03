import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { Providers } from '@/components/layout/providers';

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => null,
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: null,
    isInitialized: true,
    initialize: vi.fn(),
  }),
}));

vi.mock('@/stores/cart', () => ({
  useCartStore: () => ({
    cart: null,
    isLoading: false,
    fetchCart: vi.fn(),
  }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getCart: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('Providers', () => {
  let queryClient: QueryClient;

  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('should render', () => {
    act(() => {
      render(<Providers><div>Test</div></Providers>);
    });

    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
