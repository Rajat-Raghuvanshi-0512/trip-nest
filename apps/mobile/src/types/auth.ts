export interface User {
  userId: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  emailVerified?: boolean;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: TokenPair;
}

export interface AuthState {
  user: User | null;
  tokens: TokenPair | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  error: string | null;
}

export interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
} 