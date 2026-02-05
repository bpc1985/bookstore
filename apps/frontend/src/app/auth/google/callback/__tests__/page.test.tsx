import { render, screen, waitFor } from '@testing-library/react';
import GoogleCallbackPage from '../page';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: {},
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useSearchParams } from 'next/navigation';

describe('GoogleCallbackPage', () => {
  const mockLoginWithGoogle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector({ loginWithGoogle: mockLoginWithGoogle });
      }
      return { loginWithGoogle: mockLoginWithGoogle };
    });
  });

  it('should redirect to login when params are missing', async () => {
    (useSearchParams as any).mockReturnValue({
      get: (key: string) => null,
    });

    render(<GoogleCallbackPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('should display loading indicator', () => {
    (useSearchParams as any).mockReturnValue({
      get: (key: string) => {
        if (key === 'code') return 'test-code';
        if (key === 'state') return 'test-state';
        return null;
      },
    });

    mockLoginWithGoogle.mockImplementation(() => new Promise(() => {}));

    render(<GoogleCallbackPage />);

    expect(screen.getByText('Completing sign-in...')).toBeInTheDocument();
  });

  it('should redirect to home on success', async () => {
    (useSearchParams as any).mockReturnValue({
      get: (key: string) => {
        if (key === 'code') return 'test-code';
        if (key === 'state') return 'test-state';
        return null;
      },
    });

    mockLoginWithGoogle.mockResolvedValue(undefined);

    render(<GoogleCallbackPage />);

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Welcome!');
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('should show error and redirect to login on failure', async () => {
    (useSearchParams as any).mockReturnValue({
      get: (key: string) => {
        if (key === 'code') return 'invalid-code';
        if (key === 'state') return 'test-state';
        return null;
      },
    });

    mockLoginWithGoogle.mockRejectedValue(new Error('401 Unauthorized'));

    render(<GoogleCallbackPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Sign-in failed. Please try again.');
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });
});
