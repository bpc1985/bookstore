import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLoginMutation, useRegisterMutation } from '@/lib/hooks/use-auth';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

vi.mock('@/stores/auth');
vi.mock('@/lib/api');

const createWrapper = function({ children }: { children: React.ReactNode }) {
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

let queryClient: QueryClient;
let mockLogin: any;
let mockRegister: any;

describe('use-auth hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    });
    mockLogin = vi.fn().mockResolvedValue(undefined);
    mockRegister = vi.fn().mockResolvedValue(undefined);
    (useAuthStore as any).mockReturnValue({
      login: mockLogin,
      register: mockRegister,
    });
  });

  describe('useLoginMutation', () => {
    it('should call login with correct parameters', async () => {
      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: createWrapper,
      });

      await result.current.mutateAsync({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockLogin).toHaveBeenCalledWith(
        api,
        'test@example.com',
        'password123'
      );
    });

    it('should handle login errors', async () => {
      mockLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
      (useAuthStore as any).mockReturnValue({
        login: mockLogin,
      });

      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: createWrapper,
      });

      await expect(
        result.current.mutateAsync({
          email: 'test@example.com',
          password: 'wrong',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('useRegisterMutation', () => {
    it('should call register with correct parameters', async () => {
      const { result } = renderHook(() => useRegisterMutation(), {
        wrapper: createWrapper,
      });

      await result.current.mutateAsync({
        email: 'new@example.com',
        password: 'password123',
        fullName: 'New User',
      });

      expect(mockRegister).toHaveBeenCalledWith(
        api,
        'new@example.com',
        'password123',
        'New User'
      );
    });

    it('should handle registration errors', async () => {
      mockRegister = vi.fn().mockRejectedValue(
        new Error('Email already exists')
      );
      (useAuthStore as any).mockReturnValue({
        register: mockRegister,
      });

      const { result } = renderHook(() => useRegisterMutation(), {
        wrapper: createWrapper,
      });

      await expect(
        result.current.mutateAsync({
          email: 'existing@example.com',
          password: 'password123',
          fullName: 'Existing User',
        })
      ).rejects.toThrow('Email already exists');
    });
  });
});
