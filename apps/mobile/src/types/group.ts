import { User } from './auth';

export interface GroupMember {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'REMOVED' | 'LEFT';
  joinedAt: string;
  user: User;
  invitedBy?: User;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  inviteCode: string;
  maxMembers: number;
  isPublic: boolean;
  requiresApproval: boolean;
  createdBy: User;
  memberCount: number;
  isAtCapacity: boolean;
  createdAt: string;
  updatedAt: string;
  members?: GroupMember[];
}

export interface GroupInvite {
  id: string;
  token: string;
  email?: string;
  expiresAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  invitedBy: User;
  invitedUser?: User;
  createdAt: string;
}

export interface GroupJoinRequest {
  id: string;
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  user: User;
  reviewedBy?: User;
  reviewedAt?: string;
  createdAt: string;
}

// DTOs for API requests
export interface CreateGroupDto {
  name: string;
  description: string;
  coverImage?: string;
  maxMembers?: number;
  isPublic?: boolean;
  requiresApproval?: boolean;
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
  coverImage?: string;
  maxMembers?: number;
  isPublic?: boolean;
  requiresApproval?: boolean;
}

export interface InviteUserDto {
  userId?: string;
  email?: string;
  username?: string;
}

export interface JoinRequestDto {
  message?: string;
}

export interface ChangeRoleDto {
  role: 'ADMIN' | 'MEMBER';
} 