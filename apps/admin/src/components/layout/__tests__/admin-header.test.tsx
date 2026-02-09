import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminHeader } from '../admin-header';

const mockLogout = vi.fn().mockResolvedValue(undefined);

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: {
      id: 1,
      email: 'admin@bookstore.com',
      full_name: 'Admin User',
      role: 'admin',
    },
    logout: mockLogout,
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AdminHeader', () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  it('should render the title', () => {
    render(<AdminHeader />);
    expect(screen.getByText('Bookstore Admin')).toBeInTheDocument();
  });

  it('should display user full name', () => {
    render(<AdminHeader />);
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  it('should display user email', () => {
    render(<AdminHeader />);
    expect(screen.getByText('admin@bookstore.com')).toBeInTheDocument();
  });

  it('should show user initials in avatar', () => {
    render(<AdminHeader />);
    expect(screen.getByText('AU')).toBeInTheDocument();
  });

  describe('when user is null', () => {
    it('should not render user dropdown', async () => {
      const { useAuthStore } = await import('@/stores/auth');
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        user: null,
        logout: mockLogout,
      });

      render(<AdminHeader />);
      expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
    });
  });
});
