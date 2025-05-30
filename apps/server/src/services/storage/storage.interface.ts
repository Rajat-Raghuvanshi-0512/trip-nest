export interface UploadOptions {
  folder?: string;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: Record<string, any>;
  generateThumbnail?: boolean;
  quality?: 'auto' | number;
}

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  resourceType: string;
  width?: number;
  height?: number;
  bytes: number;
  duration?: number;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

export interface DeleteOptions {
  resourceType?: 'image' | 'video' | 'raw';
  invalidate?: boolean;
}

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  crop?: 'scale' | 'fit' | 'fill' | 'crop';
  quality?: 'auto' | number;
  format?: 'jpg' | 'png' | 'webp';
}

export interface SignedUrlOptions {
  expiresIn?: number; // seconds
  transformation?: Record<string, any>;
}

export abstract class StorageService {
  abstract uploadFile(
    buffer: Buffer,
    fileName: string,
    options?: UploadOptions,
  ): Promise<UploadResult>;

  abstract deleteFile(publicId: string, options?: DeleteOptions): Promise<void>;

  abstract generateThumbnail(
    publicId: string,
    options?: ThumbnailOptions,
  ): Promise<string>;

  abstract getSignedUrl(
    publicId: string,
    options?: SignedUrlOptions,
  ): Promise<string>;

  abstract getFileInfo(publicId: string): Promise<any>;

  // Utility methods
  abstract isValidFileType(mimeType: string): boolean;

  abstract getMaxFileSize(fileType: 'image' | 'video'): number;
}
