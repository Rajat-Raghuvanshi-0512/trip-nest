// src/app/v1/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import {
  UserService,
  AuthResponse,
  LoginContext,
} from '../../../models/user/user.service';
import { RegisterDto, LoginDto } from './dto';
import { TokenPair } from '../../../common/services/jwt.service';

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async register(
    registerDto: RegisterDto,
    context: LoginContext,
  ): Promise<AuthResponse> {
    return this.userService.register(registerDto, context);
  }

  async login(
    loginDto: LoginDto,
    context: LoginContext,
  ): Promise<AuthResponse> {
    return this.userService.login(loginDto, context);
  }

  async refreshTokens(
    refreshToken: string,
    context: LoginContext,
  ): Promise<TokenPair> {
    return this.userService.refreshTokens(refreshToken, context);
  }

  async logout(
    refreshToken: string,
    userId: string,
    context: LoginContext,
  ): Promise<void> {
    return this.userService.logout(refreshToken, userId, context);
  }

  async logoutAllDevices(userId: string, context: LoginContext): Promise<void> {
    return this.userService.logoutAllDevices(userId, context);
  }
}
