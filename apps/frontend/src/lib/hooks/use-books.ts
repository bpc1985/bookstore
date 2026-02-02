import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BookInput } from '@/lib/schemas';

export function useCreateBookMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BookInput) => {
      return api.createBook({
        title: data.title,
        author: data.author,
        description: data.description || undefined,
        isbn: data.isbn,
        price: data.price,
        stock_quantity: parseInt(data.stock_quantity),
        cover_image: data.cover_image || undefined,
        category_ids: data.category_ids,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

export function useUpdateBookMutation(bookId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BookInput) => {
      return api.updateBook(bookId, {
        title: data.title,
        author: data.author,
        description: data.description || undefined,
        isbn: data.isbn,
        price: data.price,
        stock_quantity: parseInt(data.stock_quantity),
        cover_image: data.cover_image || undefined,
        category_ids: data.category_ids,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
    },
  });
}
