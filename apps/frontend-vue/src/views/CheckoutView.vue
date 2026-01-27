<template>
  <div class="min-h-screen">
    <div class="container py-8 max-w-2xl">
      <h1 class="text-3xl font-bold mb-8">Checkout</h1>

      <form @submit.prevent="handleCheckout" class="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="address">Full Address</Label>
              <Input
                id="address"
                v-model="shippingAddress"
                placeholder="Enter your shipping address"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="isLoading" class="space-y-4">
              <div v-for="i in 3" :key="`skeleton-${i}`" class="flex gap-4">
                <div class="w-16 h-20 animate-pulse rounded bg-muted" />
                <div class="flex-1 space-y-2">
                  <div class="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div class="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
            <div v-else-if="cart" class="space-y-4">
              <div v-for="item in cart.items" :key="item.id" class="flex gap-4 py-2 border-b">
                <img
                  :src="item.book.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&h=150&fit=crop'"
                  :alt="item.book.title"
                  class="w-16 h-20 object-cover rounded"
                />
                <div class="flex-1">
                  <p class="font-medium">{{ item.book.title }}</p>
                  <p class="text-sm text-muted-foreground">Qty: {{ item.quantity }}</p>
                </div>
                <p class="font-semibold">${(parseFloat(item.book.price) * item.quantity).toFixed(2)}</p>
              </div>
            </div>
            <div class="pt-4 space-y-2">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Subtotal</span>
                <span>{{ cart?.subtotal || '$0.00' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Shipping</span>
                <span>Free</span>
              </div>
              <Separator />
              <div class="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span class="text-primary">{{ cart?.subtotal || '$0.00' }}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <label
                v-for="method in paymentMethods"
                :key="method.id"
                class="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                :class="{ 'border-primary bg-accent': selectedPayment === method.id }"
              >
                <input
                  v-model="selectedPayment"
                  :value="method.id"
                  type="radio"
                  name="payment"
                  class="h-4 w-4"
                />
                <span class="font-medium">{{ method.name }}</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" class="w-full" :disabled="isLoading || isSubmitting">
          {{ isSubmitting ? 'Processing...' : 'Place Order' }}
        </Button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { toast } from 'vue-sonner'
import { api } from '@/composables/useApi'
import type { Cart, Order } from '@bookstore/types'

const router = useRouter()
const cartStore = useCartStore()

const cart = ref<Cart | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const shippingAddress = ref('')
const selectedPayment = ref('stripe')

const paymentMethods = [
  { id: 'stripe', name: 'Credit/Debit Card (Stripe)' },
  { id: 'paypal', name: 'PayPal' },
]

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

const handleCheckout = async () => {
  if (!cart.value || cart.value.items.length === 0) {
    toast.error('Your cart is empty')
    return
  }

  isSubmitting.value = true
  try {
    const order: Order = await api.createOrder(shippingAddress.value)
    await cartStore.clearCart()
    router.push(`/order-confirmation/${order.id}`)
  } catch (error) {
    toast.error('Failed to place order')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchCart()
})
</script>
