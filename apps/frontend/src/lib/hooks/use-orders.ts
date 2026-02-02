import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCartStore } from '@/stores/cart';
import type { ShippingAddressInput, OrderStatusInput } from '@/lib/schemas';

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  const { clearCart } = useCartStore();

  return useMutation({
    mutationFn: async (shippingAddress: ShippingAddressInput) => {
      const formattedAddress = `${shippingAddress.fullName}\n${shippingAddress.address}\n${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}\n${shippingAddress.country}`;
      return api.createOrder(formattedAddress);
    },
    onSuccess: async () => {
      await clearCart(api);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useUpdateOrderStatusMutation(orderId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OrderStatusInput) => {
      return api.updateOrderStatus(orderId, data.status, data.note || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
