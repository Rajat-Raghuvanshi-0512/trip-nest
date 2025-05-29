import { useMutation } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export const useLogout = () => {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: logout,
    onError: (error: Error) => {
      // Error will be handled by the calling component if needed
    },
  });
};

export const useLogoutAllDevices = () => {
  const { logoutAllDevices } = useAuth();

  return useMutation({
    mutationFn: logoutAllDevices,
    onError: (error: Error) => {
      // Error will be handled by the calling component if needed
    },
  });
}; 