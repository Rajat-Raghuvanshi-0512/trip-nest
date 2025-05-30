import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';

import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { JoinRequestDto } from './dto/join-request.dto';
import { ChangeRoleDto } from './dto/change-role.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    username: string;
  };
}

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(
    @Body() createGroupDto: CreateGroupDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.create(createGroupDto, req.user.userId);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.groupsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.update(id, updateGroupDto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.remove(id, req.user.userId);
  }

  @Get(':id/members')
  getMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.getMembers(id, req.user.userId);
  }

  @Post(':id/members/invite')
  inviteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() inviteUserDto: InviteUserDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.inviteUser(id, inviteUserDto, req.user.userId);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  leaveGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.removeMember(
      id,
      req.user.userId,
      req.user.userId,
    );
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.removeMember(id, userId, req.user.userId);
  }

  @Patch(':id/members/:userId/role')
  changeMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() changeRoleDto: ChangeRoleDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.changeMemberRole(
      id,
      userId,
      changeRoleDto,
      req.user.userId,
    );
  }

  @Post('join/:code')
  joinWithCode(
    @Param('code') code: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.joinWithCode(code, req.user.userId);
  }

  @Post(':id/join-requests')
  requestToJoin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() joinRequestDto: JoinRequestDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.requestToJoin(
      id,
      joinRequestDto,
      req.user.userId,
    );
  }

  @Get(':id/join-requests')
  getJoinRequests(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.getJoinRequests(id, req.user.userId);
  }

  @Post('join-requests/:requestId/approve')
  approveJoinRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.approveJoinRequest(requestId, req.user.userId);
  }

  @Post('join-requests/:requestId/reject')
  rejectJoinRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.rejectJoinRequest(requestId, req.user.userId);
  }

  @Post('invites/:token/accept')
  acceptInvite(
    @Param('token') token: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.groupsService.acceptInvite(token, req.user.userId);
  }
}
