import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateProfileMutation } from '@/lib/hooks/use-profile';
import { api } from '@/lib/api';

vi.mock('@/lib/api');

const createWrapper = function({ children }: { children: React.ReactNode }) {
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

let queryClient: QueryClient;

describe('use-profile hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    });
  });

  describe('useUpdateProfileMutation', () => {
    it('should call updateProfile with correct parameters', async () => {
      const mockUser = { id: 1, full_name: 'Updated Name' };
      (api.updateProfile as any).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useUpdateProfileMutation(), {
        wrapper: createWrapper,
      });

      await result.current.mutateAsync({
        full_name: 'Updated Name',
      });

      expect(api.updateProfile).toHaveBeenCalledWith({
        full_name: 'Updated Name',
      });
    });

    it('should invalidate user query on success', async () => {
      const mockUser = { id: 1, full_name: 'Updated Name' };
      (api.updateProfile as any).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useUpdateProfileMutation(), {
        wrapper: createWrapper,
      });

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      await result.current.mutateAsync({
        full_name: 'Updated Name',
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['user'],
        });
      });
    });
  });
});
