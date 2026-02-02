import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfilePage from '@/app/profile/page';

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

vi.mock('@/lib/hooks', () => ({
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

  it('should render without errors', () => {
    render(<ProfilePage />, { wrapper: createWrapper });

    expect(screen.getByText(/my profile/i)).toBeInTheDocument();
  });
});
