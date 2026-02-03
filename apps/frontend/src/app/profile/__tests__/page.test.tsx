import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfilePage from '@/app/profile/page';
import { api } from '@/lib/api';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: {
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
    },
    isInitialized: true,
  }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getOrders: vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      size: 5,
      pages: 1,
    }),
    getProfile: vi.fn().mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
    }),
    updateProfile: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/hooks/use-profile', () => ({
  useUpdateProfileMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/middleware/AuthGuard', () => ({
  default: ({ children, requireAuth }: any) => children,
}));

describe('ProfilePage', () => {
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
    render(<ProfilePage />, { wrapper: createWrapper });

    await waitFor(() => {
      expect(screen.getByText(/my profile/i)).toBeInTheDocument();
    });
  });
});
