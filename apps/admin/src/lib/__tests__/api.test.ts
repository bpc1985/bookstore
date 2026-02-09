import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '@/lib/api';

const mockFetch = vi.fn();

describe('ApiClient', () => {
  let api: ApiClient;

  beforeEach(() => {
    mockFetch.mockClear();
    api = new ApiClient({ baseUrl: 'http://test-api.com' }, mockFetch);
  });

  const mockOk = (data: unknown, status = 200) =>
    ({ ok: true, status, json: async () => data }) as Response;

  const mockError = (status: number, detail = 'Error') =>
    ({ ok: false, status, json: async () => ({ detail }) }) as Response;

  // ---- constructor & token management ----

  describe('constructor', () => {
    it('should initialize with baseUrl', () => {
      expect(api).toBeDefined();
    });

    it('should use custom fetch function', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ access_token: 'tok' }));
      await api.login({ email: 'a@b.com', password: 'pw' });
      expect(mockFetch).toHaveBeenCalledOnce();
    });
  });

  describe('setAccessToken', () => {
    it('should include Authorization header when set', async () => {
      api.setAccessToken('my-token');
      mockFetch.mockResolvedValueOnce(mockOk({}));
      await api.getCurrentUser();
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-token');
    });

    it('should omit Authorization header when cleared', async () => {
      api.setAccessToken('my-token');
      api.setAccessToken(null);
      mockFetch.mockResolvedValueOnce(mockOk({}));
      await api.getCurrentUser();
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
    });
  });

  // ---- error handling ----

  describe('error handling', () => {
    it('should throw on non-ok response with detail', async () => {
      mockFetch.mockResolvedValueOnce(mockError(400, 'Bad request'));
      await expect(api.getAnalytics()).rejects.toThrow('Bad request');
    });

    it('should throw generic message when json parse fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('parse error'); },
      } as Response);
      await expect(api.getCurrentUser()).rejects.toThrow('An error occurred');
    });

    it('should throw Unauthorized on 401 without refresh token', async () => {
      mockFetch.mockResolvedValueOnce(mockError(401));
      await expect(api.getCurrentUser()).rejects.toThrow('Unauthorized - please login again');
    });

    it('should return empty object for 204 responses', async () => {
      mockFetch.mockResolvedValueOnce(mockOk(null, 204));
      const result = await api.deleteBook(1);
      expect(result).toEqual({});
    });
  });

  // ---- 401 auto-refresh ----

  describe('auto-refresh on 401', () => {
    it('should refresh token and retry on 401', async () => {
      api.setAccessToken('expired');
      api.setRefreshToken('refresh-tok');

      // First call: 401
      mockFetch.mockResolvedValueOnce(mockError(401));
      // Refresh call
      mockFetch.mockResolvedValueOnce(
        mockOk({ access_token: 'new-access', refresh_token: 'new-refresh', token_type: 'bearer', expires_in: 900 }),
      );
      // Retry call
      mockFetch.mockResolvedValueOnce(mockOk({ id: 1, email: 'admin@test.com' }));

      const user = await api.getCurrentUser();
      expect(user).toEqual({ id: 1, email: 'admin@test.com' });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should call onTokenRefreshed callback after refresh', async () => {
      const callback = vi.fn();
      api.setOnTokenRefreshed(callback);
      api.setAccessToken('expired');
      api.setRefreshToken('refresh-tok');

      mockFetch.mockResolvedValueOnce(mockError(401));
      mockFetch.mockResolvedValueOnce(
        mockOk({ access_token: 'new-access', refresh_token: 'new-refresh', token_type: 'bearer', expires_in: 900 }),
      );
      mockFetch.mockResolvedValueOnce(mockOk({ id: 1 }));

      await api.getCurrentUser();
      expect(callback).toHaveBeenCalledWith('new-access');
    });

    it('should throw if refresh itself fails', async () => {
      api.setAccessToken('expired');
      api.setRefreshToken('bad-refresh');

      mockFetch.mockResolvedValueOnce(mockError(401));
      // Refresh also fails
      mockFetch.mockResolvedValueOnce(mockError(401));

      await expect(api.getCurrentUser()).rejects.toThrow('Unauthorized - please login again');
    });
  });

  // ---- auth endpoints ----

  describe('login', () => {
    it('should POST to /auth/login', async () => {
      const token = { access_token: 'at', refresh_token: 'rt', token_type: 'bearer', expires_in: 900 };
      mockFetch.mockResolvedValueOnce(mockOk(token));

      const result = await api.login({ email: 'a@b.com', password: 'pw' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'a@b.com', password: 'pw' }),
        }),
      );
      expect(result).toEqual(token);
    });
  });

  describe('refreshToken', () => {
    it('should POST to /auth/refresh', async () => {
      const token = { access_token: 'new', refresh_token: 'new-r', token_type: 'bearer', expires_in: 900 };
      mockFetch.mockResolvedValueOnce(mockOk(token));

      const result = await api.refreshToken('old-refresh');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refresh_token: 'old-refresh' }),
        }),
      );
      expect(result).toEqual(token);
    });
  });

  describe('logout', () => {
    it('should POST with refresh token', async () => {
      mockFetch.mockResolvedValueOnce(mockOk(null, 204));
      await api.logout('rt');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/auth/logout',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refresh_token: 'rt' }),
        }),
      );
    });

    it('should POST without body when no refresh token', async () => {
      mockFetch.mockResolvedValueOnce(mockOk(null, 204));
      await api.logout();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/auth/logout',
        expect.objectContaining({ method: 'POST', body: undefined }),
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should GET /users/me', async () => {
      const user = { id: 1, email: 'admin@test.com' };
      mockFetch.mockResolvedValueOnce(mockOk(user));
      const result = await api.getCurrentUser();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/users/me',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(result).toEqual(user);
    });
  });

  // ---- admin endpoints ----

  describe('getAnalytics', () => {
    it('should GET /admin/analytics', async () => {
      const data = { total_orders: 10, total_revenue: 500 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await api.getAnalytics();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/analytics',
        expect.any(Object),
      );
      expect(result).toEqual(data);
    });
  });

  describe('getAdminOrders', () => {
    it('should GET /admin/orders without params', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ items: [], total: 0 }));
      await api.getAdminOrders();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/orders',
        expect.any(Object),
      );
    });

    it('should GET /admin/orders with query params', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ items: [], total: 0 }));
      await api.getAdminOrders({ status: 'shipped', page: 2, size: 10 });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/orders?status=shipped&page=2&size=10',
        expect.any(Object),
      );
    });

    it('should skip undefined/null/empty params', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ items: [], total: 0 }));
      await api.getAdminOrders({ status: undefined, page: 1 });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/orders?page=1',
        expect.any(Object),
      );
    });
  });

  describe('getAdminOrder', () => {
    it('should GET /admin/orders/:id', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ id: 5 }));
      const result = await api.getAdminOrder(5);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/orders/5',
        expect.any(Object),
      );
      expect(result).toEqual({ id: 5 });
    });
  });

  describe('updateOrderStatus', () => {
    it('should PUT status with note', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ id: 1, status: 'shipped' }));
      await api.updateOrderStatus(1, 'shipped', 'Tracking: ABC');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/orders/1/status',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'shipped', note: 'Tracking: ABC' }),
        }),
      );
    });

    it('should PUT status without note', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ id: 1, status: 'shipped' }));
      await api.updateOrderStatus(1, 'shipped');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/orders/1/status',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'shipped' }),
        }),
      );
    });
  });

  // ---- reviews ----

  describe('listPendingReviews', () => {
    it('should GET with default pagination', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ items: [], total: 0 }));
      await api.listPendingReviews();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/reviews/pending?page=1&size=20',
        expect.any(Object),
      );
    });

    it('should GET with custom pagination', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ items: [], total: 0 }));
      await api.listPendingReviews(3, 50);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/reviews/pending?page=3&size=50',
        expect.any(Object),
      );
    });
  });

  describe('approveReview', () => {
    it('should PUT approve=true', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ id: 7 }));
      await api.approveReview(7, true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/reviews/7/approve?approved=true',
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    it('should PUT approve=false', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ id: 7 }));
      await api.approveReview(7, false);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/reviews/7/approve?approved=false',
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });

  // ---- books CRUD ----

  describe('books', () => {
    it('getBooks - no params', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ items: [], total: 0 }));
      await api.getBooks();
      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/books', expect.any(Object));
    });

    it('getBooks - with params', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ items: [], total: 0 }));
      await api.getBooks({ search: 'test', category_id: 2, page: 1, size: 10 });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books?search=test&category_id=2&page=1&size=10',
        expect.any(Object),
      );
    });

    it('getBook', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ id: 3, title: 'Book' }));
      const result = await api.getBook(3);
      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/books/3', expect.any(Object));
      expect(result).toEqual({ id: 3, title: 'Book' });
    });

    it('getBookRecommendations - default limit', async () => {
      mockFetch.mockResolvedValueOnce(mockOk([]));
      await api.getBookRecommendations(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books/1/recommendations?limit=5',
        expect.any(Object),
      );
    });

    it('getBookRecommendations - custom limit', async () => {
      mockFetch.mockResolvedValueOnce(mockOk([]));
      await api.getBookRecommendations(1, 10);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books/1/recommendations?limit=10',
        expect.any(Object),
      );
    });

    it('createBook', async () => {
      const book = { title: 'New', author: 'Auth' };
      mockFetch.mockResolvedValueOnce(mockOk({ id: 1, ...book }));
      await api.createBook(book);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books',
        expect.objectContaining({ method: 'POST', body: JSON.stringify(book) }),
      );
    });

    it('updateBook', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ id: 1, title: 'Updated' }));
      await api.updateBook(1, { title: 'Updated' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books/1',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ title: 'Updated' }) }),
      );
    });

    it('deleteBook', async () => {
      mockFetch.mockResolvedValueOnce(mockOk(null, 204));
      await api.deleteBook(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books/1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  // ---- categories CRUD ----

  describe('categories', () => {
    it('getCategories', async () => {
      mockFetch.mockResolvedValueOnce(mockOk([{ id: 1, name: 'Fiction' }]));
      const result = await api.getCategories();
      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/categories', expect.any(Object));
      expect(result).toEqual([{ id: 1, name: 'Fiction' }]);
    });

    it('createCategory', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ id: 1, name: 'Sci-Fi' }));
      await api.createCategory({ name: 'Sci-Fi', parent_id: 1 });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/categories',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Sci-Fi', parent_id: 1 }),
        }),
      );
    });

    it('updateCategory', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ id: 1, name: 'Updated' }));
      await api.updateCategory(1, { name: 'Updated' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/categories/1',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ name: 'Updated' }) }),
      );
    });

    it('deleteCategory', async () => {
      mockFetch.mockResolvedValueOnce(mockOk(null, 204));
      await api.deleteCategory(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/categories/1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  // ---- users CRUD ----

  describe('users', () => {
    it('getUsers - no params', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ items: [], total: 0 }));
      await api.getUsers();
      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/admin/users', expect.any(Object));
    });

    it('getUsers - with params', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ items: [], total: 0 }));
      await api.getUsers({ role: 'admin', is_active: true, page: 1, size: 10 });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/users?role=admin&is_active=true&page=1&size=10',
        expect.any(Object),
      );
    });

    it('getUser', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ id: 2, email: 'user@test.com' }));
      const result = await api.getUser(2);
      expect(mockFetch).toHaveBeenCalledWith('http://test-api.com/admin/users/2', expect.any(Object));
      expect(result).toEqual({ id: 2, email: 'user@test.com' });
    });

    it('updateUserRole', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ id: 2, role: 'admin' }));
      await api.updateUserRole(2, 'admin');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/users/2/role',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ role: 'admin' }) }),
      );
    });

    it('deactivateUser', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ id: 2, is_active: false }));
      await api.deactivateUser(2);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/users/2/status',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ is_active: false }) }),
      );
    });

    it('activateUser', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ id: 2, is_active: true }));
      await api.activateUser(2);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/users/2/status',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify({ is_active: true }) }),
      );
    });
  });
});
