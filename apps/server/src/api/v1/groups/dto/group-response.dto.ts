import { Group } from '../../../../models/group/entities/group.entity';
import { GroupMember } from '../../../../models/group/entities/group-member.entity';
import { GroupInvite } from '../../../../models/group/entities/group-invite.entity';
import { GroupJoinRequest } from '../../../../models/group/entities/group-join-request.entity';
import { UserResponseDto } from './user-response.dto';

export class GroupResponseDto {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  inviteCode: string;
  maxMembers: number;
  isPublic: boolean;
  requiresApproval: boolean;
  createdBy: UserResponseDto;
  memberCount: number;
  isAtCapacity: boolean;
  createdAt: Date;
  updatedAt: Date;
  members?: GroupMemberResponseDto[];

  constructor(group: Group) {
    this.id = group.id;
    this.name = group.name;
    this.description = group.description;
    this.coverImage = group.coverImage;
    this.inviteCode = group.inviteCode;
    this.maxMembers = group.maxMembers;
    this.isPublic = group.isPublic;
    this.requiresApproval = group.requiresApproval;
    this.createdBy = new UserResponseDto(group.createdBy);
    this.memberCount = group.memberCount;
    this.isAtCapacity = group.isAtCapacity;
    this.createdAt = group.createdAt;
    this.updatedAt = group.updatedAt;

    if (group.members) {
      this.members = group.members.map(
        (member) => new GroupMemberResponseDto(member),
      );
    }
  }

  static fromGroup(group: Group): GroupResponseDto {
    return new GroupResponseDto(group);
  }

  static fromGroups(groups: Group[]): GroupResponseDto[] {
    return groups.map((group) => new GroupResponseDto(group));
  }
}

export class GroupMemberResponseDto {
  id: string;
  role: string;
  status: string;
  joinedAt: Date;
  user: UserResponseDto;
  invitedBy?: UserResponseDto;

  constructor(member: GroupMember) {
    this.id = member.id;
    this.role = member.role;
    this.status = member.status;
    this.joinedAt = member.joinedAt;
    this.user = new UserResponseDto(member.user);

    if (member.invitedBy) {
      this.invitedBy = new UserResponseDto(member.invitedBy);
    }
  }
}

export class GroupInviteResponseDto {
  id: string;
  token: string;
  email?: string;
  expiresAt: Date;
  status: string;
  invitedBy: UserResponseDto;
  invitedUser?: UserResponseDto;
  createdAt: Date;

  constructor(invite: GroupInvite) {
    this.id = invite.id;
    this.token = invite.token;
    this.email = invite.email;
    this.expiresAt = invite.expiresAt;
    this.status = invite.status;
    this.invitedBy = new UserResponseDto(invite.invitedBy);
    this.createdAt = invite.createdAt;

    if (invite.invitedUser) {
      this.invitedUser = new UserResponseDto(invite.invitedUser);
    }
  }
}

export class GroupJoinRequestResponseDto {
  id: string;
  message?: string;
  status: string;
  user: UserResponseDto;
  reviewedBy?: UserResponseDto;
  reviewedAt?: Date;
  createdAt: Date;

  constructor(request: GroupJoinRequest) {
    this.id = request.id;
    this.message = request.message;
    this.status = request.status;
    this.user = new UserResponseDto(request.user);
    this.createdAt = request.createdAt;
    this.reviewedAt = request.reviewedAt;

    if (request.reviewedBy) {
      this.reviewedBy = new UserResponseDto(request.reviewedBy);
    }
  }
}
