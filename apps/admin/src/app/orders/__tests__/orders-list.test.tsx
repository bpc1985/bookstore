import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrdersListPage from '../page';

const mockGetAdminOrders = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    getAdminOrders: (...args: unknown[]) => mockGetAdminOrders(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockOrders = [
  {
    id: 1,
    user_email: 'user1@test.com',
    status: 'pending',
    total_amount: '59.99',
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-03-15T10:00:00Z',
  },
  {
    id: 2,
    user_email: 'user2@test.com',
    status: 'paid',
    total_amount: '120.50',
    created_at: '2024-03-14T10:00:00Z',
    updated_at: '2024-03-14T10:00:00Z',
  },
  {
    id: 3,
    status: 'completed',
    total_amount: '35.00',
    created_at: '2024-03-13T10:00:00Z',
    updated_at: '2024-03-13T10:00:00Z',
  },
];

describe('OrdersListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminOrders.mockResolvedValue({ items: mockOrders, total: 3, page: 1, size: 20, pages: 1 });
  });

  it('should show loading skeletons initially', () => {
    mockGetAdminOrders.mockReturnValue(new Promise(() => {}));
    const { container } = render(<OrdersListPage />);
    expect(container.querySelector('[data-slot="skeleton"]')).toBeTruthy();
  });

  it('should render page header', async () => {
    render(<OrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('Orders')).toBeInTheDocument();
    });

    expect(screen.getByText('View and manage customer orders')).toBeInTheDocument();
  });

  it('should render orders in table', async () => {
    render(<OrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    expect(screen.getByText('$59.99')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('user2@test.com')).toBeInTheDocument();
    expect(screen.getByText('$120.50')).toBeInTheDocument();
  });

  it('should show status badges', async () => {
    render(<OrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('pending')).toBeInTheDocument();
    });

    expect(screen.getByText('paid')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('should show "N/A" for orders without user_email', async () => {
    render(<OrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  it('should show empty state when no orders', async () => {
    mockGetAdminOrders.mockResolvedValue({ items: [], total: 0, page: 1, size: 20, pages: 0 });

    render(<OrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('No orders found')).toBeInTheDocument();
    });
  });

  it('should render order ID links', async () => {
    render(<OrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    expect(screen.getByText('#1').closest('a')).toHaveAttribute('href', '/orders/1');
    expect(screen.getByText('#2').closest('a')).toHaveAttribute('href', '/orders/2');
  });

  it('should render View buttons', async () => {
    render(<OrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('View');
    expect(viewButtons).toHaveLength(3);
  });

  it('should render table headers', async () => {
    render(<OrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('Orders')).toBeInTheDocument();
    });

    expect(screen.getByText('Order ID')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should show pagination when total pages > 1', async () => {
    mockGetAdminOrders.mockResolvedValue({ items: mockOrders, total: 60, page: 1, size: 20, pages: 3 });

    render(<OrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('should not show pagination for single page', async () => {
    render(<OrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('should call getAdminOrders with correct params', async () => {
    render(<OrdersListPage />);

    await waitFor(() => {
      expect(mockGetAdminOrders).toHaveBeenCalledWith({
        status: undefined,
        page: 1,
        size: 20,
      });
    });
  });
});
