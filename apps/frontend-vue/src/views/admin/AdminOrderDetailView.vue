<template>
  <div v-if="isLoading" class="space-y-8">
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

  <div v-else-if="order" class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold mb-1">Order #{{ order.id }}</h2>
        <p class="text-muted-foreground">
          {{ new Date(order.created_at).toLocaleDateString() }} at {{ new Date(order.created_at).toLocaleTimeString() }}
        </p>
      </div>
      <Badge :variant="getStatusVariant(order.status)" class="text-sm px-4 py-2">
        {{ formatStatus(order.status) }}
      </Badge>
    </div>

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
                  <p class="font-bold">${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}</p>
                  <p class="text-sm text-muted-foreground">${item.price_at_purchase} each</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="status">Order Status</Label>
              <select
                id="status"
                v-model="updateStatus"
                class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div class="space-y-2">
              <Label for="note">Note (optional)</Label>
              <textarea
                id="note"
                v-model="updateNote"
                placeholder="Add a note about this status update"
                class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <Button @click="handleUpdateStatus" :disabled="isUpdating">
              {{ isUpdating ? 'Updating...' : 'Update Status' }}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="(history, index) in order.status_history || []"
                :key="history.id"
                class="flex gap-4"
              >
                <div class="flex flex-col items-center">
                  <div
                    class="w-4 h-4 rounded-full"
                    :class="index === 0 ? 'bg-primary' : 'bg-muted'"
                  />
                  <div
                    v-if="index < (order.status_history?.length || 0) - 1"
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
              <span>${order.total_amount}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Shipping</span>
              <span>Free</span>
            </div>
            <Separator />
            <div class="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span class="text-primary">${order.total_amount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div>
                <p class="text-sm text-muted-foreground">User ID</p>
                <p class="font-medium">{{ order.user_id }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Payment Reference</p>
                <p class="font-medium">{{ order.payment_reference || 'N/A' }}</p>
              </div>
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/composables/useApi'
import { toast } from 'vue-sonner'
import type { Order } from '@bookstore/types'

const router = useRouter()
const route = useRoute()

const order = ref<Order | null>(null)
const isLoading = ref(true)
const isUpdating = ref(false)
const updateStatus = ref('')
const updateNote = ref('')

const fetchOrder = async () => {
  isLoading.value = true
  try {
    order.value = await api.getAdminOrder(Number(route.params.id))
    if (order.value) {
      updateStatus.value = order.value.status
    }
  } catch (error) {
    console.error('Failed to fetch order:', error)
    toast.error('Failed to load order')
  } finally {
    isLoading.value = false
  }
}

const handleUpdateStatus = async () => {
  if (!order.value) return

  isUpdating.value = true
  try {
    await api.updateOrderStatus(
      order.value.id,
      updateStatus.value,
      updateNote.value || undefined,
    )
    toast.success('Order status updated')
    await fetchOrder()
  } catch (error) {
    toast.error('Failed to update order status')
  } finally {
    isUpdating.value = false
  }
}

const getStatusVariant = (status: string) => {
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
    shipped: 'Shipped',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return formatted[status] || status
}

onMounted(() => {
  fetchOrder()
})
</script>
