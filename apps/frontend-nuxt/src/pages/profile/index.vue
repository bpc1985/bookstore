<template>
  <div class="container py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleUpdate" class="space-y-4">
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
                :value="authStore.user?.email"
                type="email"
                disabled
              />
            </div>

            <div class="space-y-2">
              <Label for="password">New Password (optional)</Label>
              <Input
                id="password"
                v-model="password"
                type="password"
                placeholder="Leave blank to keep current password"
                minlength="6"
              />
            </div>

            <Button type="submit" :disabled="loading">
              <span v-if="loading">Updating...</span>
              <span v-else>Update Profile</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const toast = useToast()

const fullName = ref(authStore.user?.full_name || '')
const password = ref('')
const loading = ref(false)

const handleUpdate = async () => {
  loading.value = true
  try {
    const data: { full_name?: string; password?: string } = {
      full_name: fullName.value,
    }
    if (password.value) {
      data.password = password.value
    }
    await authStore.updateProfile(data)
    toast.success('Profile updated successfully!')
    password.value = ''
  } catch (error: any) {
    toast.error(error.message || 'Failed to update profile')
  } finally {
    loading.value = false
  }
}
</script>
