import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { MediaController, MediaItemController } from './media.controller';
import { MediaService } from './media.service';
import { GroupMedia } from '../../../models/group/entities/group-media.entity';
import { Group } from '../../../models/group/entities/group.entity';
import { GroupMember } from '../../../models/group/entities/group-member.entity';
import { StorageService } from '../../../services/storage/storage.interface';
import { CloudinaryService } from '../../../services/storage/cloudinary.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([GroupMedia, Group, GroupMember]),
    MulterModule.register({
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size
      },
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'video/avi',
          'video/webm',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('Invalid file type'), false);
        }
      },
    }),
  ],
  controllers: [MediaController, MediaItemController],
  providers: [
    MediaService,
    {
      provide: StorageService,
      useClass: CloudinaryService,
    },
  ],
  exports: [MediaService],
})
export class MediaModule {}
