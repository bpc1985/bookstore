import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import UsersListPage from '../page';

const mockGetUsers = vi.fn();
const mockUpdateUserRole = vi.fn();
const mockDeactivateUser = vi.fn();
const mockActivateUser = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    getUsers: (...args: unknown[]) => mockGetUsers(...args),
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

const mockUsers = [
  {
    id: 1,
    email: 'admin@bookstore.com',
    full_name: 'Admin User',
    role: 'admin',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    email: 'user@bookstore.com',
    full_name: 'Regular User',
    role: 'user',
    is_active: true,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 3,
    email: 'inactive@bookstore.com',
    full_name: 'Inactive User',
    role: 'user',
    is_active: false,
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
  },
];

describe('UsersListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUsers.mockResolvedValue({ items: mockUsers, total: 3, page: 1, size: 20, pages: 1 });
    mockUpdateUserRole.mockResolvedValue(undefined);
    mockDeactivateUser.mockResolvedValue(undefined);
    mockActivateUser.mockResolvedValue(undefined);
  });

  it('should show loading skeletons initially', () => {
    mockGetUsers.mockReturnValue(new Promise(() => {}));
    const { container } = render(<UsersListPage />);
    expect(container.querySelector('[data-slot="skeleton"]')).toBeTruthy();
  });

  it('should render page header', async () => {
    render(<UsersListPage />);

    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    expect(screen.getByText('Manage user accounts and roles')).toBeInTheDocument();
  });

  it('should render users in table', async () => {
    render(<UsersListPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    expect(screen.getByText('admin@bookstore.com')).toBeInTheDocument();
    expect(screen.getByText('Regular User')).toBeInTheDocument();
    expect(screen.getByText('user@bookstore.com')).toBeInTheDocument();
    expect(screen.getByText('Inactive User')).toBeInTheDocument();
  });

  it('should show role badges', async () => {
    render(<UsersListPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    expect(screen.getAllByText('admin').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('user').length).toBeGreaterThanOrEqual(1);
  });

  it('should show status badges', async () => {
    render(<UsersListPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should show empty state when no users', async () => {
    mockGetUsers.mockResolvedValue({ items: [], total: 0, page: 1, size: 20, pages: 0 });

    render(<UsersListPage />);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });

  it('should not show "Make Admin" for current user or admin users', async () => {
    render(<UsersListPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    // Admin User (id: 1) is both current user AND admin role - no "Make Admin"
    // The "Make Admin" buttons should only appear for non-admin, non-current users
    const makeAdminButtons = screen.getAllByText('Make Admin');
    // Regular User (id:2) and Inactive User (id:3) are non-admin non-current
    expect(makeAdminButtons).toHaveLength(2);
  });

  it('should open role update dialog', async () => {
    const user = userEvent.setup();
    render(<UsersListPage />);

    await waitFor(() => {
      expect(screen.getByText('Regular User')).toBeInTheDocument();
    });

    const makeAdminButtons = screen.getAllByText('Make Admin');
    await user.click(makeAdminButtons[0]);

    expect(screen.getByText('Update User Role')).toBeInTheDocument();
  });

  it('should render view links for users', async () => {
    render(<UsersListPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    const links = screen.getAllByRole('link');
    expect(links.some(l => l.getAttribute('href') === '/users/1')).toBe(true);
    expect(links.some(l => l.getAttribute('href') === '/users/2')).toBe(true);
  });

  it('should render table headers', async () => {
    render(<UsersListPage />);

    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should show pagination when total pages > 1', async () => {
    mockGetUsers.mockResolvedValue({ items: mockUsers, total: 60, page: 1, size: 20, pages: 3 });

    render(<UsersListPage />);

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('should call getUsers with correct params', async () => {
    render(<UsersListPage />);

    await waitFor(() => {
      expect(mockGetUsers).toHaveBeenCalledWith({
        role: undefined,
        is_active: undefined,
        page: 1,
        size: 20,
      });
    });
  });
});
