import { useMutation } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import type { LoginCredentials } from '../../types';

export const useLogin = () => {
  const authStore = useAuth();

  return useMutation({
    mutationFn: authStore.login,
    onError: (error: Error) => {
      // Error will be handled by the calling component
    },
  });
}; 