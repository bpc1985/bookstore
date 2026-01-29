<template>
  <div class="container py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Books</h1>
      <p class="text-muted-foreground">Browse our collection of books</p>
    </div>

    <div class="flex flex-col md:flex-row gap-6">
      <aside class="w-full md:w-64 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div>
                <Label for="search">Search</Label>
                <Input
                  id="search"
                  v-model="search"
                  placeholder="Search books..."
                  @input="debouncedFetch"
                />
              </div>
              <div>
                <Label for="category">Category</Label>
                <ClientOnly>
                  <Select v-model="selectedCategory" @update:model-value="fetchBooks">
                    <SelectTrigger id="category">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      <SelectItem
                        v-for="category in categories"
                        :key="category.id"
                        :value="String(category.id)"
                      >
                        {{ category.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <template #fallback>
                    <div class="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                      <span class="text-muted-foreground">All categories</span>
                    </div>
                  </template>
                </ClientOnly>
              </div>
              <div>
                <Label for="price-range">Price Range</Label>
                <div class="flex gap-2">
                  <Input
                    id="min-price"
                    v-model="minPrice"
                    type="number"
                    placeholder="Min"
                    min="0"
                    step="0.01"
                    @input="debouncedFetch"
                  />
                  <Input
                    id="max-price"
                    v-model="maxPrice"
                    type="number"
                    placeholder="Max"
                    min="0"
                    step="0.01"
                    @input="debouncedFetch"
                  />
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <ClientOnly>
                  <Checkbox
                    id="in-stock"
                    v-model:checked="inStock"
                    @update:checked="fetchBooks"
                  />
                  <template #fallback>
                    <div class="h-4 w-4 rounded-sm border border-primary" />
                  </template>
                </ClientOnly>
                <Label for="in-stock">In Stock Only</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>

      <div class="flex-1">
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="i in 9" :key="i" class="space-y-2">
            <div class="h-64 bg-muted rounded-lg animate-pulse" />
            <div class="h-4 bg-muted rounded animate-pulse" />
            <div class="h-4 bg-muted rounded w-2/3 animate-pulse" />
          </div>
        </div>
        <div v-else-if="books.length > 0">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <BookCard v-for="book in books" :key="book.id" :book="book" />
          </div>
          <div v-if="pagination.total > pagination.size" class="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              :disabled="pagination.page === 1"
              @click="changePage(pagination.page - 1)"
            >
              Previous
            </Button>
            <span class="flex items-center px-4">
              Page {{ pagination.page }} of {{ Math.ceil(pagination.total / pagination.size) }}
            </span>
            <Button
              variant="outline"
              :disabled="pagination.page >= Math.ceil(pagination.total / pagination.size)"
              @click="changePage(pagination.page + 1)"
            >
              Next
            </Button>
          </div>
        </div>
        <div v-else class="text-center py-12">
          <p class="text-muted-foreground">No books found</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Category, BookListItem, PaginatedResponse } from '@bookstore/types'

const { api } = useApi()

const search = ref('')
const selectedCategory = ref<string>('all')
const minPrice = ref<number | null>(null)
const maxPrice = ref<number | null>(null)
const inStock = ref(false)

const books = ref<BookListItem[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)

const pagination = reactive({
  page: 1,
  size: 9,
  total: 0,
})

let debounceTimer: any = null

const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchBooks, 300)
}

const fetchBooks = async () => {
  loading.value = true
  try {
    const response: PaginatedResponse<BookListItem> = await api.getBooks({
      search: search.value || undefined,
      category_id: selectedCategory.value !== 'all' ? Number(selectedCategory.value) : undefined,
      min_price: minPrice.value || undefined,
      max_price: maxPrice.value || undefined,
      in_stock: inStock.value || undefined,
      page: pagination.page,
      size: pagination.size,
    })
    books.value = response.items
    pagination.total = response.total
  } catch (error) {
    console.error('Failed to fetch books:', error)
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    categories.value = await api.getCategories()
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

const changePage = (page: number) => {
  pagination.page = page
  fetchBooks()
}

onMounted(() => {
  fetchCategories()
  fetchBooks()
})
</script>
