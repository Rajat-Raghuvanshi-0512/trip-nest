import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { V1Module } from './api/v1/v1.module';
import { CommonModule } from './common/common.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { User } from './models/user/entities/user.entity';
import { RefreshToken } from './models/user/entities/refresh-token.entity';
import { AuditLog } from './models/user/entities/audit-log.entity';
import { Group } from './models/group/entities/group.entity';
import { GroupMember } from './models/group/entities/group-member.entity';
import { GroupInvite } from './models/group/entities/group-invite.entity';
import { GroupJoinRequest } from './models/group/entities/group-join-request.entity';
import { GroupMedia } from './models/group/entities/group-media.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'trip-nest',
      entities: [
        User,
        RefreshToken,
        AuditLog,
        Group,
        GroupMember,
        GroupInvite,
        GroupJoinRequest,
        GroupMedia,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    CommonModule,
    V1Module,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
