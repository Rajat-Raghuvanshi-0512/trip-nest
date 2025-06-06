export type MediaType = 'image' | 'video';

export interface MediaItem {
  id: string;
  groupId: string;
  uploadedBy: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    profilePictureUrl?: string;
  };
  fileName: string;
  originalName?: string;
  mimeType: string;
  fileSize?: string | number;
  mediaType: MediaType;
  fileUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  caption?: string | null;
  status: 'uploading' | 'processing' | 'ready' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  metadata?: {
    bytes?: number;
    created_at?: string;
    etag?: string;
    format?: string;
  };
}

export interface MediaUploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface MediaGalleryFilters {
  mediaType?: MediaType;
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface MediaPaginationResponse {
  media: MediaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateMediaDto {
  caption?: string;
}

export interface UpdateCaptionDto {
  caption: string;
}

// Camera and picker types
export interface CameraAsset {
  uri: string;
  type: MediaType;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface MediaPickerOptions {
  mediaTypes: 'images' | 'videos' | 'all';
  allowsEditing?: boolean;
  quality?: number;
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
}

export interface MediaUploadOptions {
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
  onSuccess?: (media: MediaItem) => void;
} 