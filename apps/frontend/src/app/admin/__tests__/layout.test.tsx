import React from 'react';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, className, ...props }: any) =>
    React.createElement('a', { href, className, ...props }, children),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminLayout from '../layout';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

describe('AdminLayout', () => {
  const mockRouter = { push: vi.fn() };
  const mockPathname = '/admin';

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (usePathname as any).mockReturnValue(mockPathname);
  });

  it('should render loading skeleton when not initialized', () => {
    useAuthStore.mockReturnValue({
      user: null,
      isInitialized: false,
    });

    render(<AdminLayout>Test Content</AdminLayout>);

    expect(screen.getAllByRole('generic').find(el => el.classList.contains('h-10'))).toBeInTheDocument();
  });

  it('should redirect non-admin users to home', async () => {
    useAuthStore.mockReturnValue({
      user: { id: 1, email: 'user@example.com', role: 'user' },
      isInitialized: true,
    });

    render(<AdminLayout>Test Content</AdminLayout>);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  it('should redirect when user is null', async () => {
    useAuthStore.mockReturnValue({
      user: null,
      isInitialized: true,
    });

    render(<AdminLayout>Test Content</AdminLayout>);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  it('should render admin dashboard for admin users', () => {
    useAuthStore.mockReturnValue({
      user: { id: 1, email: 'admin@example.com', role: 'admin' },
      isInitialized: true,
    });

    render(<AdminLayout>Test Content</AdminLayout>);

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    useAuthStore.mockReturnValue({
      user: { id: 1, email: 'admin@example.com', role: 'admin' },
      isInitialized: true,
    });

    (usePathname as any).mockReturnValue('/admin/books');

    render(<AdminLayout>Test Content</AdminLayout>);

    const booksLink = screen.getByText('Books').closest('a');
    expect(booksLink).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('should highlight subpages correctly', () => {
    useAuthStore.mockReturnValue({
      user: { id: 1, email: 'admin@example.com', role: 'admin' },
      isInitialized: true,
    });

    (usePathname as any).mockReturnValue('/admin/books/123');

    render(<AdminLayout>Test Content</AdminLayout>);

    const booksLink = screen.getByText('Books').closest('a');
    expect(booksLink).toHaveClass('bg-primary', 'text-primary-foreground');
  });
});
