<template>
  <div class="container py-12">
    <div class="max-w-md mx-auto">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold mb-2">Create Account</h1>
        <p class="text-muted-foreground">Join us today</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div class="space-y-2">
          <Label for="name">Full Name</Label>
          <Input
            id="name"
            v-model="fullName"
            type="text"
            placeholder="John Doe"
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input
            id="email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="password">Password</Label>
          <Input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            minlength="6"
          />
        </div>

        <Button type="submit" class="w-full" :disabled="loading">
          <span v-if="loading">Creating account...</span>
          <span v-else>Sign up</span>
        </Button>
      </form>

      <div class="mt-6 text-center text-sm">
        <span class="text-muted-foreground">Already have an account? </span>
        <NuxtLink to="/login" class="text-primary hover:underline">
          Sign in
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const toast = useToast()

const fullName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)

const handleRegister = async () => {
  loading.value = true
  try {
    await authStore.register(email.value, password.value, fullName.value)
    toast.success('Account created successfully! Please login.')
    navigateTo('/login')
  } catch (error: any) {
    toast.error(error.message || 'Failed to create account')
  } finally {
    loading.value = false
  }
}
</script>
