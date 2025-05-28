import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class CryptoService {
  private readonly saltRounds = 12;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  generateEmailVerificationToken(): string {
    return this.generateSecureToken(32);
  }

  generatePasswordResetToken(): string {
    return this.generateSecureToken(32);
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  generateRefreshTokenId(): string {
    return randomBytes(16).toString('hex');
  }

  isStrongPassword(password: string): boolean {
    const minLength = 8;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    return (
      password.length >= minLength &&
      hasLowercase &&
      hasUppercase &&
      hasNumber &&
      hasSpecialChar
    );
  }
}
