<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4">
    <div class="w-full max-w-lg text-center">
      <div class="mb-6 flex justify-center">
        <div class="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Check class="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <h1 class="text-3xl font-bold mb-2">Order Confirmed!</h1>
      <p class="text-muted-foreground mb-8">
        Thank you for your purchase. Your order #{{ orderId }} has been received.
      </p>

      <Card class="mb-8">
        <CardContent class="p-6">
          <div class="space-y-4 text-left">
            <div>
              <p class="text-sm text-muted-foreground">Order Number</p>
              <p class="font-semibold">#{{ orderId }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Confirmation Email</p>
              <p class="font-semibold">Sent to {{ authStore.user?.email }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="space-y-3">
        <RouterLink to="/orders" class="block">
          <Button class="w-full" size="lg">
            View Order Details
          </Button>
        </RouterLink>
        <RouterLink to="/books" class="block">
          <Button variant="outline" class="w-full" size="lg">
            Continue Shopping
          </Button>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const orderId = computed(() => route.params.id as string)
</script>
