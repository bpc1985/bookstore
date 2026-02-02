import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5, 'Rating must be between 1 and 5'),
  comment: z.string(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
