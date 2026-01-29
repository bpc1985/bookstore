<template>
  <div class="container py-8">
    <div v-if="loading" class="max-w-4xl mx-auto space-y-8">
      <div class="h-32 animate-pulse rounded-xl bg-muted" />
      <div class="grid md:grid-cols-3 gap-8">
        <div class="md:col-span-2 space-y-4">
          <div v-for="i in 3" :key="`skeleton-${i}`" class="h-40 animate-pulse rounded-xl bg-muted" />
        </div>
        <div class="space-y-4">
          <div class="h-60 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>

    <div v-else-if="order" class="max-w-4xl mx-auto">
      <Button variant="ghost" class="mb-6" @click="navigateTo('/orders')">
        ← Back to Orders
      </Button>

      <Card class="mb-8">
        <CardContent class="p-6">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 class="text-2xl font-bold mb-1">Order #{{ order.id }}</h1>
              <p class="text-muted-foreground">Placed on {{ new Date(order.created_at).toLocaleDateString() }}</p>
            </div>
            <Badge :variant="getStatusVariant(order.status)" class="text-sm px-4 py-2">
              {{ formatStatus(order.status) }}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div class="grid md:grid-cols-3 gap-8">
        <div class="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div v-for="item in order.items" :key="item.id" class="flex gap-4 py-4 border-b last:border-0">
                  <img
                    :src="item.book_cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&h=150&fit=crop'"
                    :alt="item.book_title || ''"
                    class="w-20 h-28 object-cover rounded-lg"
                  />
                  <div class="flex-1">
                    <p class="font-semibold">{{ item.book_title }}</p>
                    <p class="text-sm text-muted-foreground">{{ item.book_author }}</p>
                    <p class="text-sm text-muted-foreground mt-1">Qty: {{ item.quantity }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-bold">${{ (Number(item.price_at_purchase) * item.quantity).toFixed(2) }}</p>
                    <p class="text-sm text-muted-foreground">${{ item.price_at_purchase }} each</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card v-if="order.status_history && order.status_history.length > 0">
            <CardHeader>
              <CardTitle>Order Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div
                  v-for="(history, index) in order.status_history"
                  :key="history.id"
                  class="flex gap-4"
                >
                  <div class="flex flex-col items-center">
                    <div
                      class="w-4 h-4 rounded-full"
                      :class="index === 0 ? 'bg-primary' : 'bg-muted'"
                    />
                    <div
                      v-if="index < order.status_history.length - 1"
                      class="w-0.5 h-12 bg-muted"
                    />
                  </div>
                  <div class="flex-1 pb-4">
                    <div class="flex justify-between">
                      <p class="font-medium">{{ formatStatus(history.status) }}</p>
                      <p class="text-sm text-muted-foreground">
                        {{ new Date(history.created_at).toLocaleString() }}
                      </p>
                    </div>
                    <p v-if="history.note" class="text-sm text-muted-foreground mt-1">
                      {{ history.note }}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Subtotal</span>
                <span>${{ Number(order.total_amount).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Shipping</span>
                <span>Free</span>
              </div>
              <Separator />
              <div class="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span class="text-primary">${{ Number(order.total_amount).toFixed(2) }}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="whitespace-pre-line">{{ order.shipping_address }}</p>
            </CardContent>
          </Card>

          <Card v-if="order.status === 'pending'">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" class="w-full" @click="handleCancelOrder">
                Cancel Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <p class="text-muted-foreground">Order not found</p>
      <Button class="mt-4" @click="navigateTo('/orders')">
        Back to Orders
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '@bookstore/types'

const route = useRoute()
const { api } = useApi()
const toast = useToast()

const order = ref<Order | null>(null)
const loading = ref(true)

const fetchOrder = async () => {
  loading.value = true
  try {
    order.value = await api.getOrder(Number(route.params.id))
  } catch (error) {
    console.error('Failed to fetch order:', error)
    toast.error('Failed to load order')
  } finally {
    loading.value = false
  }
}

const handleCancelOrder = async () => {
  try {
    await api.cancelOrder(Number(route.params.id))
    toast.success('Order cancelled')
    await fetchOrder()
  } catch (error) {
    toast.error('Failed to cancel order')
  }
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    paid: 'default',
    shipped: 'default',
    completed: 'default',
    cancelled: 'destructive',
  }
  return variants[status] || 'outline'
}

const formatStatus = (status: string) => {
  const formatted: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return formatted[status] || status
}

onMounted(() => {
  fetchOrder()
})
</script>
