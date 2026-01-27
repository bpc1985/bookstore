<template>
  <div>
    <div class="mb-8">
      <h2 class="text-2xl font-bold mb-2">Dashboard Overview</h2>
      <p class="text-muted-foreground">Welcome back, {{ authStore.user?.full_name }}</p>
    </div>

    <div v-if="isLoading" class="grid md:grid-cols-3 gap-6">
      <Card v-for="i in 6" :key="`skeleton-${i}`">
        <CardContent class="p-6">
          <div class="h-20 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    </div>

    <div v-else class="space-y-8">
      <div class="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-bold text-primary">${analytics.total_revenue}</div>
            <p class="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-bold">{{ analytics.total_orders }}</div>
            <p class="text-xs text-muted-foreground mt-1">{{ analytics.pending_orders }} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-sm font-medium text-muted-foreground">Total Books</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-bold">{{ analytics.total_books }}</div>
            <p class="text-xs text-muted-foreground mt-1">In catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-bold">{{ analytics.total_users }}</div>
            <p class="text-xs text-muted-foreground mt-1">Registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-sm font-medium text-muted-foreground">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-bold">{{ analytics.total_reviews }}</div>
            <p class="text-xs text-muted-foreground mt-1">Across all books</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-3xl font-bold text-amber-600 dark:text-amber-400">{{ analytics.pending_orders }}</div>
            <p class="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid md:grid-cols-2 gap-4">
            <RouterLink to="/admin/books/new">
              <Button class="w-full" variant="outline">
                <Plus class="mr-2 h-4 w-4" />
                Add New Book
              </Button>
            </RouterLink>
            <RouterLink to="/admin/orders">
              <Button class="w-full" variant="outline">
                <ShoppingCart class="mr-2 h-4 w-4" />
                View Orders
              </Button>
            </RouterLink>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, ShoppingCart } from 'lucide-vue-next'
import { api } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import type { Analytics } from '@bookstore/types'

const authStore = useAuthStore()

const analytics = ref<Analytics>({
  total_orders: 0,
  total_revenue: '0.00',
  pending_orders: 0,
  total_books: 0,
  total_users: 0,
  total_reviews: 0,
})
const isLoading = ref(true)

const fetchAnalytics = async () => {
  isLoading.value = true
  try {
    analytics.value = await api.getAnalytics()
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAnalytics()
})
</script>
