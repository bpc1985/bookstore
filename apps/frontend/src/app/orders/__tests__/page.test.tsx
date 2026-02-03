import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrdersPage from '@/app/orders/page';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { id: 1, email: 'test@example.com' },
    isInitialized: true,
  }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getOrders: vi.fn().mockResolvedValue({
      items: [
        { id: 1, total_amount: 29.99, status: 'completed', created_at: '2024-01-01T00:00:00Z' },
      ],
      total: 1,
      page: 1,
      size: 20,
    }),
  },
}));

describe('OrdersPage', () => {
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

  it('should render without errors', async () => {
    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/my orders/i)).toBeInTheDocument();
    });
  });
});
