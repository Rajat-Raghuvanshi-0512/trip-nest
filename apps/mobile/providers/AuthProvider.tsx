import React, { ReactNode } from 'react';
import { useAuthCheck } from '../src/hooks/auth/useAuthCheck';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Just initialize auth, don't handle loading UI here
  useAuthCheck();

  return <>{children}</>;
}; 