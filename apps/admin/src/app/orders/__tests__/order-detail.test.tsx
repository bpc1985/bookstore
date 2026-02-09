import React, { Suspense } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import OrderDetailPage from '../[id]/page';

const mockPush = vi.fn();
const mockGetAdminOrder = vi.fn();
const mockUpdateOrderStatus = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getAdminOrder: (...args: unknown[]) => mockGetAdminOrder(...args),
    updateOrderStatus: (...args: unknown[]) => mockUpdateOrderStatus(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockOrder = {
  id: 1,
  user_email: 'user@test.com',
  status: 'pending',
  total_amount: '59.99',
  shipping_address: '123 Main St, City, State 12345',
  payment_reference: 'PAY-123456',
  created_at: '2024-03-15T10:00:00Z',
  updated_at: '2024-03-15T10:00:00Z',
  items: [
    {
      id: 1,
      book_title: 'Test Book',
      book_author: 'Test Author',
      quantity: 2,
      price_at_purchase: '19.99',
    },
    {
      id: 2,
      book_title: 'Another Book',
      book_author: 'Other Author',
      quantity: 1,
      price_at_purchase: '20.01',
    },
  ],
  status_history: [
    {
      id: 1,
      new_status: 'pending',
      timestamp: '2024-03-15T10:00:00Z',
      note: 'Order placed',
    },
  ],
};

async function renderPage(id: string) {
  const promise = Promise.resolve({ id });
  await act(async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <OrderDetailPage params={promise} />
      </Suspense>,
    );
  });
}

describe('OrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminOrder.mockResolvedValue(mockOrder);
    mockUpdateOrderStatus.mockResolvedValue({ ...mockOrder, status: 'paid' });
  });

  it('should render order header with ID and status', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Order #1')).toBeInTheDocument();
    });

    // "pending" appears in status badge, status history, and select - just verify at least one
    expect(screen.getAllByText('pending').length).toBeGreaterThanOrEqual(1);
  });

  it('should render order information', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('user@test.com')).toBeInTheDocument();
    });

    expect(screen.getByText('PAY-123456')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, City, State 12345')).toBeInTheDocument();
    expect(screen.getByText('$59.99')).toBeInTheDocument();
  });

  it('should render order items table', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('Another Book')).toBeInTheDocument();
    expect(screen.getByText('Other Author')).toBeInTheDocument();
  });

  it('should calculate subtotals correctly', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });

    // Test Book: 2 * $19.99 = $39.98
    expect(screen.getByText('$39.98')).toBeInTheDocument();
    // Another Book: 1 * $20.01 = $20.01 (appears as both unit price and subtotal)
    expect(screen.getAllByText('$20.01').length).toBeGreaterThanOrEqual(1);
  });

  it('should render status history', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Status History')).toBeInTheDocument();
    });

    expect(screen.getByText('Order placed')).toBeInTheDocument();
  });

  it('should show "Order not found" for invalid order', async () => {
    mockGetAdminOrder.mockRejectedValue(new Error('Not found'));

    await renderPage('999');

    await waitFor(() => {
      expect(screen.getByText('Order not found')).toBeInTheDocument();
    });

    expect(screen.getByText('Back to Orders')).toBeInTheDocument();
  });

  it('should render Update Status section', async () => {
    await renderPage('1');

    await waitFor(() => {
      // "Update Status" appears as card title and button text
      expect(screen.getAllByText('Update Status').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should show Cancel Order button for pending orders', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Cancel Order')).toBeInTheDocument();
    });
  });

  it('should not show Cancel Order button for completed orders', async () => {
    mockGetAdminOrder.mockResolvedValue({ ...mockOrder, status: 'completed' });

    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Order #1')).toBeInTheDocument();
    });

    expect(screen.queryByText('Cancel Order')).not.toBeInTheDocument();
    expect(screen.getByText(/This order is complete/)).toBeInTheDocument();
  });

  it('should not show Cancel Order button for cancelled orders', async () => {
    mockGetAdminOrder.mockResolvedValue({ ...mockOrder, status: 'cancelled' });

    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Order #1')).toBeInTheDocument();
    });

    expect(screen.queryByText('Cancel Order')).not.toBeInTheDocument();
  });

  it('should handle cancel order', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    mockUpdateOrderStatus.mockResolvedValue({ ...mockOrder, status: 'cancelled' });

    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Cancel Order')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Cancel Order'));

    await waitFor(() => {
      expect(mockUpdateOrderStatus).toHaveBeenCalledWith(1, 'cancelled', 'Cancelled by admin');
    });

    expect(toast.success).toHaveBeenCalledWith('Order cancelled');
  });

  it('should show "No items found" when order has no items', async () => {
    mockGetAdminOrder.mockResolvedValue({ ...mockOrder, items: [] });

    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });
  });

  it('should not show status history when empty', async () => {
    mockGetAdminOrder.mockResolvedValue({ ...mockOrder, status_history: [] });

    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Order #1')).toBeInTheDocument();
    });

    expect(screen.queryByText('Status History')).not.toBeInTheDocument();
  });

  it('should render back link to orders list', async () => {
    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByText('Order #1')).toBeInTheDocument();
    });

    const links = screen.getAllByRole('link');
    expect(links.some(l => l.getAttribute('href') === '/orders')).toBe(true);
  });

  it('should call getAdminOrder with parsed id', async () => {
    await renderPage('42');

    await waitFor(() => {
      expect(mockGetAdminOrder).toHaveBeenCalledWith(42);
    });
  });
});
