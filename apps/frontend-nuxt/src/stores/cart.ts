import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Cart, CartItem } from '@bookstore/types'
import { getApiClient } from '@/lib/api'

function getApi() {
  const config = useRuntimeConfig()
  return getApiClient({
    baseUrl: config.public.apiUrl,
  })
}

export const useCartStore = defineStore('cart', () => {
  const cart = ref<Cart | null>(null)
  const loading = ref(false)

  const items = computed(() => cart.value?.items || [])
  const itemCount = computed(() => cart.value?.total_items || 0)
  const totalAmount = computed(() => cart.value?.total_amount || 0)

  async function fetchCart() {
    loading.value = true
    try {
      cart.value = await getApi().getCart()
    } catch (error) {
      console.error('Failed to fetch cart:', error)
      cart.value = null
    } finally {
      loading.value = false
    }
  }

  async function addItem(bookId: number, quantity = 1) {
    try {
      const item = await getApi().addToCart(bookId, quantity)
      if (cart.value) {
        const existingItem = cart.value.items.find(i => i.id === item.id)
        if (existingItem) {
          existingItem.quantity = item.quantity
          existingItem.subtotal = item.subtotal
        } else {
          cart.value.items.push(item)
        }
        cart.value.total_items = cart.value.items.reduce((sum, i) => sum + i.quantity, 0)
        cart.value.total_amount = cart.value.items.reduce((sum, i) => sum + i.subtotal, 0)
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error)
      throw error
    }
  }

  async function updateItem(itemId: number, quantity: number) {
    try {
      const item = await getApi().updateCartItem(itemId, quantity)
      if (cart.value) {
        const index = cart.value.items.findIndex(i => i.id === itemId)
        if (index !== -1) {
          cart.value.items[index] = item
          cart.value.total_items = cart.value.items.reduce((sum, i) => sum + i.quantity, 0)
          cart.value.total_amount = cart.value.items.reduce((sum, i) => sum + i.subtotal, 0)
        }
      }
    } catch (error) {
      console.error('Failed to update cart item:', error)
      throw error
    }
  }

  async function removeItem(itemId: number) {
    try {
      await getApi().removeCartItem(itemId)
      if (cart.value) {
        cart.value.items = cart.value.items.filter(i => i.id !== itemId)
        cart.value.total_items = cart.value.items.reduce((sum, i) => sum + i.quantity, 0)
        cart.value.total_amount = cart.value.items.reduce((sum, i) => sum + i.subtotal, 0)
      }
    } catch (error) {
      console.error('Failed to remove cart item:', error)
      throw error
    }
  }

  async function clearCart() {
    try {
      await getApi().clearCart()
      cart.value = null
    } catch (error) {
      console.error('Failed to clear cart:', error)
      throw error
    }
  }

  return {
    cart,
    loading,
    items,
    itemCount,
    totalAmount,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
  }
})
