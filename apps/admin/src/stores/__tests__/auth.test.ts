import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthStore } from '@/stores/auth';
import type { ApiClient } from '@/lib/api';

// Prevent persist middleware from using real localStorage during module load
vi.mock('zustand/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('zustand/middleware')>();
  return {
    ...actual,
    persist: (fn: any) => fn,
  };
});

const mockAdmin = {
  id: 1,
  email: 'admin@bookstore.com',
  username: 'admin',
  full_name: 'Admin User',
  is_active: true,
  is_admin: true,
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockNonAdmin = {
  ...mockAdmin,
  id: 2,
  email: 'user@bookstore.com',
  role: 'user',
  is_admin: false,
};

const mockTokens = {
  access_token: 'access-tok',
  refresh_token: 'refresh-tok',
  token_type: 'bearer' as const,
  expires_in: 900,
};

function createMockApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    login: vi.fn().mockResolvedValue(mockTokens),
    getCurrentUser: vi.fn().mockResolvedValue(mockAdmin),
    logout: vi.fn().mockResolvedValue(undefined),
    refreshToken: vi.fn().mockResolvedValue(mockTokens),
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setOnTokenRefreshed: vi.fn(),
    ...overrides,
  } as unknown as ApiClient;
}

describe('Auth Store', () => {
  let store: ReturnType<typeof createAuthStore>;

  beforeEach(() => {
    store = createAuthStore();
  });

  describe('initial state', () => {
    it('should have null user and tokens', () => {
      const state = store.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isInitialized).toBe(false);
    });
  });

  describe('login', () => {
    it('should login admin user successfully', async () => {
      const api = createMockApi();
      await store.getState().login(api, 'admin@bookstore.com', 'admin123456');

      const state = store.getState();
      expect(api.login).toHaveBeenCalledWith({ email: 'admin@bookstore.com', password: 'admin123456' });
      expect(api.setAccessToken).toHaveBeenCalledWith('access-tok');
      expect(api.setRefreshToken).toHaveBeenCalledWith('refresh-tok');
      expect(api.getCurrentUser).toHaveBeenCalled();
      expect(state.user).toEqual(mockAdmin);
      expect(state.accessToken).toBe('access-tok');
      expect(state.refreshToken).toBe('refresh-tok');
      expect(state.isLoading).toBe(false);
    });

    it('should reject non-admin users', async () => {
      const api = createMockApi({
        getCurrentUser: vi.fn().mockResolvedValue(mockNonAdmin),
      });

      await expect(
        store.getState().login(api, 'user@bookstore.com', 'user123456'),
      ).rejects.toThrow('Access denied. Admin privileges required.');

      expect(store.getState().user).toBeNull();
      expect(store.getState().isLoading).toBe(false);
    });

    it('should set isLoading during login', async () => {
      let loadingDuringCall = false;
      const api = createMockApi({
        login: vi.fn().mockImplementation(async () => {
          loadingDuringCall = store.getState().isLoading;
          return mockTokens;
        }),
      });

      await store.getState().login(api, 'a@b.com', 'pw');
      expect(loadingDuringCall).toBe(true);
      expect(store.getState().isLoading).toBe(false);
    });

    it('should reset isLoading on login API failure', async () => {
      const api = createMockApi({
        login: vi.fn().mockRejectedValue(new Error('Network error')),
      });

      await expect(store.getState().login(api, 'a@b.com', 'pw')).rejects.toThrow('Network error');
      expect(store.getState().isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear state and API tokens', async () => {
      const api = createMockApi();

      // Login first
      await store.getState().login(api, 'admin@bookstore.com', 'pw');
      expect(store.getState().user).not.toBeNull();

      // Logout
      await store.getState().logout(api);

      const state = store.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(api.setAccessToken).toHaveBeenLastCalledWith(null);
    });

    it('should send refresh token to logout endpoint', async () => {
      const api = createMockApi();

      await store.getState().login(api, 'admin@bookstore.com', 'pw');
      await store.getState().logout(api);

      expect(api.logout).toHaveBeenCalledWith('refresh-tok');
    });

    it('should clear state even if logout API call fails', async () => {
      const api = createMockApi({
        logout: vi.fn().mockRejectedValue(new Error('Server error')),
      });

      await store.getState().login(api, 'admin@bookstore.com', 'pw');
      await store.getState().logout(api);

      expect(store.getState().user).toBeNull();
      expect(store.getState().accessToken).toBeNull();
    });
  });

  describe('refreshAuth', () => {
    it('should refresh tokens and update user', async () => {
      const newTokens = { ...mockTokens, access_token: 'new-access', refresh_token: 'new-refresh' };
      const api = createMockApi({
        refreshToken: vi.fn().mockResolvedValue(newTokens),
      });

      // Set initial refresh token
      store.setState({ refreshToken: 'old-refresh' });

      await store.getState().refreshAuth(api);

      expect(api.refreshToken).toHaveBeenCalledWith('old-refresh');
      expect(api.setAccessToken).toHaveBeenCalledWith('new-access');
      const state = store.getState();
      expect(state.accessToken).toBe('new-access');
      expect(state.refreshToken).toBe('new-refresh');
      expect(state.user).toEqual(mockAdmin);
    });

    it('should do nothing if no refresh token', async () => {
      const api = createMockApi();
      await store.getState().refreshAuth(api);
      expect(api.refreshToken).not.toHaveBeenCalled();
    });

    it('should clear state if refresh fails', async () => {
      const api = createMockApi({
        refreshToken: vi.fn().mockRejectedValue(new Error('Invalid token')),
      });

      store.setState({ refreshToken: 'bad-token', accessToken: 'old-access', user: mockAdmin });
      await store.getState().refreshAuth(api);

      expect(store.getState().user).toBeNull();
      expect(store.getState().accessToken).toBeNull();
      expect(store.getState().refreshToken).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should sync refresh token to API client', async () => {
      const api = createMockApi();
      store.setState({ refreshToken: 'rt', accessToken: 'at' });

      await store.getState().initialize(api);

      expect(api.setRefreshToken).toHaveBeenCalledWith('rt');
    });

    it('should set onTokenRefreshed callback', async () => {
      const api = createMockApi();
      await store.getState().initialize(api);
      expect(api.setOnTokenRefreshed).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should validate user with existing access token', async () => {
      const api = createMockApi();
      store.setState({ accessToken: 'at' });

      await store.getState().initialize(api);

      expect(api.setAccessToken).toHaveBeenCalledWith('at');
      expect(api.getCurrentUser).toHaveBeenCalled();
      expect(store.getState().user).toEqual(mockAdmin);
      expect(store.getState().isInitialized).toBe(true);
    });

    it('should clear state for non-admin user during initialize', async () => {
      const api = createMockApi({
        getCurrentUser: vi.fn().mockResolvedValue(mockNonAdmin),
      });
      store.setState({ accessToken: 'at', refreshToken: 'rt', user: mockNonAdmin });

      await store.getState().initialize(api);

      expect(store.getState().user).toBeNull();
      expect(store.getState().accessToken).toBeNull();
      expect(store.getState().isInitialized).toBe(true);
    });

    it('should attempt refresh if access token is expired', async () => {
      const newTokens = { ...mockTokens, access_token: 'fresh-access', refresh_token: 'fresh-refresh' };
      const api = createMockApi({
        getCurrentUser: vi.fn()
          .mockRejectedValueOnce(new Error('Unauthorized'))
          .mockResolvedValueOnce(mockAdmin),
        refreshToken: vi.fn().mockResolvedValue(newTokens),
      });

      store.setState({ accessToken: 'expired', refreshToken: 'rt' });
      await store.getState().initialize(api);

      expect(api.refreshToken).toHaveBeenCalledWith('rt');
      expect(store.getState().user).toEqual(mockAdmin);
      expect(store.getState().accessToken).toBe('fresh-access');
      expect(store.getState().isInitialized).toBe(true);
    });

    it('should clear state if both access and refresh tokens fail', async () => {
      const api = createMockApi({
        getCurrentUser: vi.fn().mockRejectedValue(new Error('Unauthorized')),
        refreshToken: vi.fn().mockRejectedValue(new Error('Invalid')),
      });

      store.setState({ accessToken: 'expired', refreshToken: 'bad' });
      await store.getState().initialize(api);

      expect(store.getState().user).toBeNull();
      expect(store.getState().accessToken).toBeNull();
      expect(store.getState().refreshToken).toBeNull();
      expect(store.getState().isInitialized).toBe(true);
    });

    it('should clear state if access token fails and no refresh token', async () => {
      const api = createMockApi({
        getCurrentUser: vi.fn().mockRejectedValue(new Error('Unauthorized')),
      });

      store.setState({ accessToken: 'expired' });
      await store.getState().initialize(api);

      expect(store.getState().user).toBeNull();
      expect(store.getState().accessToken).toBeNull();
      expect(store.getState().isInitialized).toBe(true);
    });

    it('should set isInitialized even with no tokens', async () => {
      const api = createMockApi();
      await store.getState().initialize(api);
      expect(store.getState().isInitialized).toBe(true);
    });

    it('should reject non-admin after refresh', async () => {
      const api = createMockApi({
        getCurrentUser: vi.fn()
          .mockRejectedValueOnce(new Error('Unauthorized'))
          .mockResolvedValueOnce(mockNonAdmin),
        refreshToken: vi.fn().mockResolvedValue(mockTokens),
      });

      store.setState({ accessToken: 'expired', refreshToken: 'rt' });
      await store.getState().initialize(api);

      expect(store.getState().user).toBeNull();
      expect(store.getState().accessToken).toBeNull();
      expect(store.getState().isInitialized).toBe(true);
    });
  });
});
