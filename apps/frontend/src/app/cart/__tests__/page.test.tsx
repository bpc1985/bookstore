import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CartPage from '@/app/cart/page';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { id: 1, email: 'test@example.com' },
    isInitialized: true,
  }),
}));

vi.mock('@/stores/cart', () => ({
  useCartStore: () => ({
    cart: {
      items: [
        {
          id: 1,
          book_id: 1,
          book: {
            id: 1,
            title: 'Test Book',
            author: 'Test Author',
            price: 29.99,
          },
          quantity: 2,
        },
      ],
      total_items: 2,
      subtotal: '59.98',
    },
    isLoading: false,
    fetchCart: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CartPage', () => {
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

  it('should render without errors', () => {
    render(<CartPage />, { wrapper: createWrapper });

    expect(screen.getByText(/shopping cart/i)).toBeInTheDocument();
  });
});
