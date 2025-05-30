import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [AuthModule, GroupsModule, MediaModule],
})
export class V1Module {}
