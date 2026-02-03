import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: {
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
import NewBookPage from '../page';
import { useRouter } from 'next/navigation';
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

describe('NewBookPage', () => {
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(toast, 'error').mockImplementation(() => {});
    (useRouter as any).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render book form', async () => {
    (api.getCategories as any).mockResolvedValue([
      { id: 1, name: 'Fiction' },
      { id: 2, name: 'Non-Fiction' },
    ]);

    render(<NewBookPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Add New Book')).toBeInTheDocument();
    expect(screen.getByLabelText('Title *')).toBeInTheDocument();
    expect(screen.getByLabelText('Author *')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Fiction')).toBeInTheDocument();
      expect(screen.getByText('Non-Fiction')).toBeInTheDocument();
    });
  });

  it('should navigate back on cancel click', async () => {
    (api.getCategories as any).mockResolvedValue([]);

    render(<NewBookPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Create Book')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    cancelButton.click();

    const cancelLink = cancelButton.closest('a');
    expect(cancelLink).toHaveAttribute('href', '/admin/books');
  });
});
