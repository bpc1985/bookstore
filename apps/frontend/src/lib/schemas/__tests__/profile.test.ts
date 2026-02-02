import { describe, it, expect } from 'vitest';
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from '@/lib/schemas/profile';

describe('profile schemas', () => {
  describe('profileUpdateSchema', () => {
    it('should validate valid profile update', () => {
      const validData: ProfileUpdateInput = {
        full_name: 'Updated Name',
      };

      const result = profileUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject empty full name', () => {
      const invalidData = {
        full_name: '',
      };

      const result = profileUpdateSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Full name is required');
      }
    });

    it('should accept whitespace-only full name', () => {
      const validData = {
        full_name: '  John Doe  ',
      };

      const result = profileUpdateSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });
});
