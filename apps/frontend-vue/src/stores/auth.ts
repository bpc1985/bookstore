import { defineStore } from 'pinia'
import type { User, Token } from '@bookstore/types'
import type { ApiClient } from '@/lib/api'
import { api } from '@/lib/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  isInitialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: false,
    isInitialized: false,
  }),

  actions: {
    async login(email: string, password: string) {
      this.isLoading = true
      try {
        const tokens = await api.login({ email, password })
        api.setAccessToken(tokens.access_token)
        const user = await api.getCurrentUser()
        this.user = user
        this.accessToken = tokens.access_token
        this.refreshToken = tokens.refresh_token
        this.isLoading = false
      } catch (error) {
        this.isLoading = false
        throw error
      }
    },

    async register(email: string, password: string, fullName: string) {
      this.isLoading = true
      try {
        await api.register({ email, password, full_name: fullName })
        const tokens = await api.login({ email, password })
        api.setAccessToken(tokens.access_token)
        const user = await api.getCurrentUser()
        this.user = user
        this.accessToken = tokens.access_token
        this.refreshToken = tokens.refresh_token
        this.isLoading = false
      } catch (error) {
        this.isLoading = false
        throw error
      }
    },

    async logout() {
      try {
        if (this.refreshToken) {
          await api.logout(this.refreshToken)
        }
      } catch {
      }
      api.setAccessToken(null)
      this.user = null
      this.accessToken = null
      this.refreshToken = null
    },

    async refreshAuth() {
      if (!this.refreshToken) return

      try {
        const tokens = await api.refreshToken(this.refreshToken)
        api.setAccessToken(tokens.access_token)
        const user = await api.getCurrentUser()
        this.user = user
        this.accessToken = tokens.access_token
        this.refreshToken = tokens.refresh_token
      } catch {
        this.user = null
        this.accessToken = null
        this.refreshToken = null
      }
    },

    async initialize() {
      if (this.accessToken) {
        api.setAccessToken(this.accessToken)
        try {
          const user = await api.getCurrentUser()
          this.user = user
          this.isInitialized = true
        } catch {
          if (this.refreshToken) {
            try {
              const tokens = await api.refreshToken(this.refreshToken)
              api.setAccessToken(tokens.access_token)
              const user = await api.getCurrentUser()
              this.user = user
              this.accessToken = tokens.access_token
              this.refreshToken = tokens.refresh_token
              this.isInitialized = true
            } catch {
              this.user = null
              this.accessToken = null
              this.refreshToken = null
              this.isInitialized = true
            }
          } else {
            this.user = null
            this.accessToken = null
            this.refreshToken = null
            this.isInitialized = true
          }
        }
      } else {
        this.isInitialized = true
      }
    },
  },

  persist: {
    key: 'auth-storage',
    storage: localStorage,
    pick: ['accessToken', 'refreshToken'],
  },
})
