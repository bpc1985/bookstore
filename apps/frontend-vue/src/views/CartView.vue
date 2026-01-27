<template>
  <div class="min-h-screen">
    <div class="container py-8">
      <h1 class="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div v-if="isLoading" class="grid md:grid-cols-3 gap-8">
        <div class="md:col-span-2 space-y-4">
          <div v-for="i in 3" :key="`skeleton-${i}`" class="flex gap-4 p-4 border rounded-xl">
            <div class="w-24 h-32 animate-pulse rounded-lg bg-muted" />
            <div class="flex-1 space-y-2">
              <div class="h-5 w-3/4 animate-pulse rounded bg-muted" />
              <div class="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div class="h-6 w-1/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div class="h-40 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>

      <div v-else-if="!cart || cart.items.length === 0" class="text-center py-12">
        <ShoppingCart class="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 class="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p class="text-muted-foreground mb-6">Add some books to get started</p>
        <RouterLink to="/books">
          <Button>Browse Books</Button>
        </RouterLink>
      </div>

      <div v-else class="grid md:grid-cols-3 gap-8">
        <div class="md:col-span-2 space-y-4">
          <Card v-for="item in cart.items" :key="item.id" class="overflow-hidden">
            <CardContent class="p-4">
              <div class="flex gap-4">
                <img
                  :src="item.book.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop'"
                  :alt="item.book.title"
                  class="w-24 h-32 object-cover rounded-lg"
                />
                <div class="flex-1">
                  <div class="flex justify-between mb-2">
                    <RouterLink :to="`/books/${item.book.id}`" class="font-semibold hover:text-primary">
                      {{ item.book.title }}
                    </RouterLink>
                    <Button variant="ghost" size="icon" @click="handleRemoveItem(item.id)">
                      <X class="h-4 w-4" />
                    </Button>
                  </div>
                  <p class="text-sm text-muted-foreground mb-2">{{ item.book.author }}</p>
                  <p class="font-semibold mb-3">${item.book.price}</p>
                  <div class="flex items-center gap-2">
                    <Button variant="outline" size="icon" class="h-8 w-8" @click="updateQuantity(item.id, item.quantity - 1)">
                      <Minus class="h-3 w-3" />
                    </Button>
                    <span class="w-8 text-center font-medium">{{ item.quantity }}</span>
                    <Button variant="outline" size="icon" class="h-8 w-8" @click="updateQuantity(item.id, item.quantity + 1)">
                      <Plus class="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-bold text-lg">${(parseFloat(item.book.price) * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Subtotal ({{ cart.total_items }} items)</span>
                <span class="font-semibold">${cart.subtotal}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Shipping</span>
                <span class="font-semibold">Free</span>
              </div>
              <Separator />
              <div class="flex justify-between text-lg">
                <span class="font-bold">Total</span>
                <span class="font-bold text-primary">${cart.subtotal}</span>
              </div>
              <Button class="w-full" size="lg" @click="router.push('/checkout')">
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ShoppingCart, X, Minus, Plus } from 'lucide-vue-next'
import { useCartStore } from '@/stores/cart'
import { toast } from 'vue-sonner'
import type { Cart } from '@bookstore/types'

const router = useRouter()
const cartStore = useCartStore()

const cart = ref<Cart | null>(null)
const isLoading = ref(true)

const fetchCart = async () => {
  isLoading.value = true
  try {
    await cartStore.fetchCart()
    cart.value = cartStore.cart
  } catch (error) {
    console.error('Failed to fetch cart:', error)
  } finally {
    isLoading.value = false
  }
}

const updateQuantity = async (itemId: number, quantity: number) => {
  if (quantity < 1) {
    await handleRemoveItem(itemId)
    return
  }
  try {
    await cartStore.updateItem(itemId, quantity)
    cart.value = cartStore.cart
  } catch (error) {
    toast.error('Failed to update quantity')
  }
}

const handleRemoveItem = async (itemId: number) => {
  try {
    await cartStore.removeItem(itemId)
    cart.value = cartStore.cart
    toast.success('Item removed from cart')
  } catch (error) {
    toast.error('Failed to remove item')
  }
}

onMounted(() => {
  fetchCart()
})
</script>
