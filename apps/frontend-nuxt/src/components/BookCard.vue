<template>
  <Card class="h-full flex flex-col">
    <CardContent class="p-0">
      <div class="aspect-[2/3] bg-muted relative overflow-hidden">
        <img
          v-if="book.cover_image"
          :src="book.cover_image"
          :alt="book.title"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <BookOpen class="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
    </CardContent>
    <CardFooter class="flex flex-col items-start p-4 space-y-2 flex-1">
      <h3 class="font-semibold line-clamp-1">{{ book.title }}</h3>
      <p class="text-sm text-muted-foreground line-clamp-1">{{ book.author }}</p>
      <div class="flex items-center gap-1 mt-auto">
        <Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span class="text-sm font-medium">{{ book.average_rating?.toFixed(1) || 'N/A' }}</span>
        <span class="text-xs text-muted-foreground">({{ book.review_count || 0 }})</span>
      </div>
      <div class="flex items-center justify-between w-full">
        <span class="text-lg font-bold">${{ Number(book.price).toFixed(2) }}</span>
        <Button size="sm" @click="addToCart">
          Add to Cart
        </Button>
      </div>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { Star, BookOpen } from 'lucide-vue-next'
import type { BookListItem } from '@bookstore/types'

interface Props {
  book: BookListItem
}

const props = defineProps<Props>()

const cartStore = useCartStore()
const toast = useToast()

const addToCart = async () => {
  try {
    await cartStore.addItem(props.book.id)
    toast.success('Added to cart!')
  } catch (error: any) {
    toast.error(error.message || 'Failed to add to cart')
  }
}
</script>
