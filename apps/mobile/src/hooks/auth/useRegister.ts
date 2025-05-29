import { useMutation } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import type { RegisterCredentials } from '../../types';

export const useRegister = () => {
  const authStore = useAuth();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => authStore.register(credentials),
    onError: (error: Error) => {
      // Error will be handled by the calling component
    },
  });
}; 