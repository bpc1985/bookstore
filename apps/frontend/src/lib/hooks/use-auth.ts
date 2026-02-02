import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import type { LoginInput, RegisterInput } from '@/lib/schemas';

export function useLoginMutation() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      await login(api, data.email, data.password);
    },
  });
}

export function useRegisterMutation() {
  const { register } = useAuthStore();

  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      await register(api, data.email, data.password, data.fullName);
    },
  });
}
