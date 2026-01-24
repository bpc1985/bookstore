'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Token } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isInitialized: false,

      login: async (email: string, password: string) => {
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

      register: async (email: string, password: string, fullName: string) => {
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

      logout: async () => {
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

      refreshAuth: async () => {
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

      initialize: async () => {
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
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
