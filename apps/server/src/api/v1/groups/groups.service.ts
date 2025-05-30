import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';

import { Group } from '../../../models/group/entities/group.entity';
import {
  GroupMember,
  GroupRole,
  MemberStatus,
} from '../../../models/group/entities/group-member.entity';
import {
  GroupInvite,
  InviteStatus,
} from '../../../models/group/entities/group-invite.entity';
import {
  GroupJoinRequest,
  JoinRequestStatus,
} from '../../../models/group/entities/group-join-request.entity';
import { UserService } from '../../../models/user/user.service';

import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { JoinRequestDto } from './dto/join-request.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import {
  GroupResponseDto,
  GroupMemberResponseDto,
  GroupInviteResponseDto,
  GroupJoinRequestResponseDto,
} from './dto/group-response.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private memberRepository: Repository<GroupMember>,
    @InjectRepository(GroupInvite)
    private inviteRepository: Repository<GroupInvite>,
    @InjectRepository(GroupJoinRequest)
    private joinRequestRepository: Repository<GroupJoinRequest>,
    private userService: UserService,
  ) {}

  // Generate unique invite code
  private generateInviteCode(): string {
    return randomBytes(6).toString('hex').toUpperCase();
  }

  // Generate invite token
  private generateInviteToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Create a new group
  async create(
    createGroupDto: CreateGroupDto,
    userId: string,
  ): Promise<GroupResponseDto> {
    let inviteCode: string = '';
    let isUnique = false;

    // Generate unique invite code
    while (!isUnique) {
      inviteCode = this.generateInviteCode();
      const existing = await this.groupRepository.findOne({
        where: { inviteCode },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    const group = this.groupRepository.create({
      ...createGroupDto,
      inviteCode,
      createdById: userId,
    });

    const savedGroup = await this.groupRepository.save(group);

    // Add creator as owner
    const ownerMembership = this.memberRepository.create({
      groupId: savedGroup.id,
      userId,
      role: GroupRole.OWNER,
      status: MemberStatus.ACTIVE,
    });

    await this.memberRepository.save(ownerMembership);

    const fullGroup = await this.findOneRaw(savedGroup.id, userId);
    return new GroupResponseDto(fullGroup);
  }

  // Get all groups for a user
  async findAll(userId: string): Promise<GroupResponseDto[]> {
    const memberGroups = await this.memberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.group', 'group')
      .leftJoinAndSelect('group.createdBy', 'createdBy')
      .where('member.userId = :userId', { userId })
      .andWhere('member.status = :status', { status: MemberStatus.ACTIVE })
      .getMany();

    const groups = memberGroups.map((member) => member.group);
    return groups.map((group) => new GroupResponseDto(group));
  }

  // Get a specific group
  async findOne(groupId: string, userId: string): Promise<GroupResponseDto> {
    const group = await this.findOneRaw(groupId, userId);
    return new GroupResponseDto(group);
  }

  // Private method to get raw group data (for internal use)
  private async findOneRaw(groupId: string, userId: string): Promise<Group> {
    const group = await this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.createdBy', 'createdBy')
      .leftJoinAndSelect(
        'group.members',
        'members',
        'members.status = :status',
        { status: MemberStatus.ACTIVE },
      )
      .leftJoinAndSelect('members.user', 'memberUser')
      .where('group.id = :groupId', { groupId })
      .getOne();

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is a member
    const membership = await this.memberRepository.findOne({
      where: { groupId, userId, status: MemberStatus.ACTIVE },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return group;
  }

  // Update group
  async update(
    groupId: string,
    updateGroupDto: UpdateGroupDto,
    userId: string,
  ): Promise<GroupResponseDto> {
    await this.findOneRaw(groupId, userId);

    // Check if user is admin or owner
    const membership = await this.memberRepository.findOne({
      where: { groupId, userId, status: MemberStatus.ACTIVE },
    });

    if (!membership || (!membership.isAdmin && !membership.isOwner)) {
      throw new ForbiddenException(
        'Only admins and owners can update group settings',
      );
    }

    await this.groupRepository.update(groupId, updateGroupDto);
    return this.findOne(groupId, userId);
  }

  // Delete group (owner only)
  async remove(groupId: string, userId: string): Promise<void> {
    const group = await this.findOneRaw(groupId, userId);

    // Check if user is owner
    const membership = await this.memberRepository.findOne({
      where: { groupId, userId, status: MemberStatus.ACTIVE },
    });

    if (!membership || !membership.isOwner) {
      throw new ForbiddenException('Only the group owner can delete the group');
    }

    await this.groupRepository.remove(group);
  }

  // Get group members
  async getMembers(
    groupId: string,
    userId: string,
  ): Promise<GroupMemberResponseDto[]> {
    await this.findOneRaw(groupId, userId); // Verify access

    const members = await this.memberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('member.invitedBy', 'invitedBy')
      .where('member.groupId = :groupId', { groupId })
      .andWhere('member.status = :status', { status: MemberStatus.ACTIVE })
      .orderBy('member.role', 'ASC')
      .addOrderBy('member.joinedAt', 'ASC')
      .getMany();

    return members.map((member) => new GroupMemberResponseDto(member));
  }

  // Invite user to group
  async inviteUser(
    groupId: string,
    inviteDto: InviteUserDto,
    invitedById: string,
  ): Promise<GroupInviteResponseDto> {
    const group = await this.findOneRaw(groupId, invitedById);

    // Check if user has permission to invite
    const membership = await this.memberRepository.findOne({
      where: { groupId, userId: invitedById, status: MemberStatus.ACTIVE },
    });

    if (!membership || !membership.isAdmin) {
      throw new ForbiddenException('Only admins and owners can invite users');
    }

    // Check group capacity
    const memberCount = await this.memberRepository.count({
      where: { groupId, status: MemberStatus.ACTIVE },
    });

    if (memberCount >= group.maxMembers) {
      throw new BadRequestException('Group is at maximum capacity');
    }

    let invitedUserId: string | null = null;

    // Find user by provided identifier
    if (inviteDto.userId) {
      const user = await this.userService.findById(inviteDto.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      invitedUserId = user.id;
    } else if (inviteDto.email) {
      const user = await this.userService.findByEmail(inviteDto.email);
      if (user) {
        invitedUserId = user.id;
      }
    } else if (inviteDto.username) {
      const user = await this.userService.findByUsername(inviteDto.username);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      invitedUserId = user.id;
    }

    // Check if user is already a member
    if (invitedUserId) {
      const existingMembership = await this.memberRepository.findOne({
        where: { groupId, userId: invitedUserId },
      });

      if (
        existingMembership &&
        existingMembership.status === MemberStatus.ACTIVE
      ) {
        throw new ConflictException('User is already a member of this group');
      }
    }

    // Check for existing pending invite
    const existingInvite = await this.inviteRepository.findOne({
      where: {
        groupId,
        ...(invitedUserId ? { invitedUserId } : { email: inviteDto.email }),
        status: InviteStatus.PENDING,
      },
    });

    if (existingInvite && existingInvite.isValid) {
      throw new ConflictException('User already has a pending invite');
    }

    // Create invite
    const invite = this.inviteRepository.create({
      groupId,
      invitedById,
      invitedUserId: invitedUserId || undefined,
      email: inviteDto.email,
      token: this.generateInviteToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    const savedInvite = await this.inviteRepository.save(invite);

    // Load the invite with relations
    const fullInvite = await this.inviteRepository.findOne({
      where: { id: savedInvite.id },
      relations: ['invitedBy', 'invitedUser'],
    });

    if (!fullInvite) {
      throw new NotFoundException('Invite not found after creation');
    }

    return new GroupInviteResponseDto(fullInvite);
  }

  // Accept invite
  async acceptInvite(
    token: string,
    userId: string,
  ): Promise<GroupMemberResponseDto> {
    const invite = await this.inviteRepository
      .createQueryBuilder('invite')
      .leftJoinAndSelect('invite.group', 'group')
      .where('invite.token = :token', { token })
      .getOne();

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (!invite.isValid) {
      throw new BadRequestException('Invite is invalid or expired');
    }

    // Check if invite is for this user
    if (invite.invitedUserId && invite.invitedUserId !== userId) {
      throw new ForbiddenException('This invite is not for you');
    }

    // Check group capacity
    const memberCount = await this.memberRepository.count({
      where: { groupId: invite.groupId, status: MemberStatus.ACTIVE },
    });

    if (memberCount >= invite.group.maxMembers) {
      throw new BadRequestException('Group is at maximum capacity');
    }

    // Check if user is already a member
    const existingMembership = await this.memberRepository.findOne({
      where: { groupId: invite.groupId, userId },
    });

    if (
      existingMembership &&
      existingMembership.status === MemberStatus.ACTIVE
    ) {
      throw new ConflictException('You are already a member of this group');
    }

    // Create or update membership
    let membership: GroupMember;
    if (existingMembership) {
      existingMembership.status = MemberStatus.ACTIVE;
      existingMembership.invitedById = invite.invitedById;
      membership = await this.memberRepository.save(existingMembership);
    } else {
      membership = this.memberRepository.create({
        groupId: invite.groupId,
        userId,
        role: GroupRole.MEMBER,
        status: MemberStatus.ACTIVE,
        invitedById: invite.invitedById,
      });
      membership = await this.memberRepository.save(membership);
    }

    // Mark invite as accepted
    invite.status = InviteStatus.ACCEPTED;
    await this.inviteRepository.save(invite);

    const fullMembership = await this.memberRepository.findOne({
      where: { id: membership.id },
      relations: ['user', 'invitedBy'],
    });

    if (!fullMembership) {
      throw new NotFoundException('Membership not found after creation');
    }

    return new GroupMemberResponseDto(fullMembership);
  }

  // Join group with code
  async joinWithCode(
    inviteCode: string,
    userId: string,
  ): Promise<GroupMemberResponseDto | GroupJoinRequestResponseDto> {
    const group = await this.groupRepository.findOne({ where: { inviteCode } });

    if (!group) {
      throw new NotFoundException('Invalid invite code');
    }

    // Check if user is already a member
    const existingMembership = await this.memberRepository.findOne({
      where: { groupId: group.id, userId },
    });

    if (
      existingMembership &&
      existingMembership.status === MemberStatus.ACTIVE
    ) {
      throw new ConflictException('You are already a member of this group');
    }

    // Check group capacity
    const memberCount = await this.memberRepository.count({
      where: { groupId: group.id, status: MemberStatus.ACTIVE },
    });

    if (memberCount >= group.maxMembers) {
      throw new BadRequestException('Group is at maximum capacity');
    }

    if (group.requiresApproval) {
      // Create join request
      const existingRequest = await this.joinRequestRepository.findOne({
        where: { groupId: group.id, userId, status: JoinRequestStatus.PENDING },
      });

      if (existingRequest) {
        throw new ConflictException('You already have a pending join request');
      }

      const joinRequest = this.joinRequestRepository.create({
        groupId: group.id,
        userId,
      });

      const savedRequest = await this.joinRequestRepository.save(joinRequest);

      // Load with relations
      const fullRequest = await this.joinRequestRepository.findOne({
        where: { id: savedRequest.id },
        relations: ['user'],
      });

      if (!fullRequest) {
        throw new NotFoundException('Request not found after creation');
      }

      return new GroupJoinRequestResponseDto(fullRequest);
    } else {
      // Join immediately
      let membership: GroupMember;
      if (existingMembership) {
        existingMembership.status = MemberStatus.ACTIVE;
        membership = await this.memberRepository.save(existingMembership);
      } else {
        membership = this.memberRepository.create({
          groupId: group.id,
          userId,
          role: GroupRole.MEMBER,
          status: MemberStatus.ACTIVE,
        });
        membership = await this.memberRepository.save(membership);
      }

      const fullMembership = await this.memberRepository.findOne({
        where: { id: membership.id },
        relations: ['user', 'invitedBy'],
      });

      if (!fullMembership) {
        throw new NotFoundException('Membership not found after creation');
      }

      return new GroupMemberResponseDto(fullMembership);
    }
  }

  // Request to join group
  async requestToJoin(
    groupId: string,
    joinRequestDto: JoinRequestDto,
    userId: string,
  ): Promise<GroupJoinRequestResponseDto> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (!group.isPublic) {
      throw new ForbiddenException('This group is not public');
    }

    // Check if user is already a member
    const existingMembership = await this.memberRepository.findOne({
      where: { groupId, userId },
    });

    if (
      existingMembership &&
      existingMembership.status === MemberStatus.ACTIVE
    ) {
      throw new ConflictException('You are already a member of this group');
    }

    // Check for existing request
    const existingRequest = await this.joinRequestRepository.findOne({
      where: { groupId, userId, status: JoinRequestStatus.PENDING },
    });

    if (existingRequest) {
      throw new ConflictException('You already have a pending join request');
    }

    const joinRequest = this.joinRequestRepository.create({
      groupId,
      userId,
      message: joinRequestDto.message,
    });

    const savedRequest = await this.joinRequestRepository.save(joinRequest);

    // Load with relations
    const fullRequest = await this.joinRequestRepository.findOne({
      where: { id: savedRequest.id },
      relations: ['user'],
    });

    if (!fullRequest) {
      throw new NotFoundException('Request not found after creation');
    }

    return new GroupJoinRequestResponseDto(fullRequest);
  }

  // Get join requests (admin only)
  async getJoinRequests(
    groupId: string,
    userId: string,
  ): Promise<GroupJoinRequestResponseDto[]> {
    await this.findOneRaw(groupId, userId); // Verify access

    // Check if user is admin
    const membership = await this.memberRepository.findOne({
      where: { groupId, userId, status: MemberStatus.ACTIVE },
    });

    if (!membership || !membership.isAdmin) {
      throw new ForbiddenException(
        'Only admins and owners can view join requests',
      );
    }

    const requests = await this.joinRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .where('request.groupId = :groupId', { groupId })
      .andWhere('request.status = :status', {
        status: JoinRequestStatus.PENDING,
      })
      .orderBy('request.createdAt', 'ASC')
      .getMany();

    return requests.map((request) => new GroupJoinRequestResponseDto(request));
  }

  // Approve join request
  async approveJoinRequest(
    requestId: string,
    userId: string,
  ): Promise<GroupMemberResponseDto> {
    const request = await this.joinRequestRepository.findOne({
      where: { id: requestId },
      relations: ['group', 'user'],
    });

    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    if (!request.isPending) {
      throw new BadRequestException('Join request is not pending');
    }

    // Check if user is admin
    const membership = await this.memberRepository.findOne({
      where: { groupId: request.groupId, userId, status: MemberStatus.ACTIVE },
    });

    if (!membership || !membership.isAdmin) {
      throw new ForbiddenException(
        'Only admins and owners can approve join requests',
      );
    }

    // Check group capacity
    const memberCount = await this.memberRepository.count({
      where: { groupId: request.groupId, status: MemberStatus.ACTIVE },
    });

    if (memberCount >= request.group.maxMembers) {
      throw new BadRequestException('Group is at maximum capacity');
    }

    // Create membership
    const newMember = this.memberRepository.create({
      groupId: request.groupId,
      userId: request.userId,
      role: GroupRole.MEMBER,
      status: MemberStatus.ACTIVE,
    });

    const savedMember = await this.memberRepository.save(newMember);

    // Update request status
    request.status = JoinRequestStatus.APPROVED;
    request.reviewedById = userId;
    request.reviewedAt = new Date();
    await this.joinRequestRepository.save(request);

    const fullMember = await this.memberRepository.findOne({
      where: { id: savedMember.id },
      relations: ['user', 'invitedBy'],
    });

    if (!fullMember) {
      throw new NotFoundException('Member not found after creation');
    }

    return new GroupMemberResponseDto(fullMember);
  }

  // Reject join request
  async rejectJoinRequest(
    requestId: string,
    userId: string,
  ): Promise<GroupJoinRequestResponseDto> {
    const request = await this.joinRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    if (!request.isPending) {
      throw new BadRequestException('Join request is not pending');
    }

    // Check if user is admin
    const membership = await this.memberRepository.findOne({
      where: { groupId: request.groupId, userId, status: MemberStatus.ACTIVE },
    });

    if (!membership || !membership.isAdmin) {
      throw new ForbiddenException(
        'Only admins and owners can reject join requests',
      );
    }

    // Update request status
    request.status = JoinRequestStatus.REJECTED;
    request.reviewedById = userId;
    request.reviewedAt = new Date();

    const updatedRequest = await this.joinRequestRepository.save(request);

    return new GroupJoinRequestResponseDto(updatedRequest);
  }

  // Change member role
  async changeMemberRole(
    groupId: string,
    targetUserId: string,
    changeRoleDto: ChangeRoleDto,
    userId: string,
  ): Promise<GroupMemberResponseDto> {
    await this.findOneRaw(groupId, userId); // Verify access

    // Get current user's membership
    const currentMembership = await this.memberRepository.findOne({
      where: { groupId, userId, status: MemberStatus.ACTIVE },
    });

    if (!currentMembership || !currentMembership.isOwner) {
      throw new ForbiddenException(
        'Only the group owner can change member roles',
      );
    }

    // Get target member
    const targetMembership = await this.memberRepository.findOne({
      where: { groupId, userId: targetUserId, status: MemberStatus.ACTIVE },
      relations: ['user'],
    });

    if (!targetMembership) {
      throw new NotFoundException('Member not found');
    }

    // Cannot change own role
    if (targetUserId === userId) {
      throw new BadRequestException('You cannot change your own role');
    }

    // Cannot change owner role
    if (targetMembership.isOwner) {
      throw new BadRequestException('Cannot change owner role');
    }

    // Update role
    targetMembership.role = changeRoleDto.role;
    const updatedMembership =
      await this.memberRepository.save(targetMembership);

    return new GroupMemberResponseDto(updatedMembership);
  }

  // Remove member
  async removeMember(
    groupId: string,
    targetUserId: string,
    userId: string,
  ): Promise<void> {
    await this.findOneRaw(groupId, userId); // Verify access

    // Get current user's membership
    const currentMembership = await this.memberRepository.findOne({
      where: { groupId, userId, status: MemberStatus.ACTIVE },
    });

    // Get target member
    const targetMembership = await this.memberRepository.findOne({
      where: { groupId, userId: targetUserId, status: MemberStatus.ACTIVE },
    });

    if (!targetMembership) {
      throw new NotFoundException('Member not found');
    }

    // Check permissions
    if (targetUserId === userId) {
      // User leaving themselves - always allowed
    } else if (!currentMembership || !currentMembership.isAdmin) {
      throw new ForbiddenException('Only admins and owners can remove members');
    } else if (targetMembership.isOwner) {
      throw new BadRequestException('Cannot remove the group owner');
    } else if (targetMembership.isAdmin && !currentMembership.isOwner) {
      throw new ForbiddenException('Only the owner can remove admins');
    }

    // Mark as removed/left
    targetMembership.status =
      targetUserId === userId ? MemberStatus.LEFT : MemberStatus.REMOVED;
    await this.memberRepository.save(targetMembership);
  }
}
