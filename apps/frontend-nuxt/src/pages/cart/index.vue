<template>
  <div class="container py-8">
    <h1 class="text-3xl font-bold mb-8">Shopping Cart</h1>

    <div v-if="cartStore.loading" class="text-center py-12">
      <p>Loading cart...</p>
    </div>

    <div v-else-if="cartStore.items.length === 0" class="text-center py-12">
      <p class="text-muted-foreground mb-4">Your cart is empty</p>
      <Button @click="navigateTo('/books')">
        Continue Shopping
      </Button>
    </div>

    <div v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-4">
          <Card v-for="item in cartStore.items" :key="item.id">
            <CardContent class="p-4">
              <div class="flex gap-4">
                <div class="w-20 h-28 bg-muted rounded flex-shrink-0">
                  <img
                    v-if="item.book.cover_image"
                    :src="item.book.cover_image"
                    :alt="item.book.title"
                    class="w-full h-full object-cover rounded"
                  />
                </div>
                <div class="flex-1 space-y-2">
                  <h3 class="font-semibold">{{ item.book.title }}</h3>
                  <p class="text-sm text-muted-foreground">{{ item.book.author }}</p>
                  <div class="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      class="h-8 w-8"
                      @click="updateQuantity(item.id, item.quantity - 1)"
                    >
                      <Minus class="h-4 w-4" />
                    </Button>
                    <span class="w-8 text-center">{{ item.quantity }}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      class="h-8 w-8"
                      @click="updateQuantity(item.id, item.quantity + 1)"
                    >
                      <Plus class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-bold">${{ Number(item.subtotal).toFixed(2) }}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-destructive hover:text-destructive"
                    @click="removeItem(item.id)"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div class="lg:col-span-1">
          <Card class="sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex justify-between">
                <span>Subtotal ({{ cartStore.itemCount }} items)</span>
                <span>${{ Number(cartStore.totalAmount).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <Separator />
              <div class="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${{ Number(cartStore.totalAmount).toFixed(2) }}</span>
              </div>
              <Button class="w-full" size="lg" @click="navigateTo('/checkout')">
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
import { Minus, Plus } from 'lucide-vue-next'

const cartStore = useCartStore()
const toast = useToast()

const updateQuantity = async (itemId: number, quantity: number) => {
  if (quantity < 1) return
  try {
    await cartStore.updateItem(itemId, quantity)
  } catch (error: any) {
    toast.error(error.message || 'Failed to update quantity')
  }
}

const removeItem = async (itemId: number) => {
  try {
    await cartStore.removeItem(itemId)
    toast.success('Item removed from cart')
  } catch (error: any) {
    toast.error(error.message || 'Failed to remove item')
  }
}

onMounted(() => {
  cartStore.fetchCart()
})
</script>
