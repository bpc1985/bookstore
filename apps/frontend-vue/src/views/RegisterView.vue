<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="text-2xl">Create an account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Full name</Label>
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
              placeholder="your.email@example.com"
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
            />
          </div>
          <Button type="submit" class="w-full" :disabled="authStore.isLoading">
            {{ authStore.isLoading ? 'Creating account...' : 'Create account' }}
          </Button>
        </form>
        <div class="mt-4 text-center text-sm">
          Already have an account?
          <RouterLink to="/login" class="text-primary hover:underline ml-1">
            Sign in
          </RouterLink>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

const router = useRouter()
const authStore = useAuthStore()

const fullName = ref('')
const email = ref('')
const password = ref('')

const handleRegister = async () => {
  try {
    await authStore.register(email.value, password.value, fullName.value)
    toast.success('Account created successfully!')
    router.push('/')
  } catch (error) {
    toast.error('Failed to create account')
  }
}
</script>
