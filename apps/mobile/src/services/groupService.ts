import { apiService } from './api';
import type {
  Group,
  GroupMember,
  GroupInvite,
  GroupJoinRequest,
  CreateGroupDto,
  UpdateGroupDto,
  InviteUserDto,
  JoinRequestDto,
  ChangeRoleDto,
} from '../types';

class GroupService {
  private readonly baseUrl = '/groups';

  // Group CRUD operations
  async createGroup(data: CreateGroupDto): Promise<Group> {
    return await apiService.post<Group>(this.baseUrl, data);
  }

  async getMyGroups(): Promise<Group[]> {
    return await apiService.get<Group[]>(this.baseUrl);
  }

  async getGroup(groupId: string): Promise<Group> {
    return await apiService.get<Group>(`${this.baseUrl}/${groupId}`);
  }

  async updateGroup(groupId: string, data: UpdateGroupDto): Promise<Group> {
    return await apiService.patch<Group>(`${this.baseUrl}/${groupId}`, data);
  }

  async deleteGroup(groupId: string): Promise<void> {
    return await apiService.delete<void>(`${this.baseUrl}/${groupId}`);
  }

  // Member management
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return await apiService.get<GroupMember[]>(`${this.baseUrl}/${groupId}/members`);
  }

  async inviteUser(groupId: string, data: InviteUserDto): Promise<GroupInvite> {
    return await apiService.post<GroupInvite>(`${this.baseUrl}/${groupId}/members/invite`, data);
  }

  async leaveGroup(groupId: string): Promise<void> {
    return await apiService.post<void>(`${this.baseUrl}/${groupId}/leave`);
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    return await apiService.delete<void>(`${this.baseUrl}/${groupId}/members/${userId}`);
  }

  async changeMemberRole(groupId: string, userId: string, data: ChangeRoleDto): Promise<GroupMember> {
    return await apiService.patch<GroupMember>(`${this.baseUrl}/${groupId}/members/${userId}/role`, data);
  }

  // Join mechanisms
  async joinWithCode(inviteCode: string): Promise<GroupMember | GroupJoinRequest> {
    return await apiService.post<GroupMember | GroupJoinRequest>(`${this.baseUrl}/join/${inviteCode}`);
  }

  async requestToJoin(groupId: string, data: JoinRequestDto): Promise<GroupJoinRequest> {
    return await apiService.post<GroupJoinRequest>(`${this.baseUrl}/${groupId}/join-requests`, data);
  }

  async acceptInvite(token: string): Promise<GroupMember> {
    return await apiService.post<GroupMember>(`${this.baseUrl}/invites/${token}/accept`);
  }

  // Join request management (admin only)
  async getJoinRequests(groupId: string): Promise<GroupJoinRequest[]> {
    return await apiService.get<GroupJoinRequest[]>(`${this.baseUrl}/${groupId}/join-requests`);
  }

  async approveJoinRequest(requestId: string): Promise<GroupMember> {
    return await apiService.post<GroupMember>(`${this.baseUrl}/join-requests/${requestId}/approve`);
  }

  async rejectJoinRequest(requestId: string): Promise<GroupJoinRequest> {
    return await apiService.post<GroupJoinRequest>(`${this.baseUrl}/join-requests/${requestId}/reject`);
  }
}

export const groupService = new GroupService(); 