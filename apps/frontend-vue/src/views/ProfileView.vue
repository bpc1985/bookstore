<template>
  <div class="min-h-screen">
    <div class="container py-8 max-w-2xl">
      <h1 class="text-3xl font-bold mb-8">Profile Settings</h1>

      <form @submit.prevent="handleUpdate" class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="name">Full Name</Label>
              <Input
                id="name"
                v-model="formData.full_name"
                placeholder="John Doe"
              />
            </div>
            <div class="space-y-2">
              <Label for="email">Email</Label>
              <Input
                id="email"
                v-model="formData.email"
                type="email"
                disabled
                class="bg-muted"
              />
              <p class="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Optional - leave blank to keep current password</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="newPassword">New Password</Label>
              <Input
                id="newPassword"
                v-model="formData.password"
                type="password"
                placeholder="••••••••"
              />
            </div>
          </CardContent>
        </Card>

        <div class="flex justify-end gap-3">
          <Button type="button" variant="outline" @click="router.back()">
            Cancel
          </Button>
          <Button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Saving...' : 'Save Changes' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'
import { api } from '@/composables/useApi'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(false)
const formData = reactive({
  full_name: '',
  email: '',
  password: '',
})

onMounted(() => {
  if (authStore.user) {
    formData.full_name = authStore.user.full_name
    formData.email = authStore.user.email
  }
})

const handleUpdate = async () => {
  isLoading.value = true
  try {
    const updateData: any = {
      full_name: formData.full_name,
    }
    if (formData.password) {
      updateData.password = formData.password
    }

    await api.updateProfile(updateData)
    await authStore.initialize()
    toast.success('Profile updated successfully')
  } catch (error) {
    toast.error('Failed to update profile')
  } finally {
    isLoading.value = false
  }
}
</script>
