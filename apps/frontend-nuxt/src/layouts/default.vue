<template>
  <div class="min-h-screen bg-background">
    <Header />
    <main class="container">
      <slot />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()

onMounted(() => {
  // Hydrate auth state from localStorage on client
  authStore.hydrateFromStorage()

  if (authStore.accessToken && !authStore.user) {
    authStore.fetchUser().catch(() => {
      authStore.clearAuth()
    })
  }
})
</script>