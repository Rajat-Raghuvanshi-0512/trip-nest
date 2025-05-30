import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';

import { Group } from '../../../models/group/entities/group.entity';
import { GroupMember } from '../../../models/group/entities/group-member.entity';
import { GroupInvite } from '../../../models/group/entities/group-invite.entity';
import { GroupJoinRequest } from '../../../models/group/entities/group-join-request.entity';
import { UserModule } from '../../../models/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      GroupMember,
      GroupInvite,
      GroupJoinRequest,
    ]),
    UserModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
