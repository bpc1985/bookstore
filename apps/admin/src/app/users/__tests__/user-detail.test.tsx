import React, { Suspense } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import UserDetailPage from '../[id]/page';

const mockPush = vi.fn();
const mockGetUser = vi.fn();
const mockGetAdminOrders = vi.fn();
const mockUpdateUserRole = vi.fn();
const mockDeactivateUser = vi.fn();
const mockActivateUser = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getUser: (...args: unknown[]) => mockGetUser(...args),
    getAdminOrders: (...args: unknown[]) => mockGetAdminOrders(...args),
    updateUserRole: (...args: unknown[]) => mockUpdateUserRole(...args),
    deactivateUser: (...args: unknown[]) => mockDeactivateUser(...args),
    activateUser: (...args: unknown[]) => mockActivateUser(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: {
      id: 1,
      email: 'admin@bookstore.com',
      full_name: 'Admin User',
      role: 'admin',
    },
  }),
}));

const mockUser = {
  id: 2,
  email: 'user@bookstore.com',
  full_name: 'Regular User',
  role: 'user',
  is_active: true,
  created_at: '2024-02-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
};

const mockOrders = [
  {
    id: 1,
    user_id: 2,
    status: 'completed',
    total_amount: '59.99',
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-03-15T10:00:00Z',
  },
  {
    id: 2,
    user_id: 2,
    status: 'pending',
    total_amount: '30.00',
    created_at: '2024-04-01T10:00:00Z',
    updated_at: '2024-04-01T10:00:00Z',
  },
  {
    id: 3,
    user_id: 5, // different user
    status: 'completed',
    total_amount: '100.00',
    created_at: '2024-04-01T10:00:00Z',
    updated_at: '2024-04-01T10:00:00Z',
  },
];

async function renderPage(id: string) {
  const promise = Promise.resolve({ id });
  await act(async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <UserDetailPage params={promise} />
      </Suspense>,
    );
  });
}

describe('UserDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue(mockUser);
    mockGetAdminOrders.mockResolvedValue({ items: mockOrders, total: 3, page: 1, size: 10, pages: 1 });
    mockUpdateUserRole.mockResolvedValue(undefined);
    mockDeactivateUser.mockResolvedValue(undefined);
    mockActivateUser.mockResolvedValue(undefined);
  });

  it('should render user details', async () => {
    await renderPage('2');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Regular User' })).toBeInTheDocument();
    });

    expect(screen.getAllByText('user@bookstore.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('User Information')).toBeInTheDocument();
  });

  it('should show role badge', async () => {
    await renderPage('2');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Regular User' })).toBeInTheDocument();
    });

    expect(screen.getAllByText('user').length).toBeGreaterThanOrEqual(1);
  });

  it('should show status badge', async () => {
    await renderPage('2');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Regular User' })).toBeInTheDocument();
    });

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should show order summary with filtered orders', async () => {
    await renderPage('2');

    await waitFor(() => {
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
    });

    // Only orders with user_id === 2 should be counted (2 of 3)
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('$89.99')).toBeInTheDocument();
  });

  it('should show "User not found" for invalid user', async () => {
    mockGetUser.mockRejectedValue(new Error('Not found'));

    await renderPage('999');

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });

    expect(screen.getByText('Back to Users')).toBeInTheDocument();
  });

  it('should show role/status management buttons for non-current users', async () => {
    await renderPage('2');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Regular User' })).toBeInTheDocument();
    });

    expect(screen.getByText('Make Admin')).toBeInTheDocument();
    expect(screen.getByText('Deactivate')).toBeInTheDocument();
  });

  it('should not show management buttons for current user', async () => {
    mockGetUser.mockResolvedValue({
      ...mockUser,
      id: 1, // same as currentUser.id
      email: 'admin@bookstore.com',
      full_name: 'Current Admin',
      role: 'admin',
    });

    await renderPage('1');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Current Admin' })).toBeInTheDocument();
    });

    expect(screen.queryByText('Make Admin')).not.toBeInTheDocument();
    expect(screen.queryByText('Deactivate')).not.toBeInTheDocument();
    expect(screen.queryByText('Remove Admin')).not.toBeInTheDocument();
  });

  it('should show "Remove Admin" for admin users', async () => {
    mockGetUser.mockResolvedValue({ ...mockUser, id: 5, role: 'admin' });

    await renderPage('5');

    await waitFor(() => {
      expect(screen.getByText('Remove Admin')).toBeInTheDocument();
    });
  });

  it('should show "Activate" for inactive users', async () => {
    mockGetUser.mockResolvedValue({ ...mockUser, is_active: false });

    await renderPage('2');

    await waitFor(() => {
      expect(screen.getByText('Activate')).toBeInTheDocument();
    });

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should open role update dialog', async () => {
    const user = userEvent.setup();
    await renderPage('2');

    await waitFor(() => {
      expect(screen.getByText('Make Admin')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Make Admin'));

    expect(screen.getByText('Update User Role')).toBeInTheDocument();
    expect(screen.getByText(/Change role for Regular User/)).toBeInTheDocument();
  });

  it('should open deactivate dialog', async () => {
    const user = userEvent.setup();
    await renderPage('2');

    await waitFor(() => {
      expect(screen.getByText('Deactivate')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Deactivate'));

    expect(screen.getByText('Deactivate User')).toBeInTheDocument();
    expect(screen.getByText(/will not be able to log in/)).toBeInTheDocument();
  });

  it('should render back link to users list', async () => {
    await renderPage('2');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Regular User' })).toBeInTheDocument();
    });

    const links = screen.getAllByRole('link');
    expect(links.some(l => l.getAttribute('href') === '/users')).toBe(true);
  });

  it('should render "View All Orders" link', async () => {
    await renderPage('2');

    await waitFor(() => {
      expect(screen.getByText('View All Orders')).toBeInTheDocument();
    });

    expect(screen.getByText('View All Orders').closest('a')).toHaveAttribute(
      'href',
      '/orders?user=user@bookstore.com',
    );
  });

  it('should call getUser with parsed id', async () => {
    await renderPage('42');

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalledWith(42);
    });
  });

  it('should redirect to /users on load failure', async () => {
    const { toast } = await import('sonner');
    mockGetUser.mockRejectedValue(new Error('Server error'));

    await renderPage('999');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load user data');
    });

    expect(mockPush).toHaveBeenCalledWith('/users');
  });
});
