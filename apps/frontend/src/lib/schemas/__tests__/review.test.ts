import { describe, it, expect } from 'vitest';
import {
  reviewSchema,
  type ReviewInput,
} from '@/lib/schemas/review';

describe('review schemas', () => {
  describe('reviewSchema', () => {
    it('should validate valid review with comment', () => {
      const validData: ReviewInput = {
        rating: 5,
        comment: 'Great book!',
      };

      const result = reviewSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should validate valid review without comment', () => {
      const validData: ReviewInput = {
        rating: 4,
        comment: '',
      };

      const result = reviewSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject rating below 1', () => {
      const invalidData = {
        rating: 0,
        comment: 'Test',
      };

      const result = reviewSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject rating above 5', () => {
      const invalidData = {
        rating: 6,
        comment: 'Test',
      };

      const result = reviewSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });
});
