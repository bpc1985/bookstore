<template>
  <div class="min-h-screen">
    <div v-if="isLoading" class="container py-8">
      <div class="grid md:grid-cols-2 gap-8">
        <div class="aspect-[2/3] animate-pulse rounded-xl bg-muted" />
        <div class="space-y-4">
          <div class="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div class="h-6 w-1/2 animate-pulse rounded bg-muted" />
          <div class="h-24 w-full animate-pulse rounded bg-muted" />
          <div class="h-12 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>

    <div v-else-if="book" class="container py-8">
      <Button variant="ghost" @click="router.back()" class="mb-6">
        ← Back
      </Button>

      <div class="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div class="relative">
          <div class="sticky top-24">
            <div class="relative max-w-md mx-auto md:mx-0">
              <div class="absolute -inset-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-2xl" />
              <div class="relative aspect-[2/3] w-full">
                <img
                  :src="book.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=900&fit=crop'"
                  :alt="book.title"
                  class="w-full h-full object-cover rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <Badge v-for="category in book.categories" :key="category.id" variant="secondary">
                {{ category.name }}
              </Badge>
            </div>
            <h1 class="text-3xl md:text-4xl font-bold mb-2">{{ book.title }}</h1>
            <p class="text-xl text-muted-foreground">{{ book.author }}</p>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1">
              <Star class="h-5 w-5 fill-amber-500 text-amber-500" />
              <span class="font-semibold">{{ parseFloat(book.rating).toFixed(1) }}</span>
            </div>
            <span class="text-muted-foreground">({{ book.review_count }} reviews)</span>
          </div>

          <div v-if="book.description" class="prose max-w-none">
            <h3 class="font-semibold mb-2">About this book</h3>
            <p class="text-muted-foreground">{{ book.description }}</p>
          </div>

          <div class="text-4xl font-bold text-primary">
            ${{ book.price }}
          </div>

          <div class="space-y-4">
            <div v-if="book.stock_quantity > 0" class="flex items-center gap-2 text-green-600 dark:text-green-400">
              <div class="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
              <span class="font-medium">{{ book.stock_quantity }} in stock</span>
            </div>
            <div v-else class="flex items-center gap-2 text-red-600 dark:text-red-400">
              <div class="h-2 w-2 rounded-full bg-red-600 dark:bg-red-400" />
              <span class="font-medium">Out of stock</span>
            </div>

            <div class="flex gap-3">
              <Button
                size="lg"
                class="flex-1"
                :disabled="book.stock_quantity === 0 || cartStore.isLoading"
                @click="handleAddToCart"
              >
                <ShoppingCart class="mr-2 h-5 w-5" />
                {{ book.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart' }}
              </Button>
            </div>
          </div>

          <div class="border-t pt-6">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-muted-foreground">ISBN</p>
                <p class="font-medium">{{ book.isbn }}</p>
              </div>
              <div>
                <p class="text-muted-foreground">Published</p>
                <p class="font-medium">{{ new Date(book.created_at).toLocaleDateString() }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Star, ShoppingCart } from 'lucide-vue-next'
import { api } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { toast } from 'vue-sonner'
import type { Book } from '@bookstore/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

const book = ref<Book | null>(null)
const isLoading = ref(true)

const fetchBook = async () => {
  isLoading.value = true
  try {
    book.value = await api.getBook(Number(route.params.id))
  } catch (error) {
    console.error('Failed to fetch book:', error)
    toast.error('Failed to load book')
  } finally {
    isLoading.value = false
  }
}

const handleAddToCart = async () => {
  if (!authStore.user) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }

  try {
    await cartStore.addItem(Number(route.params.id))
    toast.success('Added to cart')
  } catch (error) {
    toast.error('Failed to add to cart')
  }
}

onMounted(() => {
  fetchBook()
})
</script>
