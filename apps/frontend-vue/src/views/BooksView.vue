<template>
  <div class="min-h-screen">
    <div class="container py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Browse Books</h1>
        <p class="text-muted-foreground">
          Find your next great read from our collection
        </p>
      </div>

      <div class="grid lg:grid-cols-4 gap-8">
        <div class="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent class="space-y-6">
              <div class="space-y-2">
                <Label>Search</Label>
                <Input
                  v-model="searchQuery"
                  placeholder="Search books..."
                  @input="handleSearch"
                />
              </div>

              <div class="space-y-2">
                <Label>Category</Label>
                <select
                  v-model="selectedCategory"
                  class="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  @change="handleFilter"
                >
                  <option value="">All Categories</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>

              <div class="space-y-2">
                <Label>Sort By</Label>
                <select
                  v-model="sortBy"
                  class="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  @change="handleFilter"
                >
                  <option value="created_at">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              <div class="flex items-center space-x-2">
                <Checkbox
                  id="in-stock"
                  v-model:checked="inStock"
                  @change="handleFilter"
                />
                <Label for="in-stock">In Stock Only</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div class="lg:col-span-3">
          <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <Card v-for="i in 6" :key="`skeleton-${i}`" class="overflow-hidden border-0">
              <CardContent class="p-0">
                <div class="aspect-[2/3] w-full animate-pulse rounded-t-xl bg-muted" />
                <div class="p-4 space-y-2">
                  <div class="h-5 w-3/4 animate-pulse rounded bg-muted" />
                  <div class="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  <div class="h-6 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div v-else-if="books.length === 0" class="text-center py-12">
            <p class="text-muted-foreground">No books found</p>
          </div>

          <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <RouterLink
              v-for="(book, index) in books"
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
          </div>

          <div v-if="pagination.pages > 1" class="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              :disabled="pagination.page === 1"
              @click="goToPage(pagination.page - 1)"
            >
              Previous
            </Button>
            <Button
              v-for="page in pagination.pages"
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Star } from 'lucide-vue-next'
import { api } from '@/composables/useApi'
import type { BookListItem, Category, PaginatedResponse } from '@bookstore/types'

const route = useRoute()
const router = useRouter()

const BOOK_COVERS = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop',
]

const books = ref<BookListItem[]>([])
const categories = ref<Category[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('')
const sortBy = ref('created_at')
const inStock = ref(false)
const pagination = ref({
  page: 1,
  size: 12,
  pages: 1,
  total: 0,
})

const fetchBooks = async () => {
  isLoading.value = true
  try {
    const params: any = {
      page: pagination.value.page,
      size: pagination.value.size,
    }

    if (searchQuery.value) params.search = searchQuery.value
    if (selectedCategory.value) params.category_id = Number(selectedCategory.value)
    if (inStock.value) params.in_stock = true

    const sortMap: Record<string, { sort_by: string, sort_order: string }> = {
      created_at: { sort_by: 'created_at', sort_order: 'desc' },
      price_asc: { sort_by: 'price', sort_order: 'asc' },
      price_desc: { sort_by: 'price', sort_order: 'desc' },
      rating: { sort_by: 'rating', sort_order: 'desc' },
    }

    const sort = sortMap[sortBy.value]
    if (sort) {
      params.sort_by = sort.sort_by
      params.sort_order = sort.sort_order
    }

    const response: PaginatedResponse<BookListItem> = await api.getBooks(params)
    books.value = response.items
    pagination.value = {
      page: response.page,
      size: response.size,
      pages: response.pages,
      total: response.total,
    }
  } catch (error) {
    console.error('Failed to fetch books:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchCategories = async () => {
  try {
    categories.value = await api.getCategories()
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

const handleSearch = debounce(() => {
  pagination.value.page = 1
  fetchBooks()
}, 500)

const handleFilter = () => {
  pagination.value.page = 1
  fetchBooks()
}

const goToPage = (page: number) => {
  pagination.value.page = page
  fetchBooks()
}

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchBooks()])

  if (route.query.search) searchQuery.value = route.query.search as string
  if (route.query.category_id) selectedCategory.value = route.query.category_id as string
  if (route.query.sort_by) {
    const sortMap: Record<string, string> = {
      created_at: 'created_at',
      price: sortBy.value.includes('asc') ? 'price_asc' : 'price_desc',
      rating: 'rating',
    }
    sortBy.value = sortMap[route.query.sort_by as string] || 'created_at'
  }
})

function debounce(func: Function, wait: number) {
  let timeout: any
  return (...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
</script>
