import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '@/lib/api';
import type { User, Book, Cart, Order, Token } from '@bookstore/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    mockFetch.mockClear();
    apiClient = new ApiClient({ baseUrl: 'http://test-api.com' });
  });

  // Helper function to create mock Response
  const createMockResponse = (data: any, status = 200) => ({
    ok: true,
    status,
    json: async () => data,
  } as Response);

  const createMockErrorResponse = (status = 400, detail = 'Error message') => ({
    ok: false,
    status,
    json: async () => ({ detail }),
  } as Response);

  describe('constructor', () => {
    it('should initialize with baseUrl', () => {
      const client = new ApiClient({ baseUrl: 'http://test.com' });
      expect(client).toBeDefined();
    });

    it('should accept custom fetch function', () => {
      const customFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          token_type: 'bearer',
          expires_in: 900,
        }),
      } as Response);
      const client = new ApiClient({ baseUrl: 'http://test.com' }, customFetch);
      client.login({ email: 'test@test.com', password: 'password' });
      expect(customFetch).toHaveBeenCalled();
    });
  });

  describe('setAccessToken', () => {
    it('should set access token', () => {
      const mockUser: User = {
        id: 1,
        email: 'test@test.com',
        username: 'testuser',
        full_name: 'Test User',
        is_active: true,
        is_admin: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      apiClient.setAccessToken('test-token');
      apiClient.getCurrentUser();
      const authHeader = mockFetch.mock.calls[0][1].headers.Authorization;
      expect(authHeader).toBe('Bearer test-token');
    });

    it('should clear access token', () => {
      const mockUser: User = {
        id: 1,
        email: 'test@test.com',
        username: 'testuser',
        full_name: 'Test User',
        is_active: true,
        is_admin: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      apiClient.setAccessToken('test-token');
      apiClient.setAccessToken(null);
      apiClient.getCurrentUser();
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });

  describe('authentication', () => {
    describe('login', () => {
      it('should login successfully', async () => {
        const mockToken: Token = {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          token_type: 'bearer',
          expires_in: 900,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockToken,
        } as Response);

        const result = await apiClient.login({
          email: 'test@test.com',
          password: 'password',
        });

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.com/auth/login',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ email: 'test@test.com', password: 'password' }),
          })
        );
        expect(result).toEqual(mockToken);
      });
    });

    describe('register', () => {
      it('should register successfully', async () => {
        const mockUser: User = {
          id: 1,
          email: 'test@test.com',
          username: 'testuser',
          full_name: 'Test User',
          is_active: true,
          is_admin: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };

        const mockToken: Token = {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          token_type: 'bearer',
          expires_in: 900,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
          status: 200,
        } as Response);

        const result = await apiClient.register({
          email: 'test@test.com',
          password: 'password',
          full_name: 'Test User',
        });

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.com/auth/register',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              email: 'test@test.com',
              password: 'password',
              full_name: 'Test User',
            }),
          })
        );
        expect(result).toEqual(mockUser);
      });
    });

    describe('logout', () => {
      it('should logout successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
          json: async () => ({}),
        } as Response);

        const result = await apiClient.logout('refresh-token');

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.com/auth/logout',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ refresh_token: 'refresh-token' }),
          })
        );
        expect(result).toEqual({});
      });

      it('should logout without refresh token', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
          json: async () => ({}),
        } as Response);

        const result = await apiClient.logout();

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.com/auth/logout',
          expect.objectContaining({
            method: 'POST',
            body: undefined,
          })
        );
      });
    });

    describe('refreshToken', () => {
      it('should refresh token successfully', async () => {
        const mockToken: Token = {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          token_type: 'bearer',
          expires_in: 900,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockToken,
        } as Response);

        const result = await apiClient.refreshToken('old-refresh-token');

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test-api.com/auth/refresh',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ refresh_token: 'old-refresh-token' }),
          })
        );
        expect(result).toEqual(mockToken);
      });
    });
  });

  describe('users', () => {
    it('should get current user', async () => {
      const mockUser: User = {
        id: 1,
        email: 'test@test.com',
        username: 'testuser',
        full_name: 'Test User',
        is_active: true,
        is_admin: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const result = await apiClient.getCurrentUser();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/users/me',
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
      expect(result).toEqual(mockUser);
    });

    it('should update profile', async () => {
      const mockUser: User = {
        id: 1,
        email: 'test@test.com',
        username: 'testuser',
        full_name: 'Updated Name',
        is_active: true,
        is_admin: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const result = await apiClient.updateProfile({
        full_name: 'Updated Name',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/users/me',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ full_name: 'Updated Name' }),
        })
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('books', () => {
    it('should get books with no params', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        size: 20,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getBooks();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get books with params', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        size: 20,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getBooks({
        search: 'test',
        category_id: 1,
        min_price: 10,
        max_price: 100,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books?search=test&category_id=1&min_price=10&max_price=100',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get single book', async () => {
      const mockBook: Book = {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test description',
        price: 29.99,
        stock_quantity: 10,
        cover_image: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBook,
      } as Response);

      const result = await apiClient.getBook(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books/1',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockBook);
    });

    it('should create book', async () => {
      const mockBook: Book = {
        id: 1,
        title: 'New Book',
        author: 'New Author',
        description: 'New description',
        price: 19.99,
        stock_quantity: 5,
        cover_image: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBook,
      } as Response);

      const result = await apiClient.createBook({
        title: 'New Book',
        author: 'New Author',
        price: 19.99,
        stock_quantity: 5,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            title: 'New Book',
            author: 'New Author',
            price: 19.99,
            stock_quantity: 5,
          }),
        })
      );
      expect(result).toEqual(mockBook);
    });

    it('should update book', async () => {
      const mockBook: Book = {
        id: 1,
        title: 'Updated Book',
        author: 'Updated Author',
        description: 'Updated description',
        price: 39.99,
        stock_quantity: 15,
        cover_image: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBook,
      } as Response);

      const result = await apiClient.updateBook(1, {
        title: 'Updated Book',
        price: 39.99,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ title: 'Updated Book', price: 39.99 }),
        })
      );
      expect(result).toEqual(mockBook);
    });

    it('should delete book', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const result = await apiClient.deleteBook(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books/1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual({});
    });
  });

  describe('cart', () => {
    it('should get cart', async () => {
      const mockCart: Cart = {
        items: [],
        total_items: 0,
        subtotal: '0.00',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCart,
      } as Response);

      const result = await apiClient.getCart();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/cart',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockCart);
    });

    it('should add item to cart', async () => {
      const mockCartItem = {
        id: 1,
        book_id: 1,
        quantity: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCartItem,
      } as Response);

      const result = await apiClient.addToCart(1, 2);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/cart/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ book_id: 1, quantity: 2 }),
        })
      );
      expect(result).toEqual(mockCartItem);
    });

    it('should update cart item', async () => {
      const mockCartItem = {
        id: 1,
        book_id: 1,
        quantity: 3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCartItem,
      } as Response);

      const result = await apiClient.updateCartItem(1, 3);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/cart/items/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ quantity: 3 }),
        })
      );
      expect(result).toEqual(mockCartItem);
    });

    it('should remove cart item', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const result = await apiClient.removeCartItem(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/cart/items/1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual({});
    });

    it('should clear cart', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const result = await apiClient.clearCart();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/cart',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual({});
    });
  });

  describe('error handling', () => {
    it('should throw error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found' }),
      } as Response);

      await expect(apiClient.getBook(999)).rejects.toThrow('Not found');
    });

    it('should throw generic error if no detail provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('JSON parse error');
        },
      } as Response);

      await expect(apiClient.getCurrentUser()).rejects.toThrow('An error occurred');
    });

    it('should include authorization header when token is set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      apiClient.setAccessToken('test-token');
      await apiClient.getCurrentUser();

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer test-token');
    });
  });

  describe('orders', () => {
    it('should create order', async () => {
      const mockOrder: Order = {
        id: 1,
        user_id: 1,
        items: [],
        total_amount: 29.99,
        status: 'pending',
        shipping_address: '123 Test St',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder,
      } as Response);

      const result = await apiClient.createOrder('123 Test St');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/orders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ shipping_address: '123 Test St' }),
        })
      );
      expect(result).toEqual(mockOrder);
    });

    it('should get order', async () => {
      const mockOrder: Order = {
        id: 1,
        user_id: 1,
        items: [],
        total_amount: 29.99,
        status: 'pending',
        shipping_address: '123 Test St',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder,
      } as Response);

      const result = await apiClient.getOrder(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/orders/1',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockOrder);
    });

    it('should get orders with no params', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        size: 20,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getOrders();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/orders',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get orders with params', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        size: 20,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getOrders({
        status: 'pending',
        page: 1,
        size: 10,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/orders?status=pending&page=1&size=10',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should cancel order', async () => {
      const mockOrder: Order = {
        id: 1,
        user_id: 1,
        items: [],
        total_amount: 29.99,
        status: 'cancelled',
        shipping_address: '123 Test St',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder,
      } as Response);

      const result = await apiClient.cancelOrder(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/orders/1/cancel',
        expect.objectContaining({ method: 'PUT' })
      );
      expect(result).toEqual(mockOrder);
    });

    it('should get order tracking', async () => {
      const mockTracking: OrderTracking = {
        status: 'shipped',
        tracking_number: 'FEDEX123456',
        carrier: 'FedEx',
        estimated_delivery: '2024-01-05T00:00:00Z',
        events: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTracking,
      } as Response);

      const result = await apiClient.getOrderTracking(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/orders/1/tracking',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockTracking);
    });
  });

  describe('reviews', () => {
    it('should get book reviews', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        size: 20,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getBookReviews(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books/1/reviews?page=1&size=20',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get book reviews with custom pagination', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 2,
        size: 50,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getBookReviews(1, 2, 50);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books/1/reviews?page=2&size=50',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create review', async () => {
      const mockReview: Review = {
        id: 1,
        book_id: 1,
        user_id: 1,
        rating: 5,
        comment: 'Great book',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReview,
      } as Response);

      const result = await apiClient.createReview(1, {
        rating: 5,
        comment: 'Great book',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books/1/reviews',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ rating: 5, comment: 'Great book' }),
        })
      );
      expect(result).toEqual(mockReview);
    });

    it('should update review', async () => {
      const mockReview: Review = {
        id: 1,
        book_id: 1,
        user_id: 1,
        rating: 4,
        comment: 'Updated comment',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReview,
      } as Response);

      const result = await apiClient.updateReview(1, {
        rating: 4,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/reviews/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ rating: 4 }),
        })
      );
      expect(result).toEqual(mockReview);
    });

    it('should delete review', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response);

      const result = await apiClient.deleteReview(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/reviews/1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual({});
    });
  });

  describe('admin', () => {
    it('should get analytics', async () => {
      const mockAnalytics: Analytics = {
        total_orders: 100,
        total_revenue: 5000,
        orders_by_status: {
          pending: 10,
          paid: 80,
          shipped: 5,
          delivered: 5,
        },
        recent_orders: [],
        revenue_by_day: [],
        top_selling_books: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics,
      } as Response);

      const result = await apiClient.getAnalytics();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/analytics',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockAnalytics);
    });

    it('should get admin orders with no params', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        size: 20,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getAdminOrders();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/orders',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get admin orders with params', async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        size: 20,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getAdminOrders({
        status: 'shipped',
        page: 1,
        size: 10,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/orders?status=shipped&page=1&size=10',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get admin order', async () => {
      const mockOrder: Order = {
        id: 1,
        user_id: 1,
        items: [],
        total_amount: 29.99,
        status: 'pending',
        shipping_address: '123 Test St',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder,
      } as Response);

      const result = await apiClient.getAdminOrder(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/orders/1',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockOrder);
    });

    it('should update order status', async () => {
      const mockOrder: Order = {
        id: 1,
        user_id: 1,
        items: [],
        total_amount: 29.99,
        status: 'shipped',
        shipping_address: '123 Test St',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder,
      } as Response);

      const result = await apiClient.updateOrderStatus(1, 'shipped', 'Package shipped');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/orders/1/status',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'shipped', note: 'Package shipped' }),
        })
      );
      expect(result).toEqual(mockOrder);
    });

    it('should update order status without note', async () => {
      const mockOrder: Order = {
        id: 1,
        user_id: 1,
        items: [],
        total_amount: 29.99,
        status: 'shipped',
        shipping_address: '123 Test St',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder,
      } as Response);

      const result = await apiClient.updateOrderStatus(1, 'shipped');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/admin/orders/1/status',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'shipped' }),
        })
      );
      expect(result).toEqual(mockOrder);
    });
  });

  describe('categories', () => {
    it('should get categories', async () => {
      const mockCategories: Category[] = [
        { id: 1, name: 'Fiction', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
        { id: 2, name: 'Non-Fiction', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      } as Response);

      const result = await apiClient.getCategories();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/categories',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockCategories);
    });
  });

  describe('book recommendations', () => {
    it('should get book recommendations with default limit', async () => {
      const mockBooks: BookListItem[] = [
        { id: 1, title: 'Book 1', price: 10, author: 'Author 1' },
        { id: 2, title: 'Book 2', price: 20, author: 'Author 2' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBooks,
      } as Response);

      const result = await apiClient.getBookRecommendations(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books/1/recommendations?limit=5',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockBooks);
    });

    it('should get book recommendations with custom limit', async () => {
      const mockBooks: BookListItem[] = [
        { id: 1, title: 'Book 1', price: 10, author: 'Author 1' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBooks,
      } as Response);

      const result = await apiClient.getBookRecommendations(1, 10);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/books/1/recommendations?limit=10',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockBooks);
    });
  });

  describe('payments', () => {
    it('should initiate payment', async () => {
      const mockPayment = {
        payment_id: 1,
        status: 'pending',
        client_secret: 'secret_123',
        redirect_url: null,
        message: 'Payment initiated',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPayment,
      } as Response);

      const result = await apiClient.initiatePayment(1, 'stripe');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/payments/checkout',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"order_id":1'),
        })
      );
      expect(result).toEqual(expect.objectContaining({
        payment_id: 1,
        status: 'pending',
      }));
    });

    it('should get payment', async () => {
      const mockPayment = {
        id: 1,
        order_id: 1,
        provider: 'stripe',
        amount: 29.99,
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPayment,
      } as Response);

      const result = await apiClient.getPayment(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/payments/1',
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(mockPayment);
    });

    it('should refund payment', async () => {
      const mockRefund = {
        payment_id: 1,
        status: 'refunded',
        refund_id: 'refund_123',
        amount_refunded: 29.99,
        message: 'Payment refunded',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefund,
      } as Response);

      const result = await apiClient.refundPayment(1, 29.99, 'Customer request');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/payments/1/refund',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ amount: 29.99, reason: 'Customer request' }),
        })
      );
      expect(result).toEqual(expect.objectContaining({
        payment_id: 1,
        status: 'refunded',
      }));
    });
  });
});
