export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://192.168.29.85:3000/api/v1'  // Use local IP for Expo Go
    : 'https://your-production-api.com/api/v1',
  TIMEOUT: 10000,
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
} as const;

export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please provide a valid email address',
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    MESSAGE: 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
    MESSAGE: 'Username can only contain letters, numbers, underscores, and hyphens',
  },
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    MESSAGE: 'Name must be between 1 and 50 characters',
  },
} as const; 