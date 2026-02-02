import { describe, it, expect } from 'vitest';
import {
  bookSchema,
  type BookInput,
} from '@/lib/schemas/book';

describe('book schemas', () => {
  describe('bookSchema', () => {
    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        author: 'Test Author',
        price: '29.99',
        stock_quantity: '10',
      };

      const result = bookSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required');
      }
    });

    it('should reject empty author', () => {
      const invalidData = {
        title: 'Test Book',
        author: '',
        price: '29.99',
        stock_quantity: '10',
      };

      const result = bookSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required');
      }
    });
  });
});
