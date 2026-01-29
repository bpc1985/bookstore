<template>
  <div class="container py-8">
    <h1 class="text-3xl font-bold mb-8">My Orders</h1>

    <div v-if="loading" class="text-center py-12">
      <p>Loading orders...</p>
    </div>

    <div v-else-if="orders.length === 0" class="text-center py-12">
      <p class="text-muted-foreground mb-4">You haven't placed any orders yet</p>
      <Button @click="navigateTo('/books')">
        Start Shopping
      </Button>
    </div>

    <div v-else class="space-y-4">
      <Card v-for="order in orders" :key="order.id">
        <CardHeader>
          <div class="flex justify-between items-start">
            <div>
              <CardTitle>Order #{{ order.id }}</CardTitle>
              <CardDescription>
                {{ new Date(order.created_at).toLocaleDateString() }}
              </CardDescription>
            </div>
            <Badge :variant="getStatusVariant(order.status)">
              {{ order.status }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <p class="text-sm"><span class="text-muted-foreground">Items:</span> {{ order.total_items }}</p>
            <p class="text-sm"><span class="text-muted-foreground">Total:</span> ${{ Number(order.total_amount).toFixed(2) }}</p>
            <p class="text-sm"><span class="text-muted-foreground">Shipping:</span> {{ order.shipping_address }}</p>
          </div>
          <Button variant="outline" size="sm" class="mt-4" @click="viewOrder(order.id)">
            View Details
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OrderListItem, PaginatedResponse } from '@bookstore/types'

const { api } = useApi()
const toast = useToast()

const loading = ref(true)
const orders = ref<OrderListItem[]>([])

const fetchOrders = async () => {
  loading.value = true
  try {
    const response: PaginatedResponse<OrderListItem> = await api.getOrders({
      page: 1,
      size: 20,
    })
    orders.value = response.items
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    toast.error('Failed to load orders')
  } finally {
    loading.value = false
  }
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending':
      return 'default'
    case 'processing':
      return 'secondary'
    case 'shipped':
      return 'default'
    case 'delivered':
      return 'default'
    case 'cancelled':
      return 'destructive'
    default:
      return 'default'
  }
}

const viewOrder = (orderId: number) => {
  navigateTo(`/orders/${orderId}`)
}

onMounted(() => {
  fetchOrders()
})
</script>
