import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api', () => ({
  api: {
    getAdminOrders: vi.fn(),
  },
}));

import { toast } from 'sonner';
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminOrdersPage from '../page';
import { api } from '@/lib/api';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('AdminOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(toast, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', () => {
    (api.getAdminOrders as any).mockImplementation(() => new Promise(() => {}));

    render(<AdminOrdersPage />, { wrapper: createWrapper() });

    expect(screen.getAllByRole('generic').find(el => el.classList.contains('h-20'))).toBeInTheDocument();
  });

  it('should render orders list', async () => {
    (api.getAdminOrders as any).mockResolvedValue({
      items: [
        {
          id: 1,
          created_at: '2024-01-15T10:30:00Z',
          total_amount: '29.99',
          status: 'completed' as const,
          item_count: 2,
        },
      ],
      total: 1,
      page: 1,
      size: 10,
      pages: 1,
    });

    render(<AdminOrdersPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('should render empty state when no orders', async () => {
    (api.getAdminOrders as any).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      size: 10,
      pages: 1,
    });

    render(<AdminOrdersPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No orders found')).toBeInTheDocument();
    });
  });

  it('should handle pagination', async () => {
    (api.getAdminOrders as any).mockResolvedValue({
      items: [
        {
          id: 1,
          created_at: '2024-01-15T10:30:00Z',
          total_amount: '29.99',
          status: 'completed' as const,
          item_count: 2,
        },
      ],
      total: 20,
      page: 1,
      size: 10,
      pages: 2,
    });

    render(<AdminOrdersPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show error toast on fetch failure', async () => {
    (api.getAdminOrders as any).mockRejectedValue(new Error('Failed to fetch'));

    render(<AdminOrdersPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load orders');
    });
  });
});
