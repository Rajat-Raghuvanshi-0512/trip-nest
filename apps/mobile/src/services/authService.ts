import { apiService } from './api';
import { AUTH_ENDPOINTS } from '../utils/constants';
import type { 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResponse, 
  User, 
  TokenPair,
  ApiResponse 
} from '../types';

class AuthService {
  // Test connection to the server
  async testConnection(): Promise<boolean> {
    try {
      // Try a simple GET request (you can create a test endpoint or use existing one)
      const response = await apiService.get('/auth/me');
      return true;
    } catch (error: any) {
      return false;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      AUTH_ENDPOINTS.LOGIN, 
      credentials
    );
    return response;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      AUTH_ENDPOINTS.REGISTER, 
      credentials
    );
    return response;
  }

  async logout(refreshToken: string): Promise<void> {
    await apiService.post(AUTH_ENDPOINTS.LOGOUT, { refreshToken });
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const response = await apiService.post<ApiResponse<TokenPair>>(
      AUTH_ENDPOINTS.REFRESH, 
      { refreshToken }
    );
    
    if (response.tokens) {
      return response.tokens;
    }
    if (response.data) {
      return response.data;
    }
    // Let the API service handle the error response
    throw new Error('Unable to refresh tokens');
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiService.get<ApiResponse<User>>(AUTH_ENDPOINTS.ME);
    
    if (response.user) {
      return response.user;
    }
    if (response.data) {
      return response.data;
    }
    // Let the API service handle the error response
    throw new Error('Unable to get user information');
  }

  async logoutAllDevices(): Promise<void> {
    await apiService.post('/auth/logout-all');
  }

  // Verify if the user is authenticated by checking with server
  async verifyAuth(): Promise<User | null> {
    try {
      const user = await this.getCurrentUser();
      return user;
    } catch (error) {
      // If verification fails, user is not authenticated
      return null;
    }
  }
}

export const authService = new AuthService(); 