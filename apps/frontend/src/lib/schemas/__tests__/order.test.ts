import { describe, it, expect } from 'vitest';
import {
  orderStatusSchema,
  type OrderStatusInput,
} from '@/lib/schemas/order';

describe('order schemas', () => {
  describe('orderStatusSchema', () => {
    it('should validate valid order status', () => {
      const validData: OrderStatusInput = {
        status: 'shipped',
        note: 'Package shipped',
      };

      const result = orderStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid-status',
        note: 'Test',
      };

      const result = orderStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('enum');
      }
    });

    it('should accept empty note (optional)', () => {
      const validData: OrderStatusInput = {
        status: 'shipped',
        note: '',
      };

      const result = orderStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject missing status', () => {
      const invalidData = {
        status: undefined as any,
        note: 'Test',
      };

      const result = orderStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });
});
