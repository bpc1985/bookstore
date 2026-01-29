import type {
  User,
  Book,
  BookListItem,
  Category,
  Cart,
  CartItem,
  Order,
  OrderListItem,
  OrderTracking,
  Review,
  PaginatedResponse,
  Token,
  Analytics,
} from '@bookstore/types'

export interface ApiConfig {
  baseUrl: string
}

// Singleton instance
let instance: ApiClient | null = null

export function getApiClient(config?: ApiConfig): ApiClient {
  if (!instance && config) {
    instance = new ApiClient(config)
  }
  if (!instance) {
    throw new Error('ApiClient not initialized. Call getApiClient with config first.')
  }
  return instance
}

export class ApiClient {
  private accessToken: string | null = null
  private baseUrl: string

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl
  }

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  private async request<T>(endpoint: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
    }

    if (options.body !== undefined) {
      fetchOptions.body = JSON.stringify(options.body)
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
      // If detail is an array (validation errors), extract the messages
      if (Array.isArray(error.detail)) {
        throw new Error(error.detail.map((e: any) => e.msg || e.message).join(', '))
      }
      throw new Error(error.detail || 'An error occurred')
    }

    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  async register(data: {
    email: string
    password: string
    full_name: string
  }): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: data,
    })
  }

  async login(data: { email: string; password: string }): Promise<Token> {
    return this.request<Token>('/auth/login', {
      method: 'POST',
      body: data,
    })
  }

  async refreshToken(refreshToken: string): Promise<Token> {
    return this.request<Token>('/auth/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    })
  }

  async logout(refreshToken?: string): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
      body: refreshToken ? { refresh_token: refreshToken } : undefined,
    })
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me')
  }

  async updateProfile(data: {
    full_name?: string
    password?: string
  }): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PUT',
      body: data,
    })
  }

  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categories')
  }

  async getBooks(params?: {
    search?: string
    category_id?: number
    min_price?: number
    max_price?: number
    in_stock?: boolean
    sort_by?: string
    sort_order?: string
    page?: number
    size?: number
  }): Promise<PaginatedResponse<BookListItem>> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return this.request<PaginatedResponse<BookListItem>>(`/books${query ? `?${query}` : ''}`)
  }

  async getBook(id: number): Promise<Book> {
    return this.request<Book>(`/books/${id}`)
  }

  async getBookRecommendations(id: number, limit = 5): Promise<BookListItem[]> {
    return this.request<BookListItem[]>(`/books/${id}/recommendations?limit=${limit}`)
  }

  async createBook(data: Partial<Book> & { category_ids?: number[] }): Promise<Book> {
    return this.request<Book>('/books', {
      method: 'POST',
      body: data,
    })
  }

  async updateBook(id: number, data: Partial<Book> & { category_ids?: number[] }): Promise<Book> {
    return this.request<Book>(`/books/${id}`, {
      method: 'PUT',
      body: data,
    })
  }

  async deleteBook(id: number): Promise<void> {
    return this.request<void>(`/books/${id}`, { method: 'DELETE' })
  }

  async getCart(): Promise<Cart> {
    return this.request<Cart>('/cart')
  }

  async addToCart(bookId: number, quantity = 1): Promise<CartItem> {
    return this.request<CartItem>('/cart/items', {
      method: 'POST',
      body: { book_id: bookId, quantity },
    })
  }

  async updateCartItem(itemId: number, quantity: number): Promise<CartItem> {
    return this.request<CartItem>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: { quantity },
    })
  }

  async removeCartItem(itemId: number): Promise<void> {
    return this.request<void>(`/cart/items/${itemId}`, { method: 'DELETE' })
  }

  async clearCart(): Promise<void> {
    return this.request<void>('/cart', { method: 'DELETE' })
  }

  async createOrder(shippingAddress: string): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: { shipping_address: shippingAddress },
    })
  }

  async getOrders(params?: {
    status?: string
    page?: number
    size?: number
  }): Promise<PaginatedResponse<OrderListItem>> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return this.request<PaginatedResponse<OrderListItem>>(`/orders${query ? `?${query}` : ''}`)
  }

  async getOrder(id: number): Promise<Order> {
    return this.request<Order>(`/orders/${id}`)
  }

  async cancelOrder(id: number): Promise<Order> {
    return this.request<Order>(`/orders/${id}/cancel`, { method: 'PUT' })
  }

  async getOrderTracking(id: number): Promise<OrderTracking> {
    return this.request<OrderTracking>(`/orders/${id}/tracking`)
  }

  async initiatePayment(
    orderId: number,
    provider: 'stripe' | 'paypal',
  ): Promise<{
    payment_id: number
    status: string
    client_secret?: string
    approval_url?: string
    redirect_url: string | null
    message: string
  }> {
    const idempotencyKey = `${orderId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return this.request('/payments/checkout', {
      method: 'POST',
      body: {
        order_id: orderId,
        provider,
        idempotency_key: idempotencyKey,
      },
    })
  }

  async getPayment(paymentId: number): Promise<{
    id: number
    order_id: number
    provider: string
    amount: number
    status: string
    idempotency_key: string
    provider_reference: string | null
    created_at: string
    updated_at: string
  }> {
    return this.request(`/payments/${paymentId}`)
  }

  async refundPayment(
    paymentId: number,
    amount?: number,
    reason?: string,
  ): Promise<{
    payment_id: number
    status: string
    refund_id: string | null
    amount_refunded: number | null
    message: string
  }> {
    return this.request(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: { amount, reason },
    })
  }

  async getBookReviews(
    bookId: number,
    page = 1,
    size = 20,
  ): Promise<PaginatedResponse<Review>> {
    return this.request<PaginatedResponse<Review>>(`/books/${bookId}/reviews?page=${page}&size=${size}`)
  }

  async createReview(bookId: number, data: { rating: number; comment?: string }): Promise<Review> {
    return this.request<Review>(`/books/${bookId}/reviews`, {
      method: 'POST',
      body: data,
    })
  }

  async updateReview(reviewId: number, data: { rating?: number; comment?: string }): Promise<Review> {
    return this.request<Review>(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: data,
    })
  }

  async deleteReview(reviewId: number): Promise<void> {
    return this.request<void>(`/reviews/${reviewId}`, { method: 'DELETE' })
  }

  async getAdminOrders(params?: {
    status?: string
    page?: number
    size?: number
  }): Promise<PaginatedResponse<OrderListItem>> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return this.request<PaginatedResponse<OrderListItem>>(`/admin/orders${query ? `?${query}` : ''}`)
  }

  async getAdminOrder(id: number): Promise<Order> {
    return this.request<Order>(`/admin/orders/${id}`)
  }

  async updateOrderStatus(id: number, status: string, note?: string): Promise<Order> {
    return this.request<Order>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: { status, note },
    })
  }

  async getAnalytics(): Promise<Analytics> {
    return this.request<Analytics>('/admin/analytics')
  }
}
