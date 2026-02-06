import type {
  User,
  Book,
  BookListItem,
  Category,
  Order,
  OrderListItem,
  Review,
  PaginatedResponse,
  Token,
  Analytics,
} from "@bookstore/types";

export interface ApiConfig {
  baseUrl: string;
}

export class ApiClient {
  private accessToken: string | null = null;
  private storedRefreshToken: string | null = null;
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private isRefreshing = false;
  private onTokenRefreshed: ((token: string) => void) | null = null;

  constructor(config: ApiConfig, fetchFn?: typeof fetch) {
    this.baseUrl = config.baseUrl;
    this.fetchFn = fetchFn ?? ((...args: Parameters<typeof fetch>) => globalThis.fetch(...args));
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  setRefreshToken(token: string | null) {
    this.storedRefreshToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true,
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${this.accessToken}`;
    }

    const response = await this.fetchFn(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && retry && this.storedRefreshToken) {
        // Try to refresh the token and retry the request
        try {
          const tokens = await this.refreshToken(this.storedRefreshToken);
          this.accessToken = tokens.access_token;
          this.storedRefreshToken = tokens.refresh_token;
          if (this.onTokenRefreshed) {
            this.onTokenRefreshed(tokens.access_token);
          }
          return this.request<T>(endpoint, options, false);
        } catch {
          throw new Error("Unauthorized - please login again");
        }
      }
      if (response.status === 401) {
        throw new Error("Unauthorized - please login again");
      }
      const error = await response
        .json()
        .catch(() => ({ detail: "An error occurred" }));
      throw new Error(error.detail || "An error occurred");
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  setOnTokenRefreshed(callback: ((token: string) => void) | null) {
    this.onTokenRefreshed = callback;
  }

  async login(data: { email: string; password: string }): Promise<Token> {
    return this.request<Token>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async refreshToken(refreshToken: string): Promise<Token> {
    return this.request<Token>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async logout(refreshToken?: string): Promise<void> {
    return this.request<void>("/auth/logout", {
      method: "POST",
      body: refreshToken
        ? JSON.stringify({ refresh_token: refreshToken })
        : undefined,
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/users/me");
  }

  // ===== Admin API Methods =====

  async getAnalytics(): Promise<Analytics> {
    return this.request<Analytics>("/admin/analytics");
  }

  async getAdminOrders(params?: {
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<OrderListItem>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<PaginatedResponse<OrderListItem>>(
      `/admin/orders${query ? `?${query}` : ""}`,
    );
  }

  async getAdminOrder(id: number): Promise<Order> {
    return this.request<Order>(`/admin/orders/${id}`);
  }

  async updateOrderStatus(
    id: number,
    status: string,
    note?: string,
  ): Promise<Order> {
    return this.request<Order>(`/admin/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, note }),
    });
  }

  async listPendingReviews(
    page = 1,
    size = 20,
  ): Promise<PaginatedResponse<Review>> {
    return this.request<PaginatedResponse<Review>>(
      `/admin/reviews/pending?page=${page}&size=${size}`,
    );
  }

  async approveReview(id: number, approved: boolean): Promise<Review> {
    return this.request<Review>(
      `/admin/reviews/${id}/approve?approved=${approved}`,
      {
        method: "PUT",
      },
    );
  }

  // ===== Books CRUD =====

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
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<PaginatedResponse<BookListItem>>(
      `/books${query ? `?${query}` : ""}`,
    );
  }

  async getBook(id: number): Promise<Book> {
    return this.request<Book>(`/books/${id}`);
  }

  async getBookRecommendations(id: number, limit = 5): Promise<BookListItem[]> {
    return this.request<BookListItem[]>(
      `/books/${id}/recommendations?limit=${limit}`,
    );
  }

  async createBook(
    data: Partial<Book> & { category_ids?: number[] },
  ): Promise<Book> {
    return this.request<Book>("/books", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateBook(
    id: number,
    data: Partial<Book> & { category_ids?: number[] },
  ): Promise<Book> {
    return this.request<Book>(`/books/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteBook(id: number): Promise<void> {
    return this.request<void>(`/books/${id}`, { method: "DELETE" });
  }

  // ===== Categories CRUD =====

  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>("/categories");
  }

  async createCategory(data: {
    name: string;
    parent_id?: number | null;
  }): Promise<Category> {
    return this.request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCategory(
    id: number,
    data: { name: string; parent_id?: number | null },
  ): Promise<Category> {
    return this.request<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: number): Promise<void> {
    return this.request<void>(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  // ===== Users CRUD =====

  async getUsers(params?: {
    role?: string;
    is_active?: boolean;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<PaginatedResponse<User>>(
      `/admin/users${query ? `?${query}` : ""}`,
    );
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>(`/admin/users/${id}`);
  }

  async updateUserRole(id: number, role: string): Promise<User> {
    return this.request<User>(`/admin/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  }

  async deactivateUser(id: number): Promise<User> {
    return this.request<User>(`/admin/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ is_active: false }),
    });
  }

  async activateUser(id: number): Promise<User> {
    return this.request<User>(`/admin/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ is_active: true }),
    });
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = new ApiClient({ baseUrl: API_URL });
