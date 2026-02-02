import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateOrderMutation, useUpdateOrderStatusMutation } from '@/lib/hooks/use-orders';
import { api } from '@/lib/api';
import { useCartStore } from '@/stores/cart';

vi.mock('@/lib/api');
vi.mock('@/stores/cart');

const createWrapper = function({ children }: { children: React.ReactNode }) {
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

let queryClient: QueryClient;
let mockClearCart: any;

describe('use-orders hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    });
    mockClearCart = vi.fn().mockResolvedValue(undefined);
    (useCartStore as any).mockReturnValue({
      clearCart: mockClearCart,
    });
  });

  describe('useCreateOrderMutation', () => {
    it('should format address and call createOrder', async () => {
      const mockOrder = { id: 1, total_amount: 100 };
      (api.createOrder as any).mockResolvedValue(mockOrder);

      const { result } = renderHook(() => useCreateOrderMutation(), {
        wrapper: createWrapper,
      });

      const shippingAddress = {
        fullName: 'John Doe',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      };

      await result.current.mutateAsync(shippingAddress);

      expect(api.createOrder).toHaveBeenCalledWith(
        'John Doe\n123 Main St\nNew York, NY 10001\nUSA'
      );
    });

    it('should clear cart and invalidate queries on success', async () => {
      const mockOrder = { id: 1, total_amount: 100 };
      (api.createOrder as any).mockResolvedValue(mockOrder);

      const { result } = renderHook(() => useCreateOrderMutation(), {
        wrapper: createWrapper,
      });

      const shippingAddress = {
        fullName: 'John Doe',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      };

      await result.current.mutateAsync(shippingAddress);

      await waitFor(() => {
        expect(mockClearCart).toHaveBeenCalledWith(api);
      });
    });
  });

  describe('useUpdateOrderStatusMutation', () => {
    it('should call updateOrderStatus with correct parameters', async () => {
      const mockOrder = { id: 1, status: 'shipped' };
      (api.updateOrderStatus as any).mockResolvedValue(mockOrder);

      const { result } = renderHook(
        () => useUpdateOrderStatusMutation(1),
        {
          wrapper: createWrapper,
        }
      );

      await result.current.mutateAsync({
        status: 'shipped',
        note: 'Package shipped via FedEx',
      });

      expect(api.updateOrderStatus).toHaveBeenCalledWith(1, 'shipped', 'Package shipped via FedEx');
    });

    it('should call updateOrderStatus without note', async () => {
      const mockOrder = { id: 1, status: 'shipped' };
      (api.updateOrderStatus as any).mockResolvedValue(mockOrder);

      const { result } = renderHook(
        () => useUpdateOrderStatusMutation(1),
        {
          wrapper: createWrapper,
        }
      );

      await result.current.mutateAsync({ status: 'shipped' });

      expect(api.updateOrderStatus).toHaveBeenCalledWith(1, 'shipped', undefined);
    });
  });
});
