import { apiService } from './api';
import type {
  MediaItem,
  MediaPaginationResponse,
  CreateMediaDto,
  UpdateCaptionDto,
  CameraAsset,
  MediaUploadOptions,
  MediaGalleryFilters,
} from '../types';

class MediaService {
  private readonly baseUrl = '/groups';
  private readonly mediaUrl = '/media';

  // Upload media to a group
  async uploadMedia(
    groupId: string,
    asset: CameraAsset,
    options: MediaUploadOptions = {}
  ): Promise<MediaItem> {
    try {
      const formData = new FormData();
      
      // Create file object from asset
      const file = {
        uri: asset.uri,
        type: this.getMimeType(asset),
        name: asset.fileName || this.generateFileName(asset.type),
      } as any;

      formData.append('file', file);
      
      // Add mediaType field based on asset type
      const mediaType = asset.type === 'video' ? 'video' : 'image';
      formData.append('mediaType', mediaType);
      
      // Add optional fields if provided
      if (asset.fileName) {
        formData.append('fileName', asset.fileName);
      }
      
      // Debug logging
      console.log(`[MediaService] Uploading ${mediaType} file:`, {
        fileName: asset.fileName || this.generateFileName(asset.type),
        fileSize: asset.fileSize,
        mediaType,
      });
      
      if (options.onProgress) {
        // For progress tracking, we'll use a different approach since FormData doesn't support progress directly
        // We'll simulate progress for now and implement real progress in the upload method
        options.onProgress(0);
      }

      const result = await apiService.upload<MediaItem>(
        `${this.baseUrl}/${groupId}/media`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (options.onProgress && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              options.onProgress(progress);
            }
          },
        }
      );

      console.log(`[MediaService] Upload successful:`, {
        mediaId: result.id,
        mediaType: result.mediaType,
        fileUrl: result.fileUrl,
        thumbnailUrl: result.thumbnailUrl,
        status: result.status,
      });

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      if (options.onError) {
        options.onError(errorMessage);
      }
      throw error;
    }
  }

  // Get paginated media for a group
  async getGroupMedia(
    groupId: string,
    page: number = 1,
    limit: number = 20,
    filters?: MediaGalleryFilters
  ): Promise<MediaPaginationResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.mediaType && { mediaType: filters.mediaType }),
      ...(filters?.uploadedBy && { uploadedBy: filters.uploadedBy }),
      ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters?.dateTo && { dateTo: filters.dateTo }),
    });

    console.log(`[MediaService] Fetching group media:`, {
      groupId,
      page,
      limit,
      filters,
      queryParams: params.toString(),
    });

    const result = await apiService.get<MediaPaginationResponse>(
      `${this.baseUrl}/${groupId}/media?${params.toString()}`
    );

    console.log(`[MediaService] Fetched group media:`, {
      groupId,
      page,
      total: result.total,
      totalPages: result.totalPages,
      mediaCount: result.media.length,
      media: result.media.map(item => ({
        id: item.id,
        mediaType: item.mediaType,
        status: item.status,
        createdAt: item.createdAt,
      })),
    });

    return result;
  }

  // Get media count for a group
  async getGroupMediaCount(groupId: string): Promise<{ count: number }> {
    return await apiService.get<{ count: number }>(
      `${this.baseUrl}/${groupId}/media/count`
    );
  }

  // Get individual media item details
  async getMediaItem(mediaId: string): Promise<MediaItem> {
    return await apiService.get<MediaItem>(`${this.mediaUrl}/${mediaId}`);
  }

  // Update media caption
  async updateMediaCaption(mediaId: string, data: UpdateCaptionDto): Promise<MediaItem> {
    return await apiService.put<MediaItem>(`${this.mediaUrl}/${mediaId}/caption`, data);
  }

  // Delete media item
  async deleteMedia(mediaId: string): Promise<void> {
    return await apiService.delete<void>(`${this.mediaUrl}/${mediaId}`);
  }

  // Get download URL for media item
  async getDownloadUrl(mediaId: string): Promise<{ downloadUrl: string }> {
    return await apiService.get<{ downloadUrl: string }>(
      `${this.mediaUrl}/${mediaId}/download`
    );
  }

  // Helper method to get MIME type from asset
  private getMimeType(asset: CameraAsset): string {
    if (asset.type === 'video') {
      return 'video/mp4'; // Default for videos
    }
    return 'image/jpeg'; // Default for images
  }

  // Helper method to generate filename
  private generateFileName(type: 'image' | 'video'): string {
    const timestamp = Date.now();
    const extension = type === 'video' ? 'mp4' : 'jpg';
    return `${type}_${timestamp}.${extension}`;
  }

  // Validate file size based on type
  validateFileSize(asset: CameraAsset): { valid: boolean; error?: string } {
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    
    if (!asset.fileSize) {
      return { valid: true }; // Can't validate without size info
    }

    const maxSize = asset.type === 'image' ? maxImageSize : maxVideoSize;
    
    if (asset.fileSize > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit for ${asset.type}s`,
      };
    }

    return { valid: true };
  }

  // Get supported media types
  getSupportedMimeTypes(): string[] {
    return [
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
  }
}

export const mediaService = new MediaService(); 