import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import type { Group } from './group.entity';

export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

@Entity('group_invites')
export class GroupInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  groupId: string;

  @Column({ type: 'uuid' })
  invitedById: string;

  @Column({ type: 'uuid', nullable: true })
  invitedUserId: string;

  @Column({ nullable: true })
  email: string;

  @Column({ unique: true })
  @Index()
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({
    type: 'enum',
    enum: InviteStatus,
    default: InviteStatus.PENDING,
  })
  status: InviteStatus;

  @ManyToOne('Group', 'invites', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'invitedById' })
  invitedBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invitedUserId' })
  invitedUser: User;

  @CreateDateColumn()
  createdAt: Date;

  // Check if invite is still valid
  get isValid(): boolean {
    return this.status === InviteStatus.PENDING && this.expiresAt > new Date();
  }

  // Check if invite has expired
  get isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  // Mark invite as expired if needed
  checkAndMarkExpired(): boolean {
    if (this.isExpired && this.status === InviteStatus.PENDING) {
      this.status = InviteStatus.EXPIRED;
      return true;
    }
    return false;
  }
}
