'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { api } from '@/lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initialize, isInitialized, user } = useAuthStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    initialize(api);
  }, [initialize]);

  useEffect(() => {
    if (isInitialized && user) {
      fetchCart(api);
    }
  }, [isInitialized, user, fetchCart]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>{children}</AuthInitializer>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
