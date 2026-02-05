import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoogleSignInButton } from '../GoogleSignInButton';
import { api } from '@/lib/api';
import { toast } from 'sonner';

vi.mock('@/lib/api', () => ({
  api: {
    getGoogleAuthUrl: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with signin variant text', () => {
    render(<GoogleSignInButton variant="signin" />);
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('should render with signup variant text', () => {
    render(<GoogleSignInButton variant="signup" />);
    expect(screen.getByText('Sign up with Google')).toBeInTheDocument();
  });

  it('should show loading state on click', async () => {
    let resolvePromise: (value: any) => void;
    (api.getGoogleAuthUrl as any).mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve; })
    );

    render(<GoogleSignInButton />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('should redirect to authorization URL on success', async () => {
    const mockAuthUrl = 'https://accounts.google.com/oauth/authorize?client_id=123';
    (api.getGoogleAuthUrl as any).mockResolvedValue({ authorization_url: mockAuthUrl });

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(<GoogleSignInButton />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(window.location.href).toBe(mockAuthUrl);
    });

    window.location = originalLocation;
  });

  it('should show error toast on 503 error', async () => {
    (api.getGoogleAuthUrl as any).mockRejectedValue(new Error('503 Service Unavailable'));

    render(<GoogleSignInButton />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Google sign-in is not available');
    });
  });

  it('should show error toast on network error', async () => {
    (api.getGoogleAuthUrl as any).mockRejectedValue(new Error('Network error'));

    render(<GoogleSignInButton />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Unable to connect. Please try again.');
    });
  });
});
