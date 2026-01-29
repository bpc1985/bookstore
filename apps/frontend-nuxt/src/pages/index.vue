<template>
  <div class="min-h-screen">
    <section class="py-12">
      <div class="container">
        <h1 class="text-4xl font-bold mb-4">Welcome to Bookstore</h1>
        <p class="text-xl text-muted-foreground mb-8">
          Discover your next favorite book
        </p>
        <NuxtLink
          to="/books"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8"
        >
          Browse Books
        </NuxtLink>
      </div>
    </section>

    <section class="py-12 bg-muted/50">
      <div class="container">
        <h2 class="text-3xl font-bold mb-6">Featured Books</h2>
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div v-for="i in 8" :key="i" class="space-y-2">
            <div class="h-64 bg-muted rounded-lg animate-pulse" />
            <div class="h-4 bg-muted rounded animate-pulse" />
            <div class="h-4 bg-muted rounded w-2/3 animate-pulse" />
          </div>
        </div>
        <div v-else-if="books.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <BookCard v-for="book in books" :key="book.id" :book="book" />
        </div>
        <div v-else class="text-center py-12">
          <p class="text-muted-foreground">No books available</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { BookListItem } from '@bookstore/types'

const config = useRuntimeConfig()
const loading = ref(true)
const books = ref<BookListItem[]>([])

onMounted(async () => {
  try {
    const response = await fetch(`${config.public.apiUrl}/books?page=1&size=8`)
    const data = await response.json()
    books.value = data.items || []
  } catch (error) {
    console.error('Failed to load featured books:', error)
  } finally {
    loading.value = false
  }
})
</script>
