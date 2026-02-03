import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getBook: vi.fn(),
    getCategories: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import EditBookPage from '../page';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

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

describe('EditBookPage', () => {
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(toast, 'error').mockImplementation(() => {});
    (useRouter as any).mockReturnValue(mockRouter);
    (useParams as any).mockReturnValue({ id: '1' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', () => {
    (api.getBook as any).mockImplementation(() => new Promise(() => {}));
    (api.getCategories as any).mockImplementation(() => new Promise(() => {}));

    render(<EditBookPage />, { wrapper: createWrapper() });

    expect(screen.getAllByRole('generic').find(el => el.classList.contains('h-96'))).toBeInTheDocument();
  });

  it('should render book form with data', async () => {
    (api.getBook as any).mockResolvedValue({
      id: 1,
      title: 'Test Book',
      author: 'Test Author',
      description: 'Test description',
      isbn: '1234567890',
      price: '29.99',
      stock_quantity: 10,
      cover_image: 'https://example.com/cover.jpg',
      rating: '4.5',
      review_count: 100,
      categories: [{ id: 1, name: 'Fiction' }],
    });

    (api.getCategories as any).mockResolvedValue([
      { id: 1, name: 'Fiction' },
      { id: 2, name: 'Non-Fiction' },
    ]);

    render(<EditBookPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Book')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Author')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
      expect(screen.getByText('Fiction')).toBeInTheDocument();
    });
  });
});
