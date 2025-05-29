import { useAuthStore } from '../../stores/authStore';

export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    // State
    user: store.user,
    tokens: store.tokens,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    isInitialized: store.isInitialized,
    
    // Actions
    login: store.login,
    register: store.register,
    logout: store.logout,
    logoutAllDevices: store.logoutAllDevices,
    refreshTokens: store.refreshTokens,
    checkAuth: store.checkAuth,
    initialize: store.initialize,
    setUser: store.setUser,
    setTokens: store.setTokens,
    setLoading: store.setLoading,
    clearAuth: store.clearAuth,
  };
}; 