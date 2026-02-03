import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BooksPage from '@/app/books/page';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} />
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getBooks: vi.fn(),
    getCategories: vi.fn(),
  },
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { id: 1, email: 'test@example.com' },
    isInitialized: true,
  }),
}));

import { api } from '@/lib/api';

describe('BooksPage', () => {
  let queryClient: QueryClient;

  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('should render without errors', async () => {
    const mockBooks = {
      items: [{ id: 1, title: 'Test Book', author: 'Test Author', price: 19.99, stock_quantity: 10, cover_image: null, rating: '4.5', review_count: 100, categories: [] }],
      total: 1,
      page: 1,
      size: 20,
    };

    (api.getBooks as any).mockResolvedValue(mockBooks);
    (api.getCategories as any).mockResolvedValue([]);

    render(<BooksPage />, { wrapper: createWrapper });

    await waitFor(() => {
      expect(screen.getByText(/browse books/i)).toBeInTheDocument();
    });
  });
});
