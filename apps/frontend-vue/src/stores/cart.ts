import { defineStore } from 'pinia'
import type { Cart, CartItem } from '@bookstore/types'
import type { ApiClient } from '@/lib/api'
import { api } from '@/lib/api'

interface CartState {
  cart: Cart | null
  isLoading: boolean
  error: string | null
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    cart: null,
    isLoading: false,
    error: null,
  }),

  actions: {
    async fetchCart() {
      this.isLoading = true
      this.error = null
      try {
        const cart = await api.getCart()
        this.cart = cart
        this.isLoading = false
      } catch (error) {
        this.error = (error as Error).message
        this.isLoading = false
        throw error
      }
    },

    async addItem(bookId: number, quantity = 1) {
      this.isLoading = true
      this.error = null
      try {
        await api.addToCart(bookId, quantity)
        const cart = await api.getCart()
        this.cart = cart
        this.isLoading = false
      } catch (error) {
        this.error = (error as Error).message
        this.isLoading = false
        throw error
      }
    },

    async updateItem(itemId: number, quantity: number) {
      this.isLoading = true
      this.error = null
      try {
        await api.updateCartItem(itemId, quantity)
        const cart = await api.getCart()
        this.cart = cart
        this.isLoading = false
      } catch (error) {
        this.error = (error as Error).message
        this.isLoading = false
        throw error
      }
    },

    async removeItem(itemId: number) {
      this.isLoading = true
      this.error = null
      try {
        await api.removeCartItem(itemId)
        const cart = await api.getCart()
        this.cart = cart
        this.isLoading = false
      } catch (error) {
        this.error = (error as Error).message
        this.isLoading = false
        throw error
      }
    },

    async clearCart() {
      this.isLoading = true
      this.error = null
      try {
        await api.clearCart()
        this.cart = { items: [], total_items: 0, subtotal: '0.00' }
        this.isLoading = false
      } catch (error) {
        this.error = (error as Error).message
        this.isLoading = false
        throw error
      }
    },
  },
})
