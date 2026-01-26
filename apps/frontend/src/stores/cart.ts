"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type { Cart } from "@/types";
import { api } from "@/lib/api";

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addItem: (bookId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

interface CartActions {
  fetchCart: () => Promise<void>;
  addItem: (bookId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState & CartActions>()(
  devtools(
    (set, get) => ({
      cart: null,
      isLoading: false,
      error: null,

      fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const cart = await api.getCart();
          set({ cart, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      addItem: async (bookId, quantity = 1) => {
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

      updateItem: async (itemId, quantity) => {
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

      removeItem: async itemId => {
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

      clearCart: async () => {
        set({ isLoading: true, error: null });
        try {
          await api.clearCart();
          set({
            cart: { items: [], total_items: 0, subtotal: "0.00" },
            isLoading: false,
          });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
    }),
    { name: "cart-store" }, // name shown in DevTools
  ),
);
