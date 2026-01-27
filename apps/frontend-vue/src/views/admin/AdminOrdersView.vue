<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold">Orders</h2>
    </div>

    <div v-if="isLoading" class="space-y-4">
      <Card v-for="i in 5" :key="`skeleton-${i}`">
        <CardContent class="p-4">
          <div class="space-y-2">
            <div class="h-5 w-32 animate-pulse rounded bg-muted" />
            <div class="h-4 w-48 animate-pulse rounded bg-muted" />
            <div class="h-6 w-20 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    </div>

    <Card v-else-if="orders.length === 0">
      <CardContent class="py-12 text-center">
        <ShoppingCart class="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <p class="text-muted-foreground">No orders found</p>
      </CardContent>
    </Card>

    <div v-else class="space-y-4">
      <Card
        v-for="order in orders"
        :key="order.id"
        class="hover:shadow-md transition-shadow cursor-pointer"
        @click="router.push(`/admin/orders/${order.id}`)"
      >
        <CardContent class="p-4">
          <div class="flex justify-between items-center">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <p class="font-semibold">Order #{{ order.id }}</p>
                <Badge :variant="getStatusVariant(order.status)">
                  {{ formatStatus(order.status) }}
                </Badge>
              </div>
              <p class="text-sm text-muted-foreground">
                {{ new Date(order.created_at).toLocaleDateString() }} · {{ order.item_count }} items
              </p>
            </div>
            <div class="text-right">
              <p class="font-bold text-lg">${order.total_amount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-if="pagination.pages > 1" class="mt-6 flex justify-center gap-2">
      <Button
        variant="outline"
        :disabled="pagination.page === 1"
        @click="goToPage(pagination.page - 1)"
      >
        Previous
      </Button>
      <Button
        v-for="page in Math.min(pagination.pages, 5)"
        :key="page"
        :variant="pagination.page === page ? 'default' : 'outline'"
        @click="goToPage(page)"
      >
        {{ page }}
      </Button>
      <Button
        variant="outline"
        :disabled="pagination.page === pagination.pages"
        @click="goToPage(pagination.page + 1)"
      >
        Next
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ShoppingCart } from 'lucide-vue-next'
import { api } from '@/composables/useApi'
import type { OrderListItem, PaginatedResponse } from '@bookstore/types'

const router = useRouter()

const orders = ref<OrderListItem[]>([])
const isLoading = ref(true)
const pagination = ref({
  page: 1,
  size: 20,
  pages: 1,
  total: 0,
})

const fetchOrders = async () => {
  isLoading.value = true
  try {
    const response: PaginatedResponse<OrderListItem> = await api.getAdminOrders({
      page: pagination.value.page,
      size: pagination.value.size,
    })
    orders.value = response.items
    pagination.value = {
      page: response.page,
      size: response.size,
      pages: response.pages,
      total: response.total,
    }
  } catch (error) {
    console.error('Failed to fetch orders:', error)
  } finally {
    isLoading.value = false
  }
}

const goToPage = (page: number) => {
  pagination.value.page = page
  fetchOrders()
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
  fetchOrders()
})
</script>
