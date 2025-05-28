import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { CryptoService } from '../../common/services/crypto.service';
import { JwtService, TokenPair } from '../../common/services/jwt.service';
import { AuditService } from '../../common/services/audit.service';
import { RegisterDto, LoginDto } from '../../api/v1/auth/dto';

export interface AuthResponse {
  user: Omit<
    User,
    'passwordHash' | 'emailVerificationToken' | 'passwordResetToken'
  >;
  tokens: TokenPair;
}

export interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class UserService {
  private readonly maxFailedAttempts = 5;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutes

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private cryptoService: CryptoService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async register(
    registerDto: RegisterDto,
    context: LoginContext = {},
  ): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email: registerDto.email }, { username: registerDto.username }],
    });

    if (existingUser) {
      const field =
        existingUser.email === registerDto.email ? 'email' : 'username';
      throw new ConflictException(`User with this ${field} already exists`);
    }

    // Hash password
    const passwordHash = await this.cryptoService.hashPassword(
      registerDto.password,
    );

    // Generate email verification token
    const emailVerificationToken =
      this.cryptoService.generateEmailVerificationToken();
    const emailVerificationTokenExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ); // 24 hours

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      username: registerDto.username,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      passwordHash,
      emailVerificationToken,
      emailVerificationTokenExpires,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate tokens
    const tokens = this.jwtService.generateTokenPair({
      sub: savedUser.id,
      email: savedUser.email,
      username: savedUser.username,
    });

    // Save refresh token
    await this.saveRefreshToken(savedUser.id, tokens.refreshToken, context);

    // Log registration
    await this.auditService.logRegister(savedUser.id, {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      details: `User registered with email: ${savedUser.email}`,
    });

    return {
      user: this.sanitizeUser(savedUser),
      tokens,
    };
  }

  async login(
    loginDto: LoginDto,
    context: LoginContext = {},
  ): Promise<AuthResponse> {
    // Find user by email or username
    const user = await this.userRepository.findOne({
      where: [
        { email: loginDto.emailOrUsername },
        { username: loginDto.emailOrUsername },
      ],
    });

    if (!user) {
      await this.auditService.logLoginFailure({
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        details: `Login attempt with invalid identifier: ${loginDto.emailOrUsername}`,
        errorMessage: 'User not found',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked) {
      await this.auditService.logLoginFailure({
        userId: user.id,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        details: 'Login attempt on locked account',
        errorMessage: 'Account locked',
      });
      throw new UnauthorizedException(
        'Account is temporarily locked due to too many failed attempts',
      );
    }

    // Check if account is active
    if (!user.isActive) {
      await this.auditService.logLoginFailure({
        userId: user.id,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        details: 'Login attempt on inactive account',
        errorMessage: 'Account inactive',
      });
      throw new UnauthorizedException('Account is not active');
    }

    // Verify password
    const isPasswordValid = await this.cryptoService.comparePassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      await this.handleFailedLogin(user, context);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await this.userRepository.update(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: undefined,
      });
    }

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Generate tokens
    const tokens = this.jwtService.generateTokenPair({
      sub: user.id,
      email: user.email,
      username: user.username,
    });

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken, context);

    // Log successful login
    await this.auditService.logLoginSuccess(user.id, {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      details: 'Successful login',
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refreshTokens(
    refreshToken: string,
    context: LoginContext = {},
  ): Promise<TokenPair> {
    // Verify refresh token
    const payload = this.jwtService.verifyRefreshToken(refreshToken);

    // Find refresh token in database
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, userId: payload.sub },
      relations: ['user'],
    });

    if (!storedToken || !storedToken.isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new token pair
    const newTokens = this.jwtService.generateTokenPair({
      sub: payload.sub,
      email: payload.email,
      username: payload.username,
    });

    // Revoke old refresh token
    await this.refreshTokenRepository.update(storedToken.id, {
      isRevoked: true,
    });

    // Save new refresh token
    await this.saveRefreshToken(payload.sub, newTokens.refreshToken, context);

    return newTokens;
  }

  async logout(
    refreshToken: string,
    userId: string,
    context: LoginContext = {},
  ): Promise<void> {
    // Revoke refresh token
    await this.refreshTokenRepository.update(
      { token: refreshToken, userId },
      { isRevoked: true },
    );

    // Log logout
    await this.auditService.logLogout(userId, {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      details: 'User logout',
    });
  }

  async logoutAllDevices(
    userId: string,
    context: LoginContext = {},
  ): Promise<void> {
    // Revoke all refresh tokens for user
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );

    // Log logout all devices
    await this.auditService.logLogout(userId, {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      details: 'Logout from all devices',
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  private async handleFailedLogin(
    user: User,
    context: LoginContext,
  ): Promise<void> {
    const newFailedAttempts = user.failedLoginAttempts + 1;
    const updateData: Partial<User> = {
      failedLoginAttempts: newFailedAttempts,
    };

    // Lock account if max attempts reached
    if (newFailedAttempts >= this.maxFailedAttempts) {
      updateData.lockedUntil = new Date(Date.now() + this.lockoutDuration);

      await this.auditService.logAccountLocked(user.id, {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        details: `Account locked after ${this.maxFailedAttempts} failed attempts`,
      });
    }

    await this.userRepository.update(user.id, updateData);

    // Log failed attempt
    await this.auditService.logLoginFailure({
      userId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      details: `Failed login attempt ${newFailedAttempts}/${this.maxFailedAttempts}`,
      errorMessage: 'Invalid password',
    });
  }

  private async saveRefreshToken(
    userId: string,
    token: string,
    context: LoginContext,
  ): Promise<void> {
    const expiresAt = this.jwtService.getTokenExpiry(token);
    if (!expiresAt) {
      throw new BadRequestException('Invalid refresh token');
    }

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      deviceInfo: context.userAgent,
      ipAddress: context.ipAddress,
    });

    await this.refreshTokenRepository.save(refreshToken);
  }

  private sanitizeUser(
    user: User,
  ): Omit<
    User,
    'passwordHash' | 'emailVerificationToken' | 'passwordResetToken'
  > {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      passwordHash: _passwordHash,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      emailVerificationToken: _emailVerificationToken,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      passwordResetToken: _passwordResetToken,
      ...sanitized
    } = user;
    return sanitized as Omit<
      User,
      'passwordHash' | 'emailVerificationToken' | 'passwordResetToken'
    >;
  }
}
