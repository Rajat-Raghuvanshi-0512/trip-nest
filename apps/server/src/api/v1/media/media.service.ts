import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GroupMedia,
  MediaType,
  MediaStatus,
} from '../../../models/group/entities/group-media.entity';
import { Group } from '../../../models/group/entities/group.entity';
import {
  GroupMember,
  GroupRole,
} from '../../../models/group/entities/group-member.entity';
import { MediaResponseDto } from '../../../models/group/dto/media/media-response.dto';
import { UploadMediaDto } from '../../../models/group/dto/media/upload-media.dto';
import { StorageService } from '../../../services/storage/storage.interface';

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(GroupMedia)
    private groupMediaRepository: Repository<GroupMedia>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private groupMemberRepository: Repository<GroupMember>,
    private storageService: StorageService,
  ) {}

  async uploadMedia(
    groupId: string,
    userId: string,
    file: UploadedFile,
    uploadDto: UploadMediaDto,
  ): Promise<MediaResponseDto> {
    // Check if group exists
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is a member of the group
    const membership = await this.groupMemberRepository.findOne({
      where: { groupId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Validate file type
    if (!this.storageService.isValidFileType(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    // Check file size
    const maxSize = this.storageService.getMaxFileSize(
      uploadDto.mediaType === MediaType.VIDEO ? 'video' : 'image',
    );
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size is ${this.formatBytes(maxSize)}`,
      );
    }

    try {
      // Upload to storage
      const uploadResult = await this.storageService.uploadFile(
        file.buffer,
        file.originalname,
        {
          folder: `groups/${groupId}/media`,
          resourceType:
            uploadDto.mediaType === MediaType.VIDEO ? 'video' : 'image',
          generateThumbnail: true,
        },
      );

      // Create media record
      const media = this.groupMediaRepository.create({
        groupId,
        uploadedById: userId,
        mediaType: uploadDto.mediaType,
        status: MediaStatus.COMPLETED,
        fileUrl: uploadResult.secureUrl,
        thumbnailUrl: uploadResult.thumbnailUrl,
        fileName: uploadDto.fileName || file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration
          ? Math.round(uploadResult.duration)
          : undefined,
        caption: uploadDto.caption,
        cloudinaryPublicId: uploadResult.publicId,
        metadata: {
          ...uploadResult.metadata,
          ...uploadDto.metadata,
        },
      });

      const savedMedia = await this.groupMediaRepository.save(media);

      // Fetch with relations for response
      const mediaWithRelations = await this.groupMediaRepository.findOne({
        where: { id: savedMedia.id },
        relations: ['uploadedBy'],
      });

      if (!mediaWithRelations) {
        throw new NotFoundException('Media not found after creation');
      }

      return new MediaResponseDto(mediaWithRelations);
    } catch (error) {
      console.error(`[MediaService] Upload failed:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        mediaType: uploadDto.mediaType,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      // Re-throw the original error to preserve the error details
      throw error;
    }
  }

  async getGroupMedia(
    groupId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ media: MediaResponseDto[]; total: number; totalPages: number }> {
    // Check if group exists and user is a member
    const membership = await this.groupMemberRepository.findOne({
      where: { groupId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const [media, total] = await this.groupMediaRepository.findAndCount({
      where: { groupId, status: MediaStatus.COMPLETED },
      relations: ['uploadedBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const mediaDto = MediaResponseDto.fromMediaArray(media);

    return {
      media: mediaDto,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMediaById(
    mediaId: string,
    userId: string,
  ): Promise<MediaResponseDto> {
    const media = await this.groupMediaRepository.findOne({
      where: { id: mediaId },
      relations: ['uploadedBy', 'group'],
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Check if user is a member of the group
    const membership = await this.groupMemberRepository.findOne({
      where: { groupId: media.groupId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return new MediaResponseDto(media);
  }

  async deleteMedia(mediaId: string, userId: string): Promise<void> {
    const media = await this.groupMediaRepository.findOne({
      where: { id: mediaId },
      relations: ['group'],
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Check if user can delete (owner of media or group admin/owner)
    const membership = await this.groupMemberRepository.findOne({
      where: { groupId: media.groupId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const canDelete =
      media.uploadedById === userId ||
      membership.role === GroupRole.OWNER ||
      membership.role === GroupRole.ADMIN;

    if (!canDelete) {
      throw new ForbiddenException(
        'You can only delete your own media or you must be a group admin',
      );
    }

    // Delete from storage
    if (media.cloudinaryPublicId) {
      try {
        await this.storageService.deleteFile(media.cloudinaryPublicId, {
          resourceType: media.mediaType === MediaType.VIDEO ? 'video' : 'image',
        });
      } catch (error) {
        console.error('Failed to delete file from storage:', error);
        // Continue with database deletion even if storage deletion fails
      }
    }

    await this.groupMediaRepository.remove(media);
  }

  async updateMediaCaption(
    mediaId: string,
    userId: string,
    caption: string,
  ): Promise<MediaResponseDto> {
    const media = await this.groupMediaRepository.findOne({
      where: { id: mediaId },
      relations: ['uploadedBy'],
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Only the uploader can update the caption
    if (media.uploadedById !== userId) {
      throw new ForbiddenException('You can only edit your own media');
    }

    media.caption = caption;
    const updatedMedia = await this.groupMediaRepository.save(media);

    return new MediaResponseDto(updatedMedia);
  }

  async getGroupMediaCount(groupId: string): Promise<number> {
    return this.groupMediaRepository.count({
      where: { groupId, status: MediaStatus.COMPLETED },
    });
  }

  async deleteAllGroupMedia(groupId: string): Promise<void> {
    const media = await this.groupMediaRepository.find({
      where: { groupId },
    });

    // Delete all files from storage
    const publicIds = media
      .filter((m) => m.cloudinaryPublicId)
      .map((m) => m.cloudinaryPublicId);

    if (publicIds.length > 0) {
      try {
        // If using Cloudinary, we could use bulk delete
        await Promise.all(
          publicIds.map((publicId) =>
            this.storageService.deleteFile(publicId).catch((err) => {
              console.error(`Failed to delete ${publicId}:`, err);
            }),
          ),
        );
      } catch (error) {
        console.error('Failed to delete media files from storage:', error);
      }
    }

    // Delete all records from database
    await this.groupMediaRepository.delete({ groupId });
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
