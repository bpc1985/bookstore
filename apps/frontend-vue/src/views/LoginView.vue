<template>
  <div class="container flex items-center justify-center min-h-[80vh] py-8">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <div class="flex justify-center mb-4">
          <BookOpen class="h-12 w-12 text-primary" />
        </div>
        <CardTitle class="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleLogin" class="space-y-4">
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
              placeholder="•••••••"
              required
            />
          </div>
          <Button type="submit" class="w-full" :disabled="authStore.isLoading">
            {{ authStore.isLoading ? "Signing in..." : "Sign in" }}
          </Button>
        </form>
        <div class="mt-6 text-center text-sm">
          <span class="text-muted-foreground"
            >Don&apos;t have an account?
          </span>
          <RouterLink to="/register" class="text-primary hover:underline">
            Sign up
          </RouterLink>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { BookOpen } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { toast } from "vue-sonner";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");

const handleLogin = async () => {
  try {
    await authStore.login(email.value, password.value);
    toast.success("Welcome back!");
    const redirect = route.query.redirect as string | undefined;
    router.push(redirect || "/");
  } catch (error) {
    toast.error((error as Error).message);
  }
};
</script>
