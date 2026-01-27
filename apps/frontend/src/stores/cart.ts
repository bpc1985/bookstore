"use client";

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Cart, CartItem } from '@bookstore/types';
import type { ApiClient } from '@/lib/api';

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

export const useCartStore = createCartStore();
