import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  ValidationPipe,
  UsePipes,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { Public } from '../../../common/decorators/public.decorator';
import { User, RequestUser } from '../../../common/decorators/user.decorator';
import { LoginContext } from '../../../models/user/user.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private extractContext(req: Request): LoginContext {
    return {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    const context = this.extractContext(req);
    const result = await this.authService.register(registerDto, context);

    return {
      message: 'Registration successful',
      user: result.user,
      tokens: result.tokens,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const context = this.extractContext(req);
    const result = await this.authService.login(loginDto, context);

    return {
      message: 'Login successful',
      user: result.user,
      tokens: result.tokens,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Body('refreshToken') refreshToken: string,
    @Req() req: Request,
  ) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const context = this.extractContext(req);
    const tokens = await this.authService.refreshTokens(refreshToken, context);

    return {
      message: 'Tokens refreshed successfully',
      tokens,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body('refreshToken') refreshToken: string,
    @User() user: RequestUser,
    @Req() req: Request,
  ) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const context = this.extractContext(req);
    await this.authService.logout(refreshToken, user.userId, context);

    return {
      message: 'Logout successful',
    };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAllDevices(@User() user: RequestUser, @Req() req: Request) {
    const context = this.extractContext(req);
    await this.authService.logoutAllDevices(user.userId, context);

    return {
      message: 'Logged out from all devices successfully',
    };
  }

  @Get('me')
  getCurrentUser(@User() user: RequestUser) {
    return {
      message: 'User retrieved successfully',
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
      },
    };
  }
}
