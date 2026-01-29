import { getApiClient } from '@/lib/api'

export const useApi = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  // Get or create singleton instance
  const api = getApiClient({
    baseUrl: config.public.apiUrl,
  })

  // Always sync the token from auth store
  if (authStore.accessToken) {
    api.setAccessToken(authStore.accessToken)
  }

  return {
    api,
  }
}
