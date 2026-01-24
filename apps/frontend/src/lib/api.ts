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
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || 'An error occurred');
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async register(data: { email: string; password: string; full_name: string }): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }): Promise<Token> {
    return this.request<Token>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refreshToken(refreshToken: string): Promise<Token> {
    return this.request<Token>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async logout(refreshToken?: string): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
      body: refreshToken ? JSON.stringify({ refresh_token: refreshToken }) : undefined,
    });
  }

  // User
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me');
  }

  async updateProfile(data: { full_name?: string; password?: string }): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categories');
  }

  // Books
  async getBooks(params?: {
    search?: string;
    category_id?: number;
    min_price?: number;
    max_price?: number;
    in_stock?: boolean;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<BookListItem>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<PaginatedResponse<BookListItem>>(`/books${query ? `?${query}` : ''}`);
  }

  async getBook(id: number): Promise<Book> {
    return this.request<Book>(`/books/${id}`);
  }

  async getBookRecommendations(id: number, limit = 5): Promise<BookListItem[]> {
    return this.request<BookListItem[]>(`/books/${id}/recommendations?limit=${limit}`);
  }

  async createBook(data: Partial<Book> & { category_ids?: number[] }): Promise<Book> {
    return this.request<Book>('/books', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBook(id: number, data: Partial<Book> & { category_ids?: number[] }): Promise<Book> {
    return this.request<Book>(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBook(id: number): Promise<void> {
    return this.request<void>(`/books/${id}`, { method: 'DELETE' });
  }

  // Cart
  async getCart(): Promise<Cart> {
    return this.request<Cart>('/cart');
  }

  async addToCart(bookId: number, quantity = 1): Promise<CartItem> {
    return this.request<CartItem>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ book_id: bookId, quantity }),
    });
  }

  async updateCartItem(itemId: number, quantity: number): Promise<CartItem> {
    return this.request<CartItem>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeCartItem(itemId: number): Promise<void> {
    return this.request<void>(`/cart/items/${itemId}`, { method: 'DELETE' });
  }

  async clearCart(): Promise<void> {
    return this.request<void>('/cart', { method: 'DELETE' });
  }

  // Orders
  async createOrder(shippingAddress: string): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify({ shipping_address: shippingAddress }),
    });
  }

  async completeOrder(orderId: number): Promise<{ order_id: number; status: string; message: string }> {
    return this.request('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    });
  }

  async getOrders(params?: {
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<OrderListItem>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<PaginatedResponse<OrderListItem>>(`/orders${query ? `?${query}` : ''}`);
  }

  async getOrder(id: number): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  async cancelOrder(id: number): Promise<Order> {
    return this.request<Order>(`/orders/${id}/cancel`, { method: 'PUT' });
  }

  async getOrderTracking(id: number): Promise<OrderTracking> {
    return this.request<OrderTracking>(`/orders/${id}/tracking`);
  }

  // Payments
  async initiatePayment(orderId: number, provider: 'stripe' | 'paypal'): Promise<{
    payment_id: number;
    status: string;
    client_secret?: string;
    approval_url?: string;
    redirect_url: string | null;
    message: string;
  }> {
    const idempotencyKey = `${orderId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return this.request('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        provider,
        idempotency_key: idempotencyKey,
      }),
    });
  }

  async confirmStripePayment(paymentId: number, paymentMethodId: string): Promise<{
    payment_id: number;
    status: string;
    message: string;
  }> {
    return this.request(`/payments/stripe/${paymentId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ payment_method_id: paymentMethodId }),
    });
  }

  async confirmPayPalPayment(paymentId: number, payerId: string): Promise<{
    payment_id: number;
    status: string;
    message: string;
  }> {
    return this.request(`/payments/paypal/${paymentId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ payer_id: payerId }),
    });
  }

  async getPayment(paymentId: number): Promise<{
    id: number;
    order_id: number;
    provider: string;
    amount: number;
    status: string;
    idempotency_key: string;
    provider_reference: string | null;
    created_at: string;
    updated_at: string;
  }> {
    return this.request(`/payments/${paymentId}`);
  }

  async refundPayment(paymentId: number, amount?: number, reason?: string): Promise<{
    payment_id: number;
    status: string;
    refund_id: string | null;
    amount_refunded: number | null;
    message: string;
  }> {
    return this.request(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  }

  // Reviews
  async getBookReviews(bookId: number, page = 1, size = 20): Promise<PaginatedResponse<Review>> {
    return this.request<PaginatedResponse<Review>>(
      `/books/${bookId}/reviews?page=${page}&size=${size}`
    );
  }

  async createReview(bookId: number, data: { rating: number; comment?: string }): Promise<Review> {
    return this.request<Review>(`/books/${bookId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReview(reviewId: number, data: { rating?: number; comment?: string }): Promise<Review> {
    return this.request<Review>(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteReview(reviewId: number): Promise<void> {
    return this.request<void>(`/reviews/${reviewId}`, { method: 'DELETE' });
  }

  // Admin
  async getAdminOrders(params?: {
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<OrderListItem>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<PaginatedResponse<OrderListItem>>(`/admin/orders${query ? `?${query}` : ''}`);
  }

  async getAdminOrder(id: number): Promise<Order> {
    return this.request<Order>(`/admin/orders/${id}`);
  }

  async updateOrderStatus(id: number, status: string, note?: string): Promise<Order> {
    return this.request<Order>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  }

  async getAnalytics(): Promise<Analytics> {
    return this.request<Analytics>('/admin/analytics');
  }
}

export const api = new ApiClient();
