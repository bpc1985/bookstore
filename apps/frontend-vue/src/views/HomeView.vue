<template>
  <div class="min-h-screen">
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/30 to-secondary/50" />
      <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-[0.03]" />
      <div class="container relative py-20 md:py-32">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="secondary" class="mb-4 px-4 py-1.5 text-sm font-medium">
              <Sparkles class="h-3.5 w-3.5 mr-1.5" />
              Over 10,000+ books available
            </Badge>
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Discover Your Next
              <span class="text-primary block">Favorite Book</span>
            </h1>
            <p class="text-lg text-muted-foreground mb-8 max-w-lg">
              Explore our curated collection of bestsellers, classics, and
              hidden gems. Find your perfect read and embark on your next
              literary adventure.
            </p>
            <div class="flex flex-wrap gap-4">
              <RouterLink to="/books">
                <Button size="lg" class="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  Browse Collection
                  <ArrowRight class="ml-2 h-5 w-5" />
                </Button>
              </RouterLink>
              <RouterLink v-if="!authStore.user" to="/register">
                <Button size="lg" variant="outline" class="bg-white/50 backdrop-blur-sm">
                  Join Free
                </Button>
              </RouterLink>
            </div>
          </div>
          <div class="hidden lg:flex justify-center">
            <div class="relative">
              <div class="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
              <div class="relative grid grid-cols-2 gap-4">
                <div class="space-y-4">
                  <img
                    src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop"
                    alt="Book cover"
                    class="rounded-2xl shadow-2xl object-cover w-full h-auto"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop"
                    alt="Book cover"
                    class="rounded-2xl shadow-2xl object-cover w-full h-auto ml-8"
                  />
                </div>
                <div class="space-y-4 pt-8">
                  <img
                    src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop"
                    alt="Book cover"
                    class="rounded-2xl shadow-2xl object-cover w-full h-auto"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=400&fit=crop"
                    alt="Book cover"
                    class="rounded-2xl shadow-2xl object-cover w-full h-auto ml-4"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-12 border-y bg-card/50">
      <div class="container">
        <div class="grid md:grid-cols-3 gap-8">
          <div class="flex items-center gap-4 group">
            <div class="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/15 transition-colors">
              <Truck class="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 class="font-semibold">Free Shipping</h3>
              <p class="text-sm text-muted-foreground">
                On orders over $50
              </p>
            </div>
          </div>
          <div class="flex items-center gap-4 group">
            <div class="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/15 transition-colors">
              <ShoppingCart class="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 class="font-semibold">Easy Returns</h3>
              <p class="text-sm text-muted-foreground">
                30-day return policy
              </p>
            </div>
          </div>
          <div class="flex items-center gap-4 group">
            <div class="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/15 transition-colors">
              <Star class="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 class="font-semibold">Curated Selection</h3>
              <p class="text-sm text-muted-foreground">
                Hand-picked quality books
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20">
      <div class="container">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h2 class="text-3xl font-bold mb-2">Browse by Category</h2>
            <p class="text-muted-foreground">
              Find books in your favorite genres
            </p>
          </div>
          <RouterLink to="/books">
            <Button variant="ghost" class="hidden sm:flex">
              View All Categories
              <ArrowRight class="ml-2 h-4 w-4" />
            </Button>
          </RouterLink>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <RouterLink
            v-for="category in categories"
            :key="category.id"
            :to="`/books?category_id=${category.id}`"
          >
            <Card class="group hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
              <CardContent class="p-6 text-center">
                <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <component :is="getCategoryIcon(category.name)" class="h-7 w-7 text-primary" />
                </div>
                <p class="font-medium group-hover:text-primary transition-colors">
                  {{ category.name }}
                </p>
              </CardContent>
            </Card>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div class="container">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h2 class="text-3xl font-bold mb-2">Featured Books</h2>
            <p class="text-muted-foreground">
              Our top-rated selections for you
            </p>
          </div>
          <RouterLink to="/books">
            <Button variant="ghost" class="hidden sm:flex">
              View All Books
              <ArrowRight class="ml-2 h-4 w-4" />
            </Button>
          </RouterLink>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <RouterLink
            v-for="(book, index) in (isLoading ? [] : featuredBooks)"
            :key="book.id"
            :to="`/books/${book.id}`"
          >
            <Card class="group h-full overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-card/80 backdrop-blur-sm">
              <CardContent class="p-0">
                <div class="aspect-[2/3] relative overflow-hidden">
                  <img
                    :src="book.cover_image || BOOK_COVERS[index % BOOK_COVERS.length]"
                    :alt="book.title"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div class="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button size="sm" class="w-full bg-white/90 text-foreground hover:bg-white">
                      View Details
                    </Button>
                  </div>
                </div>
                <div class="p-4">
                  <h3 class="font-semibold line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                    {{ book.title }}
                  </h3>
                  <p class="text-sm text-muted-foreground mb-3">{{ book.author }}</p>
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-lg text-primary">
                      ${{ book.price }}
                    </span>
                    <div class="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                      <Star class="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span class="text-sm font-medium text-amber-700 dark:text-amber-400">
                        {{ parseFloat(book.rating).toFixed(1) }}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </RouterLink>
          <Card v-for="i in (isLoading ? 8 : 0)" :key="`skeleton-${i}`" class="h-full overflow-hidden border-0">
            <CardContent class="p-0">
              <div class="aspect-[2/3] w-full animate-pulse rounded-xl bg-muted" />
              <div class="p-4 space-y-2">
                <div class="h-5 w-3/4 animate-pulse rounded bg-muted" />
                <div class="h-4 w-1/2 animate-pulse rounded bg-muted" />
                <div class="h-6 w-1/3 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div class="text-center mt-10 sm:hidden">
          <RouterLink to="/books">
            <Button variant="outline">
              View All Books
              <ArrowRight class="ml-2 h-4 w-4" />
            </Button>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="py-20">
      <div class="container">
        <Card class="relative overflow-hidden border-0 bg-gradient-to-br from-primary/90 to-primary">
          <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920')] bg-cover bg-center opacity-10" />
          <CardContent class="relative py-16 text-center">
            <h2 class="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
              Ready to Start Reading?
            </h2>
            <p class="text-primary-foreground/80 mb-8 max-w-md mx-auto">
              Create an account today and get access to exclusive deals,
              personalized recommendations, and more.
            </p>
            <div class="flex flex-wrap justify-center gap-4">
              <RouterLink to="/register">
                <Button size="lg" variant="secondary" class="shadow-lg">
                  Create Free Account
                </Button>
              </RouterLink>
              <RouterLink to="/books">
                <Button size="lg" variant="outline" class="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Browse Books
                </Button>
              </RouterLink>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  ArrowRight,
  BookOpen,
  ShoppingCart,
  Star,
  Truck,
  Sparkles,
  BookMarked,
  Library,
  Heart,
  Compass,
  GraduationCap,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import { api } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import type { BookListItem, Category } from '@bookstore/types'

const authStore = useAuthStore()

const CATEGORY_ICONS: Record<string, Component> = {
  Fiction: BookMarked,
  'Non-Fiction': Library,
  Romance: Heart,
  Adventure: Compass,
  Science: GraduationCap,
  default: BookOpen,
}

function getCategoryIcon(name: string): Component {
  return CATEGORY_ICONS[name] || CATEGORY_ICONS['default']
}

const BOOK_COVERS = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=600&fit=crop',
]

const featuredBooks = ref<BookListItem[]>([])
const categories = ref<Category[]>([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    const [booksRes, catsRes] = await Promise.all([
      api.getBooks({ size: 8, sort_by: 'rating', sort_order: 'desc' }),
      api.getCategories(),
    ])
    featuredBooks.value = booksRes.items
    categories.value = catsRes.slice(0, 6)
  } catch (error) {
    console.error('Failed to fetch data:', error)
  } finally {
    isLoading.value = false
  }
})
</script>
