import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateBookMutation, useUpdateBookMutation } from '@/lib/hooks/use-books';
import { api } from '@/lib/api';
import type { Book } from '@bookstore/types';

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    createBook: vi.fn(),
    updateBook: vi.fn(),
  },
}));

const mockBook: Book = {
  id: 1,
  title: 'New Book',
  author: 'New Author',
  description: 'New description',
  price: 29.99,
  stock_quantity: 10,
  cover_image: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('use-books hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
        queries: {
          retry: false,
        },
      },
    });
  });

  const createWrapper = () => {
    return function({ children }: { children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
  };

  describe('useCreateBookMutation', () => {
    it('should create book successfully', async () => {
      (api.createBook as any).mockResolvedValue(mockBook);

      const { result } = renderHook(() => useCreateBookMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        title: 'New Book',
        author: 'New Author',
        price: 29.99,
        stock_quantity: '10',
      });

      expect(api.createBook).toHaveBeenCalledWith({
        title: 'New Book',
        author: 'New Author',
        description: undefined,
        isbn: undefined,
        price: 29.99,
        stock_quantity: 10,
        cover_image: undefined,
        category_ids: undefined,
      });

      await waitFor(() => {
        expect(queryClient.isMutating()).toBe(0);
      });
    });

    it('should parse stock_quantity to int', async () => {
      (api.createBook as any).mockResolvedValue(mockBook);

      const { result } = renderHook(() => useCreateBookMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        title: 'New Book',
        author: 'New Author',
        price: 29.99,
        stock_quantity: '10', // String input
      });

      expect(api.createBook).toHaveBeenCalledWith(
        expect.objectContaining({
          stock_quantity: 10, // Should be parsed as number
        })
      );
    });

    it('should invalidate queries on success', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      (api.createBook as any).mockResolvedValue(mockBook);

      const { result } = renderHook(() => useCreateBookMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        title: 'New Book',
        author: 'New Author',
        price: 29.99,
        stock_quantity: '10',
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['books'] });
      });
    });

    it('should handle creation error', async () => {
      const error = new Error('Failed to create book');
      (api.createBook as any).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateBookMutation(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          title: 'New Book',
          author: 'New Author',
          price: 29.99,
          stock_quantity: '10',
        })
      ).rejects.toThrow('Failed to create book');
    });
  });

  describe('useUpdateBookMutation', () => {
    it('should update book successfully', async () => {
      (api.updateBook as any).mockResolvedValue(mockBook);

      const { result } = renderHook(() => useUpdateBookMutation(1), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        title: 'Updated Book',
        price: 39.99,
        stock_quantity: '15',
      });

      expect(api.updateBook).toHaveBeenCalledWith(1, {
        title: 'Updated Book',
        author: undefined,
        description: undefined,
        isbn: undefined,
        price: 39.99,
        stock_quantity: 15,
        cover_image: undefined,
        category_ids: undefined,
      });
    });

    it('should parse stock_quantity to int', async () => {
      (api.updateBook as any).mockResolvedValue(mockBook);

      const { result } = renderHook(() => useUpdateBookMutation(1), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        title: 'Updated Book',
        price: 39.99,
        stock_quantity: '15', // String input
      });

      expect(api.updateBook).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          stock_quantity: 15, // Should be parsed as number
        })
      );
    });

    it('should invalidate queries on success', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      (api.updateBook as any).mockResolvedValue(mockBook);

      const { result } = renderHook(() => useUpdateBookMutation(1), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        title: 'Updated Book',
        price: 39.99,
        stock_quantity: '15',
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['books'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['book', 1] });
      });
    });

    it('should handle update error', async () => {
      const error = new Error('Failed to update book');
      (api.updateBook as any).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateBookMutation(1), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          title: 'Updated Book',
          price: 39.99,
          stock_quantity: '15',
        })
      ).rejects.toThrow('Failed to update book');
    });
  });

  describe('mutation state', () => {
    it('should track pending state', async () => {
      let resolveMutation: (value: Book) => void;
      (api.createBook as any).mockImplementation(
        () => new Promise((resolve) => {
          resolveMutation = resolve;
        })
      );

      const { result } = renderHook(() => useCreateBookMutation(), {
        wrapper: createWrapper(),
      });

      // Start mutation
      const mutationPromise = result.current.mutateAsync({
        title: 'New Book',
        author: 'New Author',
        price: 29.99,
        stock_quantity: '10',
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Resolve mutation
      await waitFor(async () => {
        resolveMutation!(mockBook);
        await mutationPromise;
      });
    });

    it('should track success state', async () => {
      (api.createBook as any).mockResolvedValue(mockBook);

      const { result } = renderHook(() => useCreateBookMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        title: 'New Book',
        author: 'New Author',
        price: 29.99,
        stock_quantity: '10',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should track error state', async () => {
      const error = new Error('Failed to create book');
      (api.createBook as any).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateBookMutation(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mutateAsync({
          title: 'New Book',
          author: 'New Author',
          price: 29.99,
          stock_quantity: '10',
        });
      } catch (e) {
        // Expected error
      }

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(error);
      });
    });
  });
});
