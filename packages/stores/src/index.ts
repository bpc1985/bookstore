import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, Cart, CartItem } from '@bookstore/types';
import type { ApiClient } from '@bookstore/api';

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

export interface CartStoreState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  fetchCart: (api: ApiClient) => Promise<void>;
  addItem: (
    api: ApiClient,
    bookId: number,
    quantity?: number,
  ) => Promise<void>;
  updateItem: (
    api: ApiClient,
    itemId: number,
    quantity: number,
  ) => Promise<void>;
  removeItem: (api: ApiClient, itemId: number) => Promise<void>;
  clearCart: (api: ApiClient) => Promise<void>;
}

export const createCartStore = () => {
  return create<CartStoreState>()(
    devtools(
      (set, get) => ({
        cart: null,
        isLoading: false,
        error: null,

        fetchCart: async (api: ApiClient) => {
          set({ isLoading: true, error: null });
          try {
            const cart = await api.getCart();
            set({ cart, isLoading: false });
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
          }
        },

        addItem: async (
          api: ApiClient,
          bookId: number,
          quantity = 1,
        ) => {
          set({ isLoading: true, error: null });
          try {
            await api.addToCart(bookId, quantity);
            const cart = await api.getCart();
            set({ cart, isLoading: false });
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
          }
        },

        updateItem: async (
          api: ApiClient,
          itemId: number,
          quantity: number,
        ) => {
          set({ isLoading: true, error: null });
          try {
            await api.updateCartItem(itemId, quantity);
            const cart = await api.getCart();
            set({ cart, isLoading: false });
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
          }
        },

        removeItem: async (api: ApiClient, itemId: number) => {
          set({ isLoading: true, error: null });
          try {
            await api.removeCartItem(itemId);
            const cart = await api.getCart();
            set({ cart, isLoading: false });
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
          }
        },

        clearCart: async (api: ApiClient) => {
          set({ isLoading: true, error: null });
          try {
            await api.clearCart();
            set({
              cart: { items: [], total_items: 0, subtotal: '0.00' },
              isLoading: false,
            });
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
          }
        },
      }),
      { name: 'cart-store' },
    ),
  );
};
