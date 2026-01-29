<template>
  <div class="container py-12">
    <div class="max-w-md mx-auto">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold mb-2">Welcome Back</h1>
        <p class="text-muted-foreground">Sign in to your account</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleLogin">
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
          />
        </div>

        <Button type="submit" class="w-full" :disabled="loading">
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign in</span>
        </Button>
      </form>

      <div class="mt-6 text-center text-sm">
        <span class="text-muted-foreground">Don't have an account? </span>
        <NuxtLink to="/register" class="text-primary hover:underline">
          Sign up
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
const toast = useToast();

const email = ref("");
const password = ref("");
const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    toast.success("Successfully logged in!");
    navigateTo("/");
  } catch (error: any) {
    toast.error(error.message || "Failed to login");
  } finally {
    loading.value = false;
  }
};
</script>
