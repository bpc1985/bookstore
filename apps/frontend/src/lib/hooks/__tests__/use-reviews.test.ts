import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateReviewMutation } from '@/lib/hooks/use-reviews';
import { api } from '@/lib/api';

vi.mock('@/lib/api');

const createWrapper = function({ children }: { children: React.ReactNode }) {
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

let queryClient: QueryClient;

describe('use-reviews hooks', () => {
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

  describe('useCreateReviewMutation', () => {
    it('should call createReview with rating and comment', async () => {
      const mockReview = { id: 1, rating: 5, comment: 'Great book' };
      (api.createReview as any).mockResolvedValue(mockReview);

      const { result } = renderHook(() => useCreateReviewMutation(123), {
        wrapper: createWrapper,
      });

      await result.current.mutateAsync({
        rating: 5,
        comment: 'Great book',
      });

      expect(api.createReview).toHaveBeenCalledWith(123, {
        rating: 5,
        comment: 'Great book',
      });
    });

    it('should call createReview with rating only', async () => {
      const mockReview = { id: 1, rating: 4, comment: '' };
      (api.createReview as any).mockResolvedValue(mockReview);

      const { result } = renderHook(() => useCreateReviewMutation(123), {
        wrapper: createWrapper,
      });

      await result.current.mutateAsync({ rating: 4 });

      expect(api.createReview).toHaveBeenCalledWith(123, {
        rating: 4,
        comment: undefined,
      });
    });

    it('should invalidate book and reviews queries on success', async () => {
      const mockReview = { id: 1, rating: 5, comment: 'Great book' };
      (api.createReview as any).mockResolvedValue(mockReview);

      const { result } = renderHook(() => useCreateReviewMutation(123), {
        wrapper: createWrapper,
      });

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      await result.current.mutateAsync({
        rating: 5,
        comment: 'Great book',
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['book', 123],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['reviews', 123],
        });
      });
    });
  });
});
