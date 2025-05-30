import { MediaType, MediaStatus } from '../../entities/group-media.entity';
import { GroupMedia } from '../../entities/group-media.entity';
import { UserResponseDto } from '../../../../api/v1/groups/dto/user-response.dto';

export class MediaResponseDto {
  id: string;
  groupId: string;
  mediaType: MediaType;
  status: MediaStatus;
  fileUrl: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  caption?: string;
  metadata?: Record<string, any>;
  uploadedBy: UserResponseDto;
  createdAt: Date;
  updatedAt: Date;

  constructor(media: GroupMedia) {
    this.id = media.id;
    this.groupId = media.groupId;
    this.mediaType = media.mediaType;
    this.status = media.status;
    this.fileUrl = media.fileUrl;
    this.thumbnailUrl = media.thumbnailUrl;
    this.fileName = media.fileName;
    this.fileSize = media.fileSize;
    this.mimeType = media.mimeType;
    this.width = media.width;
    this.height = media.height;
    this.duration = media.duration;
    this.caption = media.caption;
    this.metadata = media.metadata;
    this.uploadedBy = new UserResponseDto(media.uploadedBy);
    this.createdAt = media.createdAt;
    this.updatedAt = media.updatedAt;
  }

  // Virtual properties
  get isImage(): boolean {
    return this.mediaType === MediaType.IMAGE;
  }

  get isVideo(): boolean {
    return this.mediaType === MediaType.VIDEO;
  }

  get isCompleted(): boolean {
    return this.status === MediaStatus.COMPLETED;
  }

  get formattedFileSize(): string {
    if (!this.fileSize) return '';

    const bytes = Number(this.fileSize);
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  get formattedDuration(): string {
    if (!this.duration) return '';

    const hours = Math.floor(this.duration / 3600);
    const minutes = Math.floor((this.duration % 3600) / 60);
    const seconds = this.duration % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  static fromMedia(media: GroupMedia): MediaResponseDto {
    return new MediaResponseDto(media);
  }

  static fromMediaArray(media: GroupMedia[]): MediaResponseDto[] {
    return media.map((m) => new MediaResponseDto(m));
  }
}
