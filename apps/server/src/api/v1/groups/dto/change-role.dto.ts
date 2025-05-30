import { IsEnum } from 'class-validator';
import { GroupRole } from '../../../../models/group/entities/group-member.entity';

export class ChangeRoleDto {
  @IsEnum(GroupRole, {
    message: 'Invalid role. Must be OWNER, ADMIN, or MEMBER',
  })
  role: GroupRole;
}
