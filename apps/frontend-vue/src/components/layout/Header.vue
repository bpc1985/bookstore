<template>
  <header class="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
    <div class="container flex h-16 items-center justify-between">
      <div class="flex items-center gap-6">
        <Sheet>
          <SheetTrigger as-child class="md:hidden">
            <Button variant="ghost" size="icon" class="hover:bg-primary/10">
              <Menu class="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="w-72">
            <RouterLink to="/" class="flex items-center gap-2 mb-8">
              <div class="p-2 bg-primary rounded-lg">
                <BookOpen class="h-5 w-5 text-primary-foreground" />
              </div>
              <span class="font-bold text-xl">BookStore</span>
            </RouterLink>
            <nav class="flex flex-col gap-2">
              <RouterLink to="/" class="px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                Home
              </RouterLink>
              <RouterLink to="/books" class="px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                Browse Books
              </RouterLink>
              <RouterLink v-if="authStore.user" to="/orders" class="px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                My Orders
              </RouterLink>
              <RouterLink v-if="authStore.user?.role === 'admin'" to="/admin" class="px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                Admin Dashboard
              </RouterLink>
            </nav>
          </SheetContent>
        </Sheet>

        <RouterLink to="/" class="flex items-center gap-2.5 group">
          <div class="p-1.5 bg-primary rounded-lg group-hover:bg-primary/90 transition-colors">
            <BookOpen class="h-5 w-5 text-primary-foreground" />
          </div>
          <span class="font-bold text-xl hidden sm:inline">
            BookStore
          </span>
        </RouterLink>

        <nav class="hidden md:flex items-center gap-1">
          <RouterLink to="/books" class="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            Browse
          </RouterLink>
          <RouterLink v-if="authStore.user?.role === 'admin'" to="/admin" class="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            Admin
          </RouterLink>
        </nav>
      </div>

      <div class="flex items-center gap-2">
        <RouterLink to="/books" class="hidden md:flex">
          <Button variant="ghost" size="icon" class="hover:bg-primary/10">
            <Search class="h-5 w-5" />
          </Button>
        </RouterLink>

        <RouterLink v-if="authStore.user" to="/cart">
          <Button variant="ghost" size="icon" class="relative hover:bg-primary/10">
            <ShoppingCart class="h-5 w-5" />
            <Badge v-if="cartItemCount > 0" class="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary">
              {{ cartItemCount > 9 ? '9+' : cartItemCount }}
            </Badge>
          </Button>
        </RouterLink>

        <DropdownMenu v-if="authStore.user">
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="hover:bg-primary/10">
              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span class="text-sm font-semibold text-primary">
                  {{ authStore.user.full_name.charAt(0).toUpperCase() }}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <div class="px-3 py-2">
              <p class="font-medium">{{ authStore.user.full_name }}</p>
              <p class="text-sm text-muted-foreground">{{ authStore.user.email }}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem as-child>
              <RouterLink to="/orders" class="cursor-pointer">
                <Package class="mr-2 h-4 w-4" />
                My Orders
              </RouterLink>
            </DropdownMenuItem>
            <DropdownMenuItem as-child>
              <RouterLink to="/profile" class="cursor-pointer">
                <Settings class="mr-2 h-4 w-4" />
                Settings
              </RouterLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="handleLogout" class="cursor-pointer text-destructive focus:text-destructive">
              <LogOut class="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div v-else class="flex items-center gap-2">
          <RouterLink to="/login">
            <Button variant="ghost" size="sm" class="hidden sm:inline-flex">
              Log in
            </Button>
          </RouterLink>
          <RouterLink to="/register">
            <Button size="sm" class="shadow-sm">
              Sign up
            </Button>
          </RouterLink>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ShoppingCart,
  LogOut,
  Settings,
  Package,
  BookOpen,
  Menu,
  Search,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}

const cartItemCount = computed(() => cartStore.cart?.total_items || 0)
</script>
