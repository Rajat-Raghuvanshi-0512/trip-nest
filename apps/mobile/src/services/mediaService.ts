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
      

      // Create file object from asset with better video handling
      const mimeType = this.getMimeType(asset);
      const fileName = asset.fileName || this.generateFileName(asset.type);
      
      // For React Native, we need to create a proper file object
      const file = {
        uri: asset.uri,
        type: mimeType,
        name: fileName,
      } as any;


      formData.append('file', file);
      
      // Add mediaType field based on asset type
      const mediaType = asset.type === 'video' ? 'video' : 'image';
      formData.append('mediaType', mediaType);
      
      // Add optional fields if provided
      if (fileName) {
        formData.append('fileName', fileName);
      }
      
      if (options.onProgress) {
        options.onProgress(0);
      }

      const result = await apiService.upload<MediaItem>(
        `${this.baseUrl}/${groupId}/media`,
        formData,
        {
          timeout: 120000, // 2 minute timeout for videos
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
        fileName: result.fileName,
        duration: result.duration,
      });

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error: any) {
      // Enhanced error logging for debugging
      console.error(`[MediaService] Upload failed for ${asset.type}:`, {
        error: error.message,
        errorCode: error.code,
        errorResponse: error.response?.data,
        errorStatus: error.response?.status,
        errorStatusText: error.response?.statusText,
        assetType: asset.type,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
        uri: asset.uri,
        stack: error.stack,
      });

      let errorMessage = 'Upload failed';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Add specific video error handling
      if (asset.type === 'video') {
        if (error.message?.includes('timeout')) {
          errorMessage = 'Video upload timed out. Please try with a smaller video file.';
        } else if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
          errorMessage = 'Network error during video upload. Please check your connection and try again.';
        } else if (error.response?.status === 413) {
          errorMessage = 'Video file is too large. Please try with a smaller file.';
        } else if (error.response?.status === 415) {
          errorMessage = 'Video format not supported. Please try with an MP4 file.';
        }
      }

      if (options.onError) {
        options.onError(errorMessage);
      }
      throw new Error(errorMessage);
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
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    if (type === 'video') {
      return `video_${timestamp}_${randomSuffix}.mp4`;
    }
    
    return `image_${timestamp}_${randomSuffix}.jpg`;
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