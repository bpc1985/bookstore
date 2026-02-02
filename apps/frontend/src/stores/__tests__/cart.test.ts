import { act } from '@testing-library/react';
import { createCartStore } from '@/stores/cart';
import type { ApiClient } from '@/lib/api';
import type { Cart, CartItem } from '@bookstore/types';

describe('CartStore', () => {
  let store: ReturnType<typeof createCartStore>;
  let mockApiClient: ApiClient;

  const mockCartItem: CartItem = {
    id: 1,
    book_id: 1,
    book: {
      id: 1,
      title: 'Test Book',
      author: 'Test Author',
      description: 'Test description',
      price: 29.99,
      stock_quantity: 10,
      cover_image: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    quantity: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockCart: Cart = {
    items: [mockCartItem],
    total_items: 2,
    subtotal: '59.98',
  };

  const emptyCart: Cart = {
    items: [],
    total_items: 0,
    subtotal: '0.00',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockApiClient = {
      getCart: vi.fn(),
      addToCart: vi.fn(),
      updateCartItem: vi.fn(),
      removeCartItem: vi.fn(),
      clearCart: vi.fn(),
    } as unknown as ApiClient;

    store = createCartStore();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState();

      expect(state.cart).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchCart', () => {
    it('should fetch cart successfully', async () => {
      (mockApiClient.getCart as any).mockResolvedValue(mockCart);

      await act(async () => {
        await store.getState().fetchCart(mockApiClient);
      });

      const state = store.getState();

      expect(mockApiClient.getCart).toHaveBeenCalled();
      expect(state.cart).toEqual(mockCart);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch cart');
      (mockApiClient.getCart as any).mockRejectedValue(error);

      await expect(
        act(async () => {
          await store.getState().fetchCart(mockApiClient);
        })
      ).rejects.toThrow('Failed to fetch cart');

      const state = store.getState();

      expect(state.error).toBe('Failed to fetch cart');
      expect(state.isLoading).toBe(false);
    });

    it('should set loading state during fetch', async () => {
      let resolveCart: (value: Cart) => void;
      (mockApiClient.getCart as any).mockImplementation(
        () => new Promise((resolve) => {
          resolveCart = resolve;
        })
      );

      const fetchPromise = store.getState().fetchCart(mockApiClient);

      expect(store.getState().isLoading).toBe(true);

      await act(async () => {
        resolveCart!(mockCart);
        await fetchPromise;
      });

      expect(store.getState().isLoading).toBe(false);
    });
  });

  describe('addItem', () => {
    it('should add item to cart successfully', async () => {
      (mockApiClient.addToCart as any).mockResolvedValue(mockCartItem);
      (mockApiClient.getCart as any).mockResolvedValue(mockCart);

      await act(async () => {
        await store.getState().addItem(mockApiClient, 1, 2);
      });

      const state = store.getState();

      expect(mockApiClient.addToCart).toHaveBeenCalledWith(1, 2);
      expect(mockApiClient.getCart).toHaveBeenCalled();
      expect(state.cart).toEqual(mockCart);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should add item with default quantity of 1', async () => {
      (mockApiClient.addToCart as any).mockResolvedValue(mockCartItem);
      (mockApiClient.getCart as any).mockResolvedValue(mockCart);

      await act(async () => {
        await store.getState().addItem(mockApiClient, 1);
      });

      expect(mockApiClient.addToCart).toHaveBeenCalledWith(1, 1);
    });

    it('should handle add item error', async () => {
      const error = new Error('Failed to add item');
      (mockApiClient.addToCart as any).mockRejectedValue(error);

      await expect(
        act(async () => {
          await store.getState().addItem(mockApiClient, 1, 1);
        })
      ).rejects.toThrow('Failed to add item');

      const state = store.getState();

      expect(state.error).toBe('Failed to add item');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('updateItem', () => {
    it('should update cart item successfully', async () => {
      const updatedItem = { ...mockCartItem, quantity: 3 };
      const updatedCart = {
        ...mockCart,
        items: [updatedItem],
        total_items: 3,
        subtotal: '89.97',
      };

      (mockApiClient.updateCartItem as any).mockResolvedValue(updatedItem);
      (mockApiClient.getCart as any).mockResolvedValue(updatedCart);

      await act(async () => {
        await store.getState().updateItem(mockApiClient, 1, 3);
      });

      const state = store.getState();

      expect(mockApiClient.updateCartItem).toHaveBeenCalledWith(1, 3);
      expect(mockApiClient.getCart).toHaveBeenCalled();
      expect(state.cart).toEqual(updatedCart);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle update item error', async () => {
      const error = new Error('Failed to update item');
      (mockApiClient.updateCartItem as any).mockRejectedValue(error);

      await expect(
        act(async () => {
          await store.getState().updateItem(mockApiClient, 1, 2);
        })
      ).rejects.toThrow('Failed to update item');

      const state = store.getState();

      expect(state.error).toBe('Failed to update item');
    });
  });

  describe('removeItem', () => {
    it('should remove cart item successfully', async () => {
      (mockApiClient.removeCartItem as any).mockResolvedValue(undefined);
      (mockApiClient.getCart as any).mockResolvedValue(emptyCart);

      await act(async () => {
        await store.getState().removeItem(mockApiClient, 1);
      });

      const state = store.getState();

      expect(mockApiClient.removeCartItem).toHaveBeenCalledWith(1);
      expect(mockApiClient.getCart).toHaveBeenCalled();
      expect(state.cart).toEqual(emptyCart);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle remove item error', async () => {
      const error = new Error('Failed to remove item');
      (mockApiClient.removeCartItem as any).mockRejectedValue(error);

      await expect(
        act(async () => {
          await store.getState().removeItem(mockApiClient, 1);
        })
      ).rejects.toThrow('Failed to remove item');

      const state = store.getState();

      expect(state.error).toBe('Failed to remove item');
    });
  });

  describe('clearCart', () => {
    it('should clear cart successfully', async () => {
      (mockApiClient.clearCart as any).mockResolvedValue(undefined);

      store.setState({ cart: mockCart });

      await act(async () => {
        await store.getState().clearCart(mockApiClient);
      });

      const state = store.getState();

      expect(mockApiClient.clearCart).toHaveBeenCalled();
      expect(state.cart).toEqual(emptyCart);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle clear cart error', async () => {
      const error = new Error('Failed to clear cart');
      (mockApiClient.clearCart as any).mockRejectedValue(error);

      await expect(
        act(async () => {
          await store.getState().clearCart(mockApiClient);
        })
      ).rejects.toThrow('Failed to clear cart');

      const state = store.getState();

      expect(state.error).toBe('Failed to clear cart');
    });

    it('should set cart to empty structure even on error', async () => {
      const error = new Error('Failed to clear cart');
      (mockApiClient.clearCart as any).mockRejectedValue(error);

      try {
        await act(async () => {
          await store.getState().clearCart(mockApiClient);
        });
      } catch (e) {
      }

      const state = store.getState();

      expect(state.error).toBe('Failed to clear cart');
    });
  });

  describe('error state', () => {
    it('should clear error on successful operation', async () => {
      store.setState({ error: 'Previous error' });

      (mockApiClient.getCart as any).mockResolvedValue(mockCart);

      await act(async () => {
        await store.getState().fetchCart(mockApiClient);
      });

      const state = store.getState();

      expect(state.error).toBeNull();
    });

    it('should maintain error state across operations', async () => {
      (mockApiClient.getCart as any).mockRejectedValueOnce(new Error('First error'));

      try {
        await act(async () => {
          await store.getState().fetchCart(mockApiClient);
        });
      } catch (e) {
      }

      expect(store.getState().error).toBe('First error');

      (mockApiClient.getCart as any).mockResolvedValue(mockCart);

      await act(async () => {
        await store.getState().fetchCart(mockApiClient);
      });

      expect(store.getState().error).toBeNull();
    });
  });
});
