import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AdminSidebar } from '../admin-sidebar';

let mockPathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

describe('AdminSidebar', () => {
  const onToggle = vi.fn();

  beforeEach(() => {
    mockPathname = '/';
    onToggle.mockClear();
  });

  describe('expanded state', () => {
    it('should render all navigation labels', () => {
      render(<AdminSidebar collapsed={false} onToggle={onToggle} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Books')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Reviews')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('should render section headers', () => {
      render(<AdminSidebar collapsed={false} onToggle={onToggle} />);

      expect(screen.getByText('Main')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Management')).toBeInTheDocument();
    });

    it('should render branding', () => {
      render(<AdminSidebar collapsed={false} onToggle={onToggle} />);
      expect(screen.getByText('Bookstore')).toBeInTheDocument();
    });

    it('should render collapse button with text', () => {
      render(<AdminSidebar collapsed={false} onToggle={onToggle} />);
      expect(screen.getByText('Collapse')).toBeInTheDocument();
    });

    it('should have correct navigation links', () => {
      render(<AdminSidebar collapsed={false} onToggle={onToggle} />);

      expect(screen.getByRole('link', { name: /Dashboard/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /Books/i })).toHaveAttribute('href', '/books');
      expect(screen.getByRole('link', { name: /Categories/i })).toHaveAttribute('href', '/categories');
      expect(screen.getByRole('link', { name: /Orders/i })).toHaveAttribute('href', '/orders');
      expect(screen.getByRole('link', { name: /Reviews/i })).toHaveAttribute('href', '/reviews');
      expect(screen.getByRole('link', { name: /Users/i })).toHaveAttribute('href', '/users');
    });
  });

  describe('collapsed state', () => {
    it('should hide navigation labels', () => {
      render(<AdminSidebar collapsed={true} onToggle={onToggle} />);

      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Books')).not.toBeInTheDocument();
      expect(screen.queryByText('Users')).not.toBeInTheDocument();
    });

    it('should hide section headers', () => {
      render(<AdminSidebar collapsed={true} onToggle={onToggle} />);

      expect(screen.queryByText('Main')).not.toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
      expect(screen.queryByText('Management')).not.toBeInTheDocument();
    });

    it('should hide branding text', () => {
      render(<AdminSidebar collapsed={true} onToggle={onToggle} />);
      expect(screen.queryByText('Bookstore')).not.toBeInTheDocument();
    });

    it('should still render navigation links', () => {
      render(<AdminSidebar collapsed={true} onToggle={onToggle} />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBe(6);
    });
  });

  describe('active state', () => {
    it('should mark Dashboard as active on /', () => {
      mockPathname = '/';
      const { container } = render(<AdminSidebar collapsed={false} onToggle={onToggle} />);

      const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
      expect(dashboardLink.className).toContain('bg-primary');
    });

    it('should mark Books as active on /books', () => {
      mockPathname = '/books';
      render(<AdminSidebar collapsed={false} onToggle={onToggle} />);

      const booksLink = screen.getByRole('link', { name: /Books/i });
      expect(booksLink.className).toContain('bg-primary');
    });

    it('should mark Books as active on /books/123 (nested path)', () => {
      mockPathname = '/books/123';
      render(<AdminSidebar collapsed={false} onToggle={onToggle} />);

      const booksLink = screen.getByRole('link', { name: /Books/i });
      expect(booksLink.className).toContain('bg-primary');
    });

    it('should not mark Dashboard as active on /books', () => {
      mockPathname = '/books';
      render(<AdminSidebar collapsed={false} onToggle={onToggle} />);

      const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
      expect(dashboardLink.className).not.toContain('bg-primary');
    });
  });

  describe('toggle', () => {
    it('should call onToggle when collapse button is clicked', async () => {
      const user = userEvent.setup();
      render(<AdminSidebar collapsed={false} onToggle={onToggle} />);

      await user.click(screen.getByText('Collapse'));
      expect(onToggle).toHaveBeenCalledOnce();
    });
  });
});
