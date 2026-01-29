<template>
  <div>
    <NuxtLayout name="default">
      <NuxtPage />
    </NuxtLayout>
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import { Toaster } from 'vue-sonner'
</script>
