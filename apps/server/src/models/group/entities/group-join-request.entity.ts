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

export enum JoinRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('group_join_requests')
@Index(['groupId', 'userId'], { unique: true })
export class GroupJoinRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  groupId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({
    type: 'enum',
    enum: JoinRequestStatus,
    default: JoinRequestStatus.PENDING,
  })
  status: JoinRequestStatus;

  @Column({ type: 'uuid', nullable: true })
  reviewedById: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @ManyToOne('Group', 'joinRequests', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  // Check if request is pending
  get isPending(): boolean {
    return this.status === JoinRequestStatus.PENDING;
  }

  // Check if request was approved
  get isApproved(): boolean {
    return this.status === JoinRequestStatus.APPROVED;
  }

  // Check if request was rejected
  get isRejected(): boolean {
    return this.status === JoinRequestStatus.REJECTED;
  }
}
