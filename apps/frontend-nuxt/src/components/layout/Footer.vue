<template>
  <footer class="border-t bg-muted/50">
    <div class="container py-8 md:py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="space-y-3">
          <div class="flex items-center space-x-2">
            <BookOpen class="h-6 w-6" />
            <span class="font-bold text-lg">Bookstore</span>
          </div>
          <p class="text-sm text-muted-foreground">
            Your favorite online bookstore with a wide selection of books.
          </p>
        </div>

        <div>
          <h3 class="font-semibold mb-3">Quick Links</h3>
          <ul class="space-y-2 text-sm">
            <li>
              <NuxtLink to="/" class="text-muted-foreground hover:text-foreground">
                Home
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/books" class="text-muted-foreground hover:text-foreground">
                Books
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/cart" class="text-muted-foreground hover:text-foreground">
                Cart
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold mb-3">Support</h3>
          <ul class="space-y-2 text-sm">
            <li>
              <a href="#" class="text-muted-foreground hover:text-foreground">
                FAQ
              </a>
            </li>
            <li>
              <a href="#" class="text-muted-foreground hover:text-foreground">
                Contact Us
              </a>
            </li>
            <li>
              <a href="#" class="text-muted-foreground hover:text-foreground">
                Shipping Info
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold mb-3">Legal</h3>
          <ul class="space-y-2 text-sm">
            <li>
              <a href="#" class="text-muted-foreground hover:text-foreground">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" class="text-muted-foreground hover:text-foreground">
                Terms of Service
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
        <p>&copy; 2025 Bookstore. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { BookOpen } from 'lucide-vue-next'
</script>
