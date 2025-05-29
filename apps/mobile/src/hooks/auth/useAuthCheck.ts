import { useEffect } from 'react';
import { useAuth } from './useAuth';

export const useAuthCheck = () => {
  const { initialize, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return { isInitialized };
}; 