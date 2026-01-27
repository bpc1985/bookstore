<template>
  <div class="flex min-h-screen">
    <aside class="w-64 border-r bg-muted/30 hidden lg:block">
      <div class="p-6">
        <RouterLink to="/admin" class="flex items-center gap-2">
          <div class="p-1.5 bg-primary rounded-lg">
            <BookOpen class="h-5 w-5 text-primary-foreground" />
          </div>
          <span class="font-bold text-xl">Admin</span>
        </RouterLink>
      </div>
      <nav class="px-4 space-y-1">
        <RouterLink
          to="/admin"
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          active-class="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <LayoutDashboard class="h-5 w-5" />
          Dashboard
        </RouterLink>
        <RouterLink
          to="/admin/books"
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          active-class="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Book class="h-5 w-5" />
          Books
        </RouterLink>
        <RouterLink
          to="/admin/orders"
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          active-class="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <ShoppingCart class="h-5 w-5" />
          Orders
        </RouterLink>
      </nav>
    </aside>

    <div class="flex-1">
      <header class="border-b bg-background">
        <div class="flex h-16 items-center justify-between px-6">
          <div class="flex items-center gap-4">
            <h1 class="text-lg font-semibold">{{ pageTitle }}</h1>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">{{ authStore.user?.full_name }}</span>
            <Button variant="ghost" size="icon" @click="router.push('/')">
              <LogOut class="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main class="p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  BookOpen,
  LayoutDashboard,
  Book,
  ShoppingCart,
  LogOut,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    'admin-dashboard': 'Dashboard',
    'admin-books': 'Books',
    'admin-book-new': 'New Book',
    'admin-book-edit': 'Edit Book',
    'admin-orders': 'Orders',
    'admin-order-detail': 'Order Details',
  }
  return titles[route.name as string] || 'Admin'
})
</script>
