import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { User, Token } from '@bookstore/types'
import { getApiClient } from '@/lib/api'

function getApi() {
  const config = useRuntimeConfig()
  return getApiClient({
    baseUrl: config.public.apiUrl,
  })
}

// Helper to safely access localStorage (only on client)
function getStoredAuth() {
  if (import.meta.client) {
    try {
      const stored = localStorage.getItem('auth')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to parse stored auth:', e)
    }
  }
  return null
}

function saveAuth(data: { user: any; accessToken: string | null; refreshToken: string | null }) {
  if (import.meta.client) {
    try {
      localStorage.setItem('auth', JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save auth:', e)
    }
  }
}

function clearStoredAuth() {
  if (import.meta.client) {
    localStorage.removeItem('auth')
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)

  // Hydrate from localStorage on client-side
  function hydrateFromStorage() {
    if (import.meta.client) {
      const storedAuth = getStoredAuth()
      if (storedAuth) {
        user.value = storedAuth.user || null
        accessToken.value = storedAuth.accessToken || null
        refreshToken.value = storedAuth.refreshToken || null
      }
    }
  }

  const isAuthenticated = computed(() => !!user.value && !!accessToken.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setTokens(tokens: Token) {
    accessToken.value = tokens.access_token
    refreshToken.value = tokens.refresh_token
    getApi().setAccessToken(tokens.access_token)
    saveAuth({ user: user.value, accessToken: accessToken.value, refreshToken: refreshToken.value })
  }

  function clearAuth() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    getApi().setAccessToken(null)
    clearStoredAuth()
  }

  async function login(email: string, password: string) {
    try {
      const tokens = await getApi().login({ email, password })
      setTokens(tokens)
      await fetchUser()
      return true
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  async function register(email: string, password: string, full_name: string) {
    try {
      const userData = await getApi().register({ email, password, full_name })
      user.value = userData
      return true
    } catch (error) {
      throw error
    }
  }

  async function logout() {
    try {
      await getApi().logout(refreshToken.value || undefined)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
    }
  }

  async function fetchUser() {
    try {
      const userData = await getApi().getCurrentUser()
      user.value = userData
      saveAuth({ user: user.value, accessToken: accessToken.value, refreshToken: refreshToken.value })
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  async function updateProfile(data: { full_name?: string; password?: string }) {
    try {
      const userData = await getApi().updateProfile(data)
      user.value = userData
      return true
    } catch (error) {
      throw error
    }
  }

  async function refreshTokens() {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }

    try {
      const tokens = await getApi().refreshToken(refreshToken.value)
      setTokens(tokens)
      return true
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  watch(accessToken, (token) => {
    if (token) {
      getApi().setAccessToken(token)
    } else {
      getApi().setAccessToken(null)
    }
  }, { immediate: true })

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    fetchUser,
    updateProfile,
    refreshTokens,
    clearAuth,
    hydrateFromStorage,
  }
})
