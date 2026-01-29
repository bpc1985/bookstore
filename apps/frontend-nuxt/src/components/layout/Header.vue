<template>
  <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container flex h-16 items-center justify-between">
      <div class="flex items-center gap-8">
        <NuxtLink to="/" class="flex items-center space-x-2">
          <BookOpen class="h-6 w-6" />
          <span class="font-bold text-xl">Bookstore</span>
        </NuxtLink>
        <nav class="hidden md:flex items-center gap-6">
          <NuxtLink
            to="/books"
            class="text-sm font-medium transition-colors hover:text-primary"
          >
            Books
          </NuxtLink>
          <ClientOnly>
            <NuxtLink
              v-if="authStore.isAuthenticated"
              to="/orders"
              class="text-sm font-medium transition-colors hover:text-primary"
            >
              Orders
            </NuxtLink>
          </ClientOnly>
          <ClientOnly>
            <NuxtLink
              v-if="authStore.isAuthenticated"
              to="/profile"
              class="text-sm font-medium transition-colors hover:text-primary"
            >
              Profile
            </NuxtLink>
          </ClientOnly>
          <ClientOnly>
            <NuxtLink
              v-if="authStore.isAdmin"
              to="/admin"
              class="text-sm font-medium transition-colors hover:text-primary"
            >
              Admin
            </NuxtLink>
          </ClientOnly>
        </nav>
      </div>

      <div class="flex items-center gap-4">
        <ClientOnly>
          <NuxtLink v-if="authStore.isAuthenticated" to="/cart" class="relative">
            <ShoppingCart class="h-5 w-5" />
            <Badge
              v-if="cartStore.itemCount > 0"
              class="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {{ cartStore.itemCount }}
            </Badge>
          </NuxtLink>
        </ClientOnly>

        <ClientOnly>
          <DropdownMenu v-if="authStore.isAuthenticated">
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" class="relative h-9 w-9 rounded-full">
                <Avatar class="h-9 w-9">
                  <AvatarFallback>{{ authStore.user?.full_name?.[0] || 'U' }}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <DropdownMenuLabel class="font-normal">
                <div class="flex flex-col space-y-1">
                  <p class="text-sm font-medium leading-none">{{ authStore.user?.full_name }}</p>
                  <p class="text-xs leading-none text-muted-foreground">
                    {{ authStore.user?.email }}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="navigateTo('/profile')">
                <User class="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem @click="navigateTo('/orders')">
                <Package class="mr-2 h-4 w-4" />
                Orders
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="handleLogout">
                <LogOut class="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div v-else class="flex items-center gap-2">
            <Button variant="ghost" size="sm" @click="navigateTo('/login')">
              Login
            </Button>
            <Button size="sm" @click="navigateTo('/register')">
              Sign up
            </Button>
          </div>
          <template #fallback>
            <div class="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled>
                Login
              </Button>
              <Button size="sm" disabled>
                Sign up
              </Button>
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { BookOpen, ShoppingCart, User, Package, LogOut } from 'lucide-vue-next'

const authStore = useAuthStore()
const cartStore = useCartStore()
const toast = useToast()

const handleLogout = async () => {
  try {
    await authStore.logout()
    toast.success('Logged out successfully')
    navigateTo('/')
  } catch (error: any) {
    toast.error(error.message || 'Failed to logout')
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    cartStore.fetchCart()
  }
})
</script>
