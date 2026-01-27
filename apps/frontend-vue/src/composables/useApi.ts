import type { ApiClient } from '@bookstore/api'
import { ApiClient as ApiClientClass } from '@bookstore/api'

export const api = new ApiClientClass({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
}) as ApiClient
