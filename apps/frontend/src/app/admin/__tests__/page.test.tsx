import React from 'react';

vi.mock('next/link', () => ({
  default: ({ children, href, className, ...props }: any) =>
    React.createElement('a', { href, className, ...props }, children),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getAnalytics: vi.fn(),
    getAdminOrders: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboardPage from '../page';
import { api } from '@/lib/api';
import { toast } from 'sonner';

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(toast, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', () => {
    (api.getAnalytics as any).mockImplementation(() => new Promise(() => {}));
    (api.getAdminOrders as any).mockImplementation(() => new Promise(() => {}));

    render(<AdminDashboardPage />);

    expect(screen.getAllByRole('generic').find(el => el.classList.contains('h-32'))).toBeInTheDocument();
  });

  it('should render analytics data', async () => {
    (api.getAnalytics as any).mockResolvedValue({
      total_revenue: '1500.00',
      total_orders: 45,
      pending_orders: 5,
      total_books: 120,
      total_users: 30,
      total_reviews: 85,
    });
    (api.getAdminOrders as any).mockResolvedValue({
      items: [
        {
          id: 1,
          created_at: '2024-01-15T10:30:00Z',
          total_amount: '29.99',
          status: 'completed',
          item_count: 2,
        },
      ],
      total: 1,
      page: 1,
      size: 5,
      pages: 1,
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('$1500.00')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
    });
  });

  it('should render recent orders', async () => {
    (api.getAnalytics as any).mockResolvedValue({
      total_revenue: '1000.00',
      total_orders: 10,
      pending_orders: 2,
      total_books: 50,
      total_users: 15,
      total_reviews: 25,
    });
    (api.getAdminOrders as any).mockResolvedValue({
      items: [
        {
          id: 1,
          created_at: '2024-01-15T10:30:00Z',
          total_amount: '29.99',
          status: 'completed',
          item_count: 2,
        },
        {
          id: 2,
          created_at: '2024-01-14T14:20:00Z',
          total_amount: '15.99',
          status: 'pending',
          item_count: 1,
        },
      ],
      total: 2,
      page: 1,
      size: 5,
      pages: 1,
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('Order #2')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.getByText('$15.99')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should handle empty recent orders', async () => {
    (api.getAnalytics as any).mockResolvedValue({
      total_revenue: '0.00',
      total_orders: 0,
      pending_orders: 0,
      total_books: 0,
      total_users: 0,
      total_reviews: 0,
    });
    (api.getAdminOrders as any).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      size: 5,
      pages: 1,
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('No orders yet')).toBeInTheDocument();
    });
  });

  it('should show error toast on fetch failure', async () => {
    (api.getAnalytics as any).mockRejectedValue(new Error('Failed to fetch'));
    (api.getAdminOrders as any).mockRejectedValue(new Error('Failed to fetch'));

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load dashboard data');
    });
  });

  it('should display order status badges correctly', async () => {
    (api.getAnalytics as any).mockResolvedValue({
      total_revenue: '1000.00',
      total_orders: 10,
      pending_orders: 2,
      total_books: 50,
      total_users: 15,
      total_reviews: 25,
    });
    (api.getAdminOrders as any).mockResolvedValue({
      items: [
        {
          id: 1,
          created_at: '2024-01-15T10:30:00Z',
          total_amount: '29.99',
          status: 'completed',
          item_count: 2,
        },
        {
          id: 2,
          created_at: '2024-01-14T14:20:00Z',
          total_amount: '15.99',
          status: 'cancelled',
          item_count: 1,
        },
      ],
      total: 2,
      page: 1,
      size: 5,
      pages: 1,
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('cancelled')).toBeInTheDocument();
    });
  });
});
