import { describe, it, expect } from 'vitest';
import {
  shippingAddressSchema,
  type ShippingAddressInput,
} from '@/lib/schemas/checkout';

describe('checkout schemas', () => {
  describe('shippingAddressSchema', () => {
    it('should validate valid shipping address', () => {
      const validData: ShippingAddressInput = {
        fullName: 'John Doe',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      };

      const result = shippingAddressSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject empty full name', () => {
      const invalidData = {
        fullName: '',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      };

      const result = shippingAddressSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Full name is required');
      }
    });

    it('should reject empty address', () => {
      const invalidData = {
        fullName: 'John Doe',
        address: '',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      };

      const result = shippingAddressSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Address is required');
      }
    });

    it('should reject empty city', () => {
      const invalidData = {
        fullName: 'John Doe',
        address: '123 Main St',
        city: '',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      };

      const result = shippingAddressSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('City is required');
      }
    });

    it('should reject empty state', () => {
      const invalidData = {
        fullName: 'John Doe',
        address: '123 Main St',
        city: 'New York',
        state: '',
        zipCode: '10001',
        country: 'USA',
      };

      const result = shippingAddressSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('State is required');
      }
    });

    it('should reject empty ZIP code', () => {
      const invalidData = {
        fullName: 'John Doe',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '',
        country: 'USA',
      };

      const result = shippingAddressSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('ZIP code is required');
      }
    });

    it('should reject empty country', () => {
      const invalidData = {
        fullName: 'John Doe',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: '',
      };

      const result = shippingAddressSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Country is required');
      }
    });
  });
});
