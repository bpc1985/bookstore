"use client";

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '@bookstore/types';
import type { ApiClient } from '@/lib/api';
import { api } from '@/lib/api';

export interface AuthStoreState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (
    api: ApiClient,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: (api: ApiClient) => Promise<void>;
  refreshAuth: (api: ApiClient) => Promise<void>;
  initialize: (api: ApiClient) => Promise<void>;
}

export const createAuthStore = () => {
  return create<AuthStoreState>()(
    devtools(
      persist(
        (set, get) => ({
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
          isInitialized: false,

          login: async (
            api: ApiClient,
            email: string,
            password: string,
          ) => {
            set({ isLoading: true });
            try {
              const tokens = await api.login({ email, password });
              api.setAccessToken(tokens.access_token);
              api.setRefreshToken(tokens.refresh_token);
              const user = await api.getCurrentUser();

              if (user.role !== 'admin') {
                set({ isLoading: false });
                throw new Error('Access denied. Admin privileges required.');
              }

              set({
                user,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                isLoading: false,
              });
            } catch (error) {
              set({ isLoading: false });
              throw error;
            }
          },

          logout: async (api: ApiClient) => {
            const { refreshToken } = get();
            try {
              await api.logout(refreshToken || undefined);
            } catch {
              // Ignore logout errors
            }
            api.setAccessToken(null);
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
            });
          },

          refreshAuth: async (api: ApiClient) => {
            const { refreshToken } = get();
            if (!refreshToken) return;

            try {
              const tokens = await api.refreshToken(refreshToken);
              api.setAccessToken(tokens.access_token);
              const user = await api.getCurrentUser();
              set({
                user,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
              });
            } catch {
              set({
                user: null,
                accessToken: null,
                refreshToken: null,
              });
            }
          },

          initialize: async (api: ApiClient) => {
            const { accessToken, refreshToken } = get();

            // Sync refresh token to API client for auto-refresh on 401
            if (refreshToken) {
              api.setRefreshToken(refreshToken);
            }

            // Keep store in sync when API client auto-refreshes tokens
            api.setOnTokenRefreshed((newToken: string) => {
              set({ accessToken: newToken });
            });

            if (accessToken) {
              api.setAccessToken(accessToken);
              try {
                const currentUser = await api.getCurrentUser();
                if (currentUser.role !== 'admin') {
                  set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                  });
                } else {
                  set({ user: currentUser });
                }
              } catch {
                if (refreshToken) {
                  try {
                    const tokens = await api.refreshToken(refreshToken);
                    api.setAccessToken(tokens.access_token);
                    api.setRefreshToken(tokens.refresh_token);
                    const currentUser = await api.getCurrentUser();
                    if (currentUser.role === 'admin') {
                      set({
                        user: currentUser,
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token,
                      });
                    } else {
                      set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                      });
                    }
                  } catch {
                    set({
                      user: null,
                      accessToken: null,
                      refreshToken: null,
                    });
                  }
                } else {
                  set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                  });
                }
              }
            }
            set({ isInitialized: true });
          },
        }),
        {
          name: 'auth-storage',
          partialize: state => ({
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
            user: state.user,
          }),
          onRehydrateStorage: () => {
            return (state) => {
              // Called after persist rehydration completes.
              // Kick off initialize with the now-available token.
              if (state) {
                state.initialize(api);
              }
            };
          },
        },
      ),
      { name: 'auth-store' },
    ),
  );
};

export const useAuthStore = createAuthStore();
