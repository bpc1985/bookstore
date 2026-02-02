import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ReviewInput } from '@/lib/schemas';

export function useCreateReviewMutation(bookId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReviewInput) => {
      return api.createReview(bookId, {
        rating: data.rating,
        comment: data.comment || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', bookId] });
    },
  });
}
