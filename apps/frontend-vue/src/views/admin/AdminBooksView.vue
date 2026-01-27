<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold">Books</h2>
      <RouterLink to="/admin/books/new">
        <Button>
          <Plus class="mr-2 h-4 w-4" />
          Add Book
        </Button>
      </RouterLink>
    </div>

    <div v-if="isLoading" class="space-y-4">
      <Card v-for="i in 5" :key="`skeleton-${i}`">
        <CardContent class="p-4">
          <div class="flex gap-4">
            <div class="w-16 h-20 animate-pulse rounded bg-muted" />
            <div class="flex-1 space-y-2">
              <div class="h-5 w-3/4 animate-pulse rounded bg-muted" />
              <div class="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card v-else-if="books.length === 0">
      <CardContent class="py-12 text-center">
        <Book class="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <p class="text-muted-foreground">No books found</p>
      </CardContent>
    </Card>

    <div v-else class="space-y-4">
      <Card v-for="book in books" :key="book.id">
        <CardContent class="p-4">
          <div class="flex gap-4">
            <img
              :src="book.cover_image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&h=150&fit=crop'"
              :alt="book.title"
              class="w-16 h-20 object-cover rounded"
            />
            <div class="flex-1">
              <h3 class="font-semibold mb-1">{{ book.title }}</h3>
              <p class="text-sm text-muted-foreground mb-2">{{ book.author }}</p>
              <div class="flex items-center gap-4 text-sm">
                <span class="font-semibold">${book.price}</span>
                <span class="text-muted-foreground">Stock: {{ book.stock_quantity }}</span>
                <Badge :variant="book.stock_quantity > 0 ? 'default' : 'secondary'">
                  {{ book.stock_quantity > 0 ? 'In Stock' : 'Out of Stock' }}
                </Badge>
              </div>
            </div>
            <div class="flex gap-2">
              <Button variant="outline" size="icon" @click="router.push(`/admin/books/${book.id}`)">
                <Pencil class="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" class="text-destructive hover:text-destructive" @click="handleDelete(book.id)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Book, Pencil, Trash2 } from 'lucide-vue-next'
import { api } from '@/composables/useApi'
import { toast } from 'vue-sonner'
import type { BookListItem } from '@bookstore/types'

const router = useRouter()

const books = ref<BookListItem[]>([])
const isLoading = ref(true)

const fetchBooks = async () => {
  isLoading.value = true
  try {
    const response = await api.getBooks({ size: 100 })
    books.value = response.items
  } catch (error) {
    console.error('Failed to fetch books:', error)
  } finally {
    isLoading.value = false
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('Are you sure you want to delete this book?')) return

  try {
    await api.deleteBook(id)
    toast.success('Book deleted')
    await fetchBooks()
  } catch (error) {
    toast.error('Failed to delete book')
  }
}

onMounted(() => {
  fetchBooks()
})
</script>
