<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold">{{ isEditing ? 'Edit Book' : 'Add New Book' }}</h2>
    </div>

    <form @submit.prevent="handleSubmit" class="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="title">Title</Label>
            <Input
              id="title"
              v-model="formData.title"
              placeholder="Enter book title"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="author">Author</Label>
            <Input
              id="author"
              v-model="formData.author"
              placeholder="Enter author name"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="isbn">ISBN</Label>
            <Input
              id="isbn"
              v-model="formData.isbn"
              placeholder="Enter ISBN"
              required
            />
          </div>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="price">Price ($)</Label>
              <Input
                id="price"
                v-model="formData.price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>
            <div class="space-y-2">
              <Label for="stock">Stock Quantity</Label>
              <Input
                id="stock"
                v-model="formData.stock_quantity"
                type="number"
                min="0"
                placeholder="0"
                required
              />
            </div>
          </div>
          <div class="space-y-2">
            <Label for="description">Description</Label>
            <textarea
              id="description"
              v-model="formData.description"
              placeholder="Enter book description"
              class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div class="space-y-2">
            <Label for="cover">Cover Image URL</Label>
            <Input
              id="cover"
              v-model="formData.cover_image"
              type="url"
              placeholder="https://example.com/cover.jpg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <Label>Categories</Label>
            <div class="grid md:grid-cols-2 gap-3">
              <label
                v-for="category in categories"
                :key="category.id"
                class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
              >
                <Checkbox
                  :id="`category-${category.id}`"
                  :checked="formData.category_ids?.includes(category.id)"
                  @update:checked="toggleCategory(category.id)"
                />
                <span>{{ category.name }}</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="flex gap-3">
        <Button type="button" variant="outline" @click="router.back()">
          Cancel
        </Button>
        <Button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Saving...' : (isEditing ? 'Update Book' : 'Create Book') }}
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/composables/useApi'
import { toast } from 'vue-sonner'
import type { Book, Category } from '@bookstore/types'

const router = useRouter()
const route = useRoute()

const isEditing = computed(() => !!route.params.id)
const bookId = computed(() => Number(route.params.id))

const categories = ref<Category[]>([])
const isLoading = ref(false)

const formData = reactive({
  title: '',
  author: '',
  isbn: '',
  price: '',
  stock_quantity: '0' as string,
  description: '',
  cover_image: '',
  category_ids: [] as number[],
})

const fetchCategories = async () => {
  try {
    categories.value = await api.getCategories()
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

const fetchBook = async () => {
  if (!isEditing.value) return

  try {
    const book: Book = await api.getBook(bookId.value)
    formData.title = book.title
    formData.author = book.author
    formData.isbn = book.isbn
    formData.price = book.price
    formData.stock_quantity = String(book.stock_quantity)
    formData.description = book.description || ''
    formData.cover_image = book.cover_image || ''
    formData.category_ids = book.categories.map((c) => c.id)
  } catch (error) {
    console.error('Failed to fetch book:', error)
    toast.error('Failed to load book')
  }
}

const toggleCategory = (categoryId: number) => {
  const index = formData.category_ids.indexOf(categoryId)
  if (index > -1) {
    formData.category_ids.splice(index, 1)
  } else {
    formData.category_ids.push(categoryId)
  }
}

const handleSubmit = async () => {
  isLoading.value = true
  try {
    const data = {
      title: formData.title,
      author: formData.author,
      isbn: formData.isbn,
      price: formData.price,
      stock_quantity: Number(formData.stock_quantity),
      description: formData.description,
      cover_image: formData.cover_image,
      category_ids: formData.category_ids,
    }

    if (isEditing.value) {
      await api.updateBook(bookId.value, data)
      toast.success('Book updated')
    } else {
      await api.createBook(data)
      toast.success('Book created')
    }
    router.push('/admin/books')
  } catch (error) {
    toast.error(isEditing.value ? 'Failed to update book' : 'Failed to create book')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchBook()])
})
</script>
