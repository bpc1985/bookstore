import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api', () => ({
  api: {
    getBooks: vi.fn(),
    deleteBook: vi.fn(),
  },
}));

import { toast } from 'sonner';
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminBooksPage from '../page';
import { api } from '@/lib/api';

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

describe('AdminBooksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(toast, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', () => {
    (api.getBooks as any).mockImplementation(() => new Promise(() => {}));

    render(<AdminBooksPage />, { wrapper: createWrapper() });

    expect(screen.getAllByRole('generic').find(el => el.classList.contains('h-20'))).toBeInTheDocument();
  });

  it('should render books list', async () => {
    (api.getBooks as any).mockResolvedValue({
      items: [
        {
          id: 1,
          title: 'Book 1',
          author: 'Author 1',
          price: '29.99',
          stock_quantity: 10,
          rating: '4.5',
          review_count: 100,
          cover_image: null,
        },
      ],
      total: 1,
      page: 1,
      size: 10,
      pages: 1,
    });

    render(<AdminBooksPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Book 1')).toBeInTheDocument();
      expect(screen.getByText('Author 1')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
    });
  });

  it('should render empty state when no books', async () => {
    (api.getBooks as any).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      size: 10,
      pages: 1,
    });

    render(<AdminBooksPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No books found')).toBeInTheDocument();
    });
  });

  it('should handle pagination', async () => {
    (api.getBooks as any).mockResolvedValue({
      items: [
        {
          id: 1,
          title: 'Book 1',
          author: 'Author 1',
          price: '29.99',
          stock_quantity: 10,
          rating: '4.5',
          review_count: 100,
          cover_image: null,
        },
      ],
      total: 20,
      page: 1,
      size: 10,
      pages: 2,
    });

    render(<AdminBooksPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show error toast on fetch failure', async () => {
    (api.getBooks as any).mockRejectedValue(new Error('Failed to fetch'));

    render(<AdminBooksPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load books');
    });
  });
});
