import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from './services/jwt.service';
import { CryptoService } from './services/crypto.service';
import { AuditService } from './services/audit.service';
import { AuditLog } from '../models/user/entities/audit-log.entity';

@Global()
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([AuditLog])],
  providers: [JwtService, CryptoService, AuditService],
  exports: [JwtService, CryptoService, AuditService],
})
export class CommonModule {}
