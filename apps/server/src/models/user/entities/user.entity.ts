import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ unique: true })
  @Index()
  username: string;

  @Column()
  @Exclude()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken: string;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationTokenExpires: Date;

  @Column({ nullable: true })
  @Exclude()
  passwordResetToken: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetTokenExpires: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual property for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Check if account is locked
  get isLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  // Check if email verification token is valid
  isEmailVerificationTokenValid(token: string): boolean {
    return (
      this.emailVerificationToken === token &&
      this.emailVerificationTokenExpires &&
      this.emailVerificationTokenExpires > new Date()
    );
  }

  // Check if password reset token is valid
  isPasswordResetTokenValid(token: string): boolean {
    return (
      this.passwordResetToken === token &&
      this.passwordResetTokenExpires &&
      this.passwordResetTokenExpires > new Date()
    );
  }
}
