import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminLayout } from '../admin-layout';

const mockPush = vi.fn();
let mockPathname = '/';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => mockPathname,
}));

const mockUseAuthStore = vi.fn();
vi.mock('@/stores/auth', () => ({
  useAuthStore: (...args: unknown[]) => mockUseAuthStore(...args),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('AdminLayout', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockPathname = '/';
    mockUseAuthStore.mockReturnValue({
      user: {
        id: 1,
        email: 'admin@bookstore.com',
        full_name: 'Admin User',
        role: 'admin',
      },
      isInitialized: true,
      logout: vi.fn(),
    });
  });

  it('should render children for authenticated admin', () => {
    render(
      <AdminLayout>
        <div>Dashboard Content</div>
      </AdminLayout>,
    );
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('should render sidebar and header for authenticated admin', () => {
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>,
    );
    expect(screen.getByText('Bookstore Admin')).toBeInTheDocument();
  });

  it('should render children directly on /login path', () => {
    mockPathname = '/login';
    mockUseAuthStore.mockReturnValue({
      user: null,
      isInitialized: true,
      logout: vi.fn(),
    });

    render(
      <AdminLayout>
        <div>Login Form</div>
      </AdminLayout>,
    );
    expect(screen.getByText('Login Form')).toBeInTheDocument();
  });

  it('should show skeleton when not initialized', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isInitialized: false,
      logout: vi.fn(),
    });

    const { container } = render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>,
    );

    expect(screen.queryByText('Content')).not.toBeInTheDocument();
    // Skeleton elements should be present
    expect(container.querySelector('[class*="animate-pulse"], [data-slot="skeleton"]')).toBeTruthy();
  });

  it('should redirect to /login when initialized but no user', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isInitialized: true,
      logout: vi.fn(),
    });

    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>,
    );

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should redirect non-admin users to /login', () => {
    mockUseAuthStore.mockReturnValue({
      user: {
        id: 2,
        email: 'user@bookstore.com',
        full_name: 'Regular User',
        role: 'user',
      },
      isInitialized: true,
      logout: vi.fn(),
    });

    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>,
    );

    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
