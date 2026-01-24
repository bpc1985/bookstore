'use client';

import { create } from 'zustand';
import type { Cart, CartItem } from '@/types';
import { api } from '@/lib/api';

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

export const useCartStore = create<CartState>((set, get) => ({
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
    }
  },

  addItem: async (bookId: number, quantity = 1) => {
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

  updateItem: async (itemId: number, quantity: number) => {
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

  removeItem: async (itemId: number) => {
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
      set({ cart: { items: [], total_items: 0, subtotal: '0.00' }, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
}));
