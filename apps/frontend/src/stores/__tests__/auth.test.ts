import { act } from '@testing-library/react';
import { createAuthStore } from '@/stores/auth';
import type { ApiClient } from '@/lib/api';
import type { User, Token } from '@bookstore/types';

describe('AuthStore', () => {
  let store: ReturnType<typeof createAuthStore>;
  let mockApiClient: ApiClient;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    full_name: 'Test User',
    is_active: true,
    is_admin: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockToken: Token = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    token_type: 'bearer',
    expires_in: 900,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockApiClient = {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      getCurrentUser: vi.fn(),
      setAccessToken: vi.fn(),
    } as unknown as ApiClient;

    store = createAuthStore();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState();

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isInitialized).toBe(false);
    });
  });

  describe('login', () => {
    it('should login successfully and set user', async () => {
      (mockApiClient.login as any).mockResolvedValue(mockToken);
      (mockApiClient.getCurrentUser as any).mockResolvedValue(mockUser);

      await act(async () => {
        await store.getState().login(mockApiClient, 'test@example.com', 'password');
      });

      const state = store.getState();

      expect(mockApiClient.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(mockApiClient.setAccessToken).toHaveBeenCalledWith(mockToken.access_token);
      expect(mockApiClient.getCurrentUser).toHaveBeenCalled();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(mockToken.access_token);
      expect(state.refreshToken).toBe(mockToken.refresh_token);
      expect(state.isLoading).toBe(false);
    });

    it('should handle login error', async () => {
      (mockApiClient.login as any).mockRejectedValue(
        new Error('Invalid credentials')
      );

      await expect(
        act(async () => {
          await store.getState().login(mockApiClient, 'test@example.com', 'wrong-password');
        })
      ).rejects.toThrow('Invalid credentials');

      const state = store.getState();

      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should set loading state during login', async () => {
      let resolveLogin: (value: Token) => void;
      (mockApiClient.login as any).mockImplementation(
        () => new Promise((resolve) => {
          resolveLogin = resolve;
        })
      );

      const loginPromise = store.getState().login(mockApiClient, 'test@example.com', 'password');

      expect(store.getState().isLoading).toBe(true);

      await act(async () => {
        (mockApiClient.getCurrentUser as any).mockResolvedValue(mockUser);
        resolveLogin!(mockToken);
        await loginPromise;
      });

      expect(store.getState().isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should register successfully and set user', async () => {
      (mockApiClient.register as any).mockResolvedValue(mockUser);
      (mockApiClient.login as any).mockResolvedValue(mockToken);
      (mockApiClient.getCurrentUser as any).mockResolvedValue(mockUser);

      await act(async () => {
        await store.getState().register(
          mockApiClient,
          'new@example.com',
          'password',
          'New User'
        );
      });

      const state = store.getState();

      expect(mockApiClient.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password',
        full_name: 'New User',
      });
      expect(mockApiClient.login).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password',
      });
      expect(state.user).toEqual(mockUser);
    });

    it('should handle registration error', async () => {
      (mockApiClient.register as any).mockRejectedValue(
        new Error('Email already exists')
      );

      await expect(
        act(async () => {
          await store.getState().register(
            mockApiClient,
            'test@example.com',
            'password',
            'Test User'
          );
        })
      ).rejects.toThrow('Email already exists');

      const state = store.getState();

      expect(state.user).toBeNull();
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear user', async () => {
      (mockApiClient.logout as any).mockResolvedValue(undefined);

      store.setState({
        accessToken: mockToken.access_token,
        refreshToken: mockToken.refresh_token,
        user: mockUser,
      });

      await act(async () => {
        await store.getState().logout(mockApiClient);
      });

      const state = store.getState();

      expect(mockApiClient.logout).toHaveBeenCalledWith(mockToken.refresh_token);
      expect(mockApiClient.setAccessToken).toHaveBeenCalledWith(null);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });

    it('should handle logout error gracefully', async () => {
      (mockApiClient.logout as any).mockRejectedValue(new Error('Logout failed'));

      store.setState({
        accessToken: mockToken.access_token,
        refreshToken: mockToken.refresh_token,
        user: mockUser,
      });

      await act(async () => {
        await store.getState().logout(mockApiClient);
      });

      const state = store.getState();

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });

  describe('refreshAuth', () => {
    it('should refresh tokens successfully', async () => {
      (mockApiClient.refreshToken as any).mockResolvedValue(mockToken);
      (mockApiClient.getCurrentUser as any).mockResolvedValue(mockUser);

      store.setState({ refreshToken: mockToken.refresh_token });

      await act(async () => {
        await store.getState().refreshAuth(mockApiClient);
      });

      const state = store.getState();

      expect(mockApiClient.refreshToken).toHaveBeenCalledWith(mockToken.refresh_token);
      expect(state.accessToken).toBe(mockToken.access_token);
      expect(state.user).toEqual(mockUser);
    });

    it('should clear auth on refresh failure', async () => {
      (mockApiClient.refreshToken as any).mockRejectedValue(new Error('Invalid token'));

      store.setState({
        refreshToken: 'invalid-token',
        user: mockUser,
        accessToken: 'old-access-token',
      });

      await act(async () => {
        await store.getState().refreshAuth(mockApiClient);
      });

      const state = store.getState();

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });

    it('should do nothing if no refresh token', async () => {
      await act(async () => {
        await store.getState().refreshAuth(mockApiClient);
      });

      expect(mockApiClient.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('should initialize with existing access token', async () => {
      (mockApiClient.getCurrentUser as any).mockResolvedValue(mockUser);

      store.setState({
        accessToken: mockToken.access_token,
        refreshToken: mockToken.refresh_token,
      });

      await act(async () => {
        await store.getState().initialize(mockApiClient);
      });

      const state = store.getState();

      expect(mockApiClient.setAccessToken).toHaveBeenCalledWith(mockToken.access_token);
      expect(mockApiClient.getCurrentUser).toHaveBeenCalled();
      expect(state.user).toEqual(mockUser);
      expect(state.isInitialized).toBe(true);
    });

    it('should try refresh token if access token fails', async () => {
      (mockApiClient.getCurrentUser as any)
        .mockRejectedValueOnce(new Error('Invalid access token'))
        .mockResolvedValueOnce(mockUser);
      (mockApiClient.refreshToken as any).mockResolvedValue(mockToken);

      store.setState({
        accessToken: 'invalid-access-token',
        refreshToken: mockToken.refresh_token,
      });

      await act(async () => {
        await store.getState().initialize(mockApiClient);
      });

      const state = store.getState();

      expect(mockApiClient.refreshToken).toHaveBeenCalledWith(mockToken.refresh_token);
      expect(state.user).toEqual(mockUser);
      expect(state.isInitialized).toBe(true);
    });

    it('should clear auth if both tokens fail', async () => {
      (mockApiClient.getCurrentUser as any).mockRejectedValue(new Error('Invalid'));
      (mockApiClient.refreshToken as any).mockRejectedValue(new Error('Invalid'));

      store.setState({
        accessToken: 'invalid-access-token',
        refreshToken: 'invalid-refresh-token',
        user: mockUser,
      });

      await act(async () => {
        await store.getState().initialize(mockApiClient);
      });

      const state = store.getState();

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isInitialized).toBe(true);
    });

    it('should set initialized to true if no tokens', async () => {
      await act(async () => {
        await store.getState().initialize(mockApiClient);
      });

      const state = store.getState();

      expect(state.isInitialized).toBe(true);
      expect(state.user).toBeNull();
    });
  });
});
