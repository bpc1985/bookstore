"use client";

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '@bookstore/types';
import type { ApiClient } from '@/lib/api';

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
  loginWithGoogle: (
    api: ApiClient,
    code: string,
    state: string,
  ) => Promise<void>;
  loginWithTokens: (
    api: ApiClient,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  register: (
    api: ApiClient,
    email: string,
    password: string,
    fullName: string,
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
              const user = await api.getCurrentUser();
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

          loginWithGoogle: async (
            api: ApiClient,
            code: string,
            state: string,
          ) => {
            set({ isLoading: true });
            try {
              const tokens = await api.googleCallback(code, state);
              api.setAccessToken(tokens.access_token);
              const user = await api.getCurrentUser();
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

          loginWithTokens: async (
            api: ApiClient,
            accessToken: string,
            refreshToken: string,
          ) => {
            set({ isLoading: true });
            try {
              api.setAccessToken(accessToken);
              const user = await api.getCurrentUser();
              set({
                user,
                accessToken,
                refreshToken,
                isLoading: false,
              });
            } catch (error) {
              set({ isLoading: false });
              throw error;
            }
          },

          register: async (
            api: ApiClient,
            email: string,
            password: string,
            fullName: string,
          ) => {
            set({ isLoading: true });
            try {
              await api.register({ email, password, full_name: fullName });
              const tokens = await api.login({ email, password });
              api.setAccessToken(tokens.access_token);
              const user = await api.getCurrentUser();
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

            if (accessToken) {
              api.setAccessToken(accessToken);
              try {
                const user = await api.getCurrentUser();
                set({ user, isInitialized: true });
              } catch {
                if (refreshToken) {
                  try {
                    const tokens = await api.refreshToken(refreshToken);
                    api.setAccessToken(tokens.access_token);
                    const user = await api.getCurrentUser();
                    set({
                      user,
                      accessToken: tokens.access_token,
                      refreshToken: tokens.refresh_token,
                      isInitialized: true,
                    });
                  } catch {
                    set({
                      user: null,
                      accessToken: null,
                      refreshToken: null,
                      isInitialized: true,
                    });
                  }
                } else {
                  set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isInitialized: true,
                  });
                }
              }
            } else {
              set({ isInitialized: true });
            }
          },
        }),
        {
          name: 'auth-storage',
          partialize: state => ({
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
          }),
        },
      ),
      { name: 'auth-store' },
    ),
  );
};

export const useAuthStore = createAuthStore();
