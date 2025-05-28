import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditLog,
  AuditAction,
} from '../../models/user/entities/audit-log.entity';

export interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  success?: boolean;
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(action: AuditAction, context: AuditContext = {}): Promise<void> {
    try {
      const auditLog = new AuditLog();
      auditLog.action = action;
      auditLog.userId = context.userId || null;
      auditLog.ipAddress = context.ipAddress || null;
      auditLog.userAgent = context.userAgent || null;
      auditLog.details = context.details || null;
      auditLog.success = context.success !== undefined ? context.success : true;
      auditLog.errorMessage = context.errorMessage || null;

      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Log audit failures separately - don't throw to avoid breaking main flow
      console.error('Failed to create audit log:', error);
    }
  }

  async logLoginSuccess(userId: string, context: Omit<AuditContext, 'userId'>) {
    await this.log(AuditAction.LOGIN_SUCCESS, {
      ...context,
      userId,
      success: true,
    });
  }

  async logLoginFailure(context: AuditContext) {
    await this.log(AuditAction.LOGIN_FAILED, { ...context, success: false });
  }

  async logRegister(userId: string, context: Omit<AuditContext, 'userId'>) {
    await this.log(AuditAction.REGISTER, { ...context, userId, success: true });
  }

  async logLogout(userId: string, context: Omit<AuditContext, 'userId'>) {
    await this.log(AuditAction.LOGOUT, { ...context, userId, success: true });
  }

  async logPasswordChange(
    userId: string,
    context: Omit<AuditContext, 'userId'>,
  ) {
    await this.log(AuditAction.PASSWORD_CHANGED, {
      ...context,
      userId,
      success: true,
    });
  }

  async logAccountLocked(
    userId: string,
    context: Omit<AuditContext, 'userId'>,
  ) {
    await this.log(AuditAction.ACCOUNT_LOCKED, {
      ...context,
      userId,
      success: true,
    });
  }

  async logSuspiciousActivity(context: AuditContext) {
    await this.log(AuditAction.SUSPICIOUS_ACTIVITY, {
      ...context,
      success: false,
    });
  }

  async getRecentActivityForUser(
    userId: string,
    limit: number = 10,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
