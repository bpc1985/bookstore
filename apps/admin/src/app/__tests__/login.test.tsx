import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AdminLoginPage from '../login/page';

const mockPush = vi.fn();
const mockLogin = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

const mockUseAuthStore = vi.fn();
vi.mock('@/stores/auth', () => ({
  useAuthStore: (...args: unknown[]) => mockUseAuthStore(...args),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
    mockUseAuthStore.mockReturnValue({
      user: null,
      isInitialized: true,
      login: mockLogin,
    });
  });

  it('should render login form', () => {
    render(<AdminLoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should render branding elements', () => {
    render(<AdminLoginPage />);

    expect(screen.getByText('Bookstore Admin')).toBeInTheDocument();
    expect(screen.getByText(/sign in to access/i)).toBeInTheDocument();
  });

  it('should have required email and password fields', () => {
    render(<AdminLoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeRequired();
    expect(screen.getByLabelText(/password/i)).toBeRequired();
  });

  it('should login and redirect on success', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'admin@bookstore.com');
    await user.type(screen.getByLabelText(/password/i), 'admin123456');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    expect(toast.success).toHaveBeenCalledWith('Logged in successfully');
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should show error toast on login failure', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('should show "Signing in..." while loading', async () => {
    const user = userEvent.setup();
    mockLogin.mockReturnValue(new Promise(() => {})); // never resolves

    render(<AdminLoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'admin@bookstore.com');
    await user.type(screen.getByLabelText(/password/i), 'admin123456');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });
  });

  it('should redirect to / if already authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      user: { id: 1, email: 'admin@bookstore.com', full_name: 'Admin', role: 'admin' },
      isInitialized: true,
      login: mockLogin,
    });

    render(<AdminLoginPage />);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should disable submit button when not initialized', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isInitialized: false,
      login: mockLogin,
    });

    render(<AdminLoginPage />);

    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  it('should render email input as type email', () => {
    render(<AdminLoginPage />);

    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
  });

  it('should render password input as type password', () => {
    render(<AdminLoginPage />);

    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
  });

  it('should show placeholder text', () => {
    render(<AdminLoginPage />);

    expect(screen.getByPlaceholderText('admin@bookstore.com')).toBeInTheDocument();
  });
});
