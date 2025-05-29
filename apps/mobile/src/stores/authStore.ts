import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authService } from "../services/authService";
import { storageService } from "../utils/storage";
import type {
  AuthState,
  User,
  TokenPair,
  LoginCredentials,
  RegisterCredentials,
} from "../types";

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (credentials: RegisterCredentials) => Promise<User>;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  checkAuth: () => Promise<void>;
  initialize: () => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (tokens: TokenPair) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state - ensure user starts as unauthenticated
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false, // Explicitly false
      isInitialized: false,
      error: null,

      // Actions
      login: async (credentials: LoginCredentials): Promise<User> => {
        try {
          set({ isLoading: true, error: null });

          const authResponse = await authService.login(credentials);

          // Store tokens securely
          await storageService.setTokens(authResponse.tokens);
          await storageService.setUser(authResponse.user);

          // Update state
          set({
            user: authResponse.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return authResponse.user;
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message,
            isAuthenticated: false,
            user: null,
          });
          throw error; // Pass through the backend error
        }
      },

      register: async (credentials: RegisterCredentials): Promise<User> => {
        try {
          set({ isLoading: true, error: null });

          const authResponse = await authService.register(credentials);

          // Store tokens securely
          await storageService.setTokens(authResponse.tokens);
          await storageService.setUser(authResponse.user);

          // Update state
          set({
            user: authResponse.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return authResponse.user;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message,
            isAuthenticated: false,
            user: null,
          });
          throw error; // Pass through the backend error
        }
      },

      logout: async () => {
        try {
          const { tokens } = get();

          if (tokens?.refreshToken) {
            // Notify server about logout
            await authService.logout(tokens.refreshToken);
          }
        } catch (error) {
          console.warn("Failed to logout from server:", error);
        } finally {
          // Clear local storage and state regardless of server response
          await storageService.clearAll();
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      logoutAllDevices: async () => {
        try {
          await authService.logoutAllDevices();
        } catch (error) {
          console.warn("Failed to logout from all devices:", error);
        } finally {
          // Clear local storage and state
          await storageService.clearAll();
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      refreshTokens: async () => {
        try {
          const storedTokens = await storageService.getTokens();

          if (!storedTokens?.refreshToken) {
            // Let the API service handle the error response
            throw new Error('No refresh token');
          }

          const newTokens = await authService.refreshTokens(
            storedTokens.refreshToken
          );

          // Store new tokens
          await storageService.setTokens(newTokens);

          set({
            tokens: newTokens,
          });
        } catch (error) {
          // Refresh failed, clear auth state
          await get().logout();
          throw error;
        }
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true });

          const user = await authService.verifyAuth();

          if (user) {
            // Update user data
            await storageService.setUser(user);
            set({
              user,
              isAuthenticated: true,
            });
          } else {
            // Auth verification failed
            await get().logout();
          }
        } catch (error) {
          // Auth check failed
          await get().logout();
        } finally {
          set({ isLoading: false });
        }
      },

      initialize: async () => {
        try {
          set({ isLoading: true });

          // Check if we have stored credentials
          const hasCredentials = await storageService.hasStoredCredentials();

          if (hasCredentials) {
            const [storedTokens, storedUser] = await Promise.all([
              storageService.getTokens(),
              storageService.getUser(),
            ]);

            if (storedTokens && storedUser) {
              // Set tokens and user but don't set isAuthenticated yet
              set({
                user: storedUser,
                tokens: storedTokens,
                // Don't set isAuthenticated: true here - wait for server verification
              });

              // Verify with server immediately (not in background)
              try {
                const verifiedUser = await authService.verifyAuth();
                if (verifiedUser) {
                  // Server verification successful
                  await storageService.setUser(verifiedUser);
                  set({
                    user: verifiedUser,
                    isAuthenticated: true,
                  });
                } else {
                  // Server verification failed
                  await get().logout();
                }
              } catch (error) {
                // Server verification failed
                console.warn(
                  "Auth verification failed during initialization:",
                  error
                );
                await get().logout();
              }
            }
          }
        } catch (error) {
          console.warn("Failed to initialize auth:", error);
          await get().logout();
        } finally {
          set({
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      // Utility actions
      setUser: (user: User) => {
        set({ user });
        storageService.setUser(user);
      },

      setTokens: (tokens: TokenPair) => {
        set({ tokens });
        storageService.setTokens(tokens);
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      clearAuth: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        });
        storageService.clearAll();
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          // Don't persist tokens in zustand, use secure storage instead
          return null;
        },
        setItem: async (name, value) => {
          // Don't persist sensitive data
        },
        removeItem: async (name) => {
          // Handle removal if needed
        },
      })),
      partialize: (state) => ({
        // Only persist non-sensitive data
        isInitialized: state.isInitialized,
      }),
    }
  )
);
