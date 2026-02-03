import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getAdminOrder: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminOrderDetailPage from '../page';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

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

describe('AdminOrderDetailPage', () => {
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(toast, 'error').mockImplementation(() => {});
    (useRouter as any).mockReturnValue(mockRouter);
    (useParams as any).mockReturnValue({ id: '1' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', () => {
    (api.getAdminOrder as any).mockImplementation(() => new Promise(() => {}));

    render(<AdminOrderDetailPage />, { wrapper: createWrapper() });

    expect(screen.getAllByRole('generic').find(el => el.classList.contains('h-48'))).toBeInTheDocument();
  });

  it('should render order details', async () => {
    (api.getAdminOrder as any).mockResolvedValue({
      id: 1,
      created_at: '2024-01-15T10:30:00Z',
      status: 'paid' as const,
      total_amount: '29.99',
      shipping_address: '123 Main St\nCity, State 12345',
      items: [
        {
          id: 1,
          book_id: 1,
          book_title: 'Book 1',
          book_author: 'Author 1',
          price_at_purchase: '29.99',
          quantity: 1,
        },
      ],
      status_history: [],
    });

    render(<AdminOrderDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('Book 1')).toBeInTheDocument();
      expect(screen.getByText('Author 1')).toBeInTheDocument();
      expect(screen.getAllByText('$29.99').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
    });

    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('should not show update status form for completed orders', async () => {
    (api.getAdminOrder as any).mockResolvedValue({
      id: 1,
      created_at: '2024-01-15T10:30:00Z',
      status: 'completed' as const,
      total_amount: '29.99',
      shipping_address: '123 Main St\nCity, State 12345',
      items: [
        {
          id: 1,
          book_id: 1,
          book_title: 'Book 1',
          book_author: 'Author 1',
          price_at_purchase: '29.99',
          quantity: 1,
        },
      ],
      status_history: [],
    });

    render(<AdminOrderDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.queryByText('Update Status')).not.toBeInTheDocument();
    });
  });
});
