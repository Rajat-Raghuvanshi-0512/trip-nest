import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import type { GroupMember } from './group-member.entity';
import type { GroupInvite } from './group-invite.entity';
import type { GroupJoinRequest } from './group-join-request.entity';
import { MemberStatus } from './group-member.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ unique: true })
  @Index()
  inviteCode: string;

  @Column({ default: 50 })
  maxMembers: number;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: true })
  requiresApproval: boolean;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @OneToMany('GroupMember', 'group')
  members: GroupMember[];

  @OneToMany('GroupInvite', 'group')
  invites: GroupInvite[];

  @OneToMany('GroupJoinRequest', 'group')
  joinRequests: GroupJoinRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual property to get active member count
  get memberCount(): number {
    return (
      this.members?.filter((member) => member.status === MemberStatus.ACTIVE)
        .length || 0
    );
  }

  // Check if group is at capacity
  get isAtCapacity(): boolean {
    return this.memberCount >= this.maxMembers;
  }
}
