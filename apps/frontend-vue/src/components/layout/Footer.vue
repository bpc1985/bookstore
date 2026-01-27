<template>
  <footer class="border-t bg-card">
    <div class="container py-12 md:py-16">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
        <div class="col-span-2 md:col-span-1">
          <RouterLink to="/" class="flex items-center gap-2.5 mb-4">
            <div class="p-1.5 bg-primary rounded-lg">
              <BookOpen class="h-5 w-5 text-primary-foreground" />
            </div>
            <span class="font-bold text-xl">BookStore</span>
          </RouterLink>
          <p class="text-sm text-muted-foreground mb-6 leading-relaxed">
            Your one-stop destination for all your reading needs. Discover, explore, and enjoy books from around the world.
          </p>
          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="flex items-center gap-2">
              <Mail class="h-4 w-4" />
              <span>support@bookstore.com</span>
            </div>
            <div class="flex items-center gap-2">
              <Phone class="h-4 w-4" />
              <span>1-800-BOOKS</span>
            </div>
          </div>
        </div>

        <div>
          <h3 class="font-semibold mb-4">Shop</h3>
          <ul class="space-y-3 text-sm">
            <li>
              <RouterLink to="/books" class="text-muted-foreground hover:text-primary transition-colors">
                All Books
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/books?category_id=1" class="text-muted-foreground hover:text-primary transition-colors">
                Fiction
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/books?category_id=2" class="text-muted-foreground hover:text-primary transition-colors">
                Non-Fiction
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/books?sort_by=rating&sort_order=desc" class="text-muted-foreground hover:text-primary transition-colors">
                Best Sellers
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/books?sort_by=created_at&sort_order=desc" class="text-muted-foreground hover:text-primary transition-colors">
                New Arrivals
              </RouterLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold mb-4">Account</h3>
          <ul class="space-y-3 text-sm">
            <li>
              <RouterLink to="/login" class="text-muted-foreground hover:text-primary transition-colors">
                Login
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/register" class="text-muted-foreground hover:text-primary transition-colors">
                Register
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/cart" class="text-muted-foreground hover:text-primary transition-colors">
                Shopping Cart
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/orders" class="text-muted-foreground hover:text-primary transition-colors">
                Order History
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/profile" class="text-muted-foreground hover:text-primary transition-colors">
                My Profile
              </RouterLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold mb-4">Support</h3>
          <ul class="space-y-3 text-sm">
            <li>
              <a href="#" class="text-muted-foreground hover:text-primary transition-colors">
                Help Center
              </a>
            </li>
            <li>
              <a href="#" class="text-muted-foreground hover:text-primary transition-colors">
                Shipping Info
              </a>
            </li>
            <li>
              <a href="#" class="text-muted-foreground hover:text-primary transition-colors">
                Returns & Refunds
              </a>
            </li>
            <li>
              <a href="#" class="text-muted-foreground hover:text-primary transition-colors">
                FAQ
              </a>
            </li>
            <li>
              <a href="#" class="text-muted-foreground hover:text-primary transition-colors">
                Contact Us
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-12 pt-8 border-t">
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p class="text-sm text-muted-foreground">
            &copy; {{ new Date().getFullYear() }} BookStore. All rights reserved.
          </p>
          <div class="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" class="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" class="hover:text-primary transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { BookOpen, Mail, Phone } from 'lucide-vue-next'
</script>
