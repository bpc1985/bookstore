<template>
  <div class="container flex items-center justify-center min-h-[80vh] py-8">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <div class="flex justify-center mb-4">
          <BookOpen class="h-12 w-12 text-primary" />
        </div>
        <CardTitle class="text-2xl">Create an account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="space-y-2">
            <Label for="fullName">Full Name</Label>
            <Input
              id="fullName"
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
              placeholder="•••••••••"
              required
              minlength="8"
            />
          </div>
          <div class="space-y-2">
            <Label for="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              placeholder="•••••••••"
              required
              minlength="8"
            />
          </div>
          <Button type="submit" class="w-full" :disabled="authStore.isLoading">
            {{ authStore.isLoading ? 'Creating account...' : 'Create account' }}
          </Button>
        </form>
        <div class="mt-6 text-center text-sm">
          <span class="text-muted-foreground">Already have an account? </span>
          <RouterLink to="/login" class="text-primary hover:underline">
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
import { BookOpen } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

const router = useRouter()
const authStore = useAuthStore()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    toast.error('Passwords do not match')
    return
  }

  if (password.value.length < 8) {
    toast.error('Password must be at least 8 characters')
    return
  }

  try {
    await authStore.register(email.value, password.value, fullName.value)
    toast.success('Account created successfully!')
    router.push('/')
  } catch (error) {
    toast.error((error as Error).message)
  }
}
</script>
