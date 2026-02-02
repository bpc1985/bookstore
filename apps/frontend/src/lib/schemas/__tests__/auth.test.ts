import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from '@/lib/schemas/auth';

describe('auth schemas', () => {
  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData: LoginInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required');
      }
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required');
      }
    });
  });

  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData: RegisterInput = {
        fullName: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject empty full name', () => {
      const invalidData = {
        fullName: '',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required');
      }
    });

    it('should reject empty email', () => {
      const invalidData = {
        fullName: 'John Doe',
        email: '',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('required');
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        fullName: 'John Doe',
        email: 'notanemail',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Invalid');
      }
    });
  });
});
