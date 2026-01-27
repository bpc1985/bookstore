<template>
  <!-- Loading skeleton while auth initializes -->
  <div v-if="!authStore.isInitialized || !authStore.user" class="container py-8">
    <Skeleton class="h-10 w-48 mb-8" />
    <div class="grid lg:grid-cols-2 gap-8">
      <Skeleton class="h-96 w-full" />
      <Skeleton class="h-64 w-full" />
    </div>
  </div>

  <!-- Empty cart state -->
  <div v-else-if="!isLoading && (!cart || cart.items.length === 0)" class="container py-8 text-center">
    <h1 class="text-2xl font-bold mb-4">Your cart is empty</h1>
    <p class="text-muted-foreground mb-6">Add some books before checking out.</p>
    <RouterLink to="/books">
      <Button>Browse Books</Button>
    </RouterLink>
  </div>

  <!-- Checkout content -->
  <div v-else class="container py-8">
    <RouterLink to="/cart" class="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
      <ArrowLeft class="h-4 w-4 mr-2" />
      Back to Cart
    </RouterLink>

    <h1 class="text-3xl font-bold mb-8">Checkout</h1>

    <div class="grid lg:grid-cols-2 gap-8">
      <!-- Shipping & Complete Order -->
      <div class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
            <CardDescription>Enter your delivery address</CardDescription>
          </CardHeader>
          <CardContent ref="formContent" class="space-y-4">
            <div class="space-y-2">
              <Label for="fullName">Full Name</Label>
              <Input
                id="fullName"
                v-model="fullName"
                required
                :disabled="isProcessing"
              />
            </div>
            <div class="space-y-2">
              <Label for="address">Address</Label>
              <textarea
                id="address"
                v-model="address"
                placeholder="Street address, apartment, suite, etc."
                required
                :disabled="isProcessing"
                class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="city">City</Label>
                <Input
                  id="city"
                  v-model="city"
                  required
                  :disabled="isProcessing"
                />
              </div>
              <div class="space-y-2">
                <Label for="state">State</Label>
                <Input
                  id="state"
                  v-model="state"
                  required
                  :disabled="isProcessing"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  v-model="zipCode"
                  required
                  :disabled="isProcessing"
                />
              </div>
              <div class="space-y-2">
                <Label for="country">Country</Label>
                <Input id="country" v-model="country" disabled />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              class="w-full"
              size="lg"
              :disabled="isProcessing || isLoading"
              @click="handleCompleteOrder"
            >
              <Loader2 v-if="isProcessing" class="h-4 w-4 mr-2 animate-spin" />
              <CheckCircle2 v-else class="h-4 w-4 mr-2" />
              {{ isProcessing ? 'Processing...' : 'Complete Order' }}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <!-- Order Summary -->
      <div>
        <Card class="sticky top-24">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-if="isLoading" class="space-y-3">
              <Skeleton v-for="i in 3" :key="`skeleton-${i}`" class="h-16 w-full" />
            </div>
            <template v-else>
              <div v-for="item in cart?.items" :key="item.id" class="flex justify-between text-sm">
                <div>
                  <span class="font-medium">{{ item.book.title }}</span>
                  <span class="text-muted-foreground"> x {{ item.quantity }}</span>
                </div>
                <span>${{ (parseFloat(item.book.price) * item.quantity).toFixed(2) }}</span>
              </div>
            </template>
            <Separator />
            <div class="flex justify-between">
              <span class="text-muted-foreground">Subtotal</span>
              <span>${{ cart?.subtotal || '0.00' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Shipping</span>
              <span class="text-green-600">Free</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Tax</span>
              <span>$0.00</span>
            </div>
            <Separator />
            <div class="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${{ cart?.subtotal || '0.00' }}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-vue-next'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'
import { api } from '@/composables/useApi'
import type { Cart, Order } from '@bookstore/types'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

const cart = ref<Cart | null>(null)
const isLoading = ref(true)
const isProcessing = ref(false)
const fullName = ref('')
const address = ref('')
const city = ref('')
const state = ref('')
const zipCode = ref('')
const country = ref('United States')
const formContent = ref<InstanceType<typeof import('@/components/ui/card-content.vue').default> | null>(null)

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

const formatAddress = () => {
  return `${fullName.value}\n${address.value}\n${city.value}, ${state.value} ${zipCode.value}\n${country.value}`
}

// Redirect to login if not authenticated
watch(
  () => [authStore.isInitialized, authStore.user],
  ([initialized, user]) => {
    if (initialized && !user) {
      router.push('/login')
    }
  },
  { immediate: true }
)

// Fetch cart and set user name when user is available
watch(
  () => authStore.user,
  (user) => {
    if (user) {
      fullName.value = user.full_name
      fetchCart()
    }
  },
  { immediate: true }
)

const handleCompleteOrder = async () => {
  // Validate all required fields using native constraint validation
  const el = formContent.value?.$el as HTMLElement | undefined
  if (el) {
    const inputs = el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
    for (const input of inputs) {
      if (!input.checkValidity()) {
        input.reportValidity()
        return
      }
    }
  }

  if (!cart.value || cart.value.items.length === 0) {
    toast.error('Your cart is empty')
    return
  }

  const fullAddress = formatAddress()

  isProcessing.value = true
  try {
    const order: Order = await api.createOrder(fullAddress)
    await cartStore.clearCart()
    toast.success('Order completed successfully!')
    router.push(`/order-confirmation/${order.id}`)
  } catch (error) {
    toast.error((error as Error).message)
  } finally {
    isProcessing.value = false
  }
}
</script>
