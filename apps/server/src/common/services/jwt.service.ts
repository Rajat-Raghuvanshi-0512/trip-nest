import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class JwtService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor(private configService: ConfigService) {
    this.accessTokenSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') || 'access-secret';
    this.refreshTokenSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret';
    this.accessTokenExpiry =
      this.configService.get<string>('JWT_ACCESS_EXPIRY') || '15m';
    this.refreshTokenExpiry =
      this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d';
  }

  generateTokenPair(
    payload: Omit<JwtPayload, 'type' | 'iat' | 'exp'>,
  ): TokenPair {
    const accessTokenPayload: JwtPayload = { ...payload, type: 'access' };
    const refreshTokenPayload: JwtPayload = { ...payload, type: 'refresh' };

    const accessToken = jwt.sign(accessTokenPayload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    });

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiry,
      },
    );

    // Calculate expiry time for access token
    const decoded = jwt.decode(accessToken) as jwt.JwtPayload;
    const expiresIn = decoded.exp! - Math.floor(Date.now() / 1000);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret) as JwtPayload;
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch {
      throw new Error('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret) as JwtPayload;
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  }

  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  getTokenExpiry(token: string): Date | null {
    const decoded = this.decode(token);
    if (!decoded?.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  }
}
