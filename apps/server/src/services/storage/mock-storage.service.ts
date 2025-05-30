import { Injectable } from '@nestjs/common';
import {
  StorageService,
  UploadOptions,
  UploadResult,
  ThumbnailOptions,
  SignedUrlOptions,
} from './storage.interface';

interface MockFileData {
  buffer: Buffer;
  fileName: string;
  uploadedAt: Date;
  options?: UploadOptions;
}

@Injectable()
export class MockStorageService extends StorageService {
  private mockFiles = new Map<string, MockFileData>();

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    // Generate a mock public ID
    const publicId = `${options?.folder || 'tripshare'}/${Date.now()}-${fileName}`;
    const mockUrl = `https://res.cloudinary.com/tripshare/image/upload/${publicId}`;

    // Store mock file data
    this.mockFiles.set(publicId, {
      buffer,
      fileName,
      uploadedAt: new Date(),
      options,
    });

    const result: UploadResult = {
      url: mockUrl,
      secureUrl: mockUrl,
      publicId,
      format: fileName.split('.').pop() || 'jpg',
      resourceType: buffer.length > 1000000 ? 'video' : 'image',
      width: 1920,
      height: 1080,
      bytes: buffer.length,
      duration: buffer.length > 1000000 ? 30 : undefined,
      thumbnailUrl: options?.generateThumbnail ? `${mockUrl}_thumb` : undefined,
      metadata: {
        created_at: new Date().toISOString(),
        etag: 'mock-etag',
        version: 1,
      },
    };

    return Promise.resolve(result);
  }

  async deleteFile(publicId: string): Promise<void> {
    this.mockFiles.delete(publicId);
    return Promise.resolve();
  }

  async generateThumbnail(
    publicId: string,
    options?: ThumbnailOptions,
  ): Promise<string> {
    const url = `https://res.cloudinary.com/tripshare/image/upload/w_${options?.width || 300},h_${options?.height || 300},c_${options?.crop || 'fill'}/${publicId}`;
    return Promise.resolve(url);
  }

  async getSignedUrl(
    publicId: string,
    options?: SignedUrlOptions,
  ): Promise<string> {
    const url = `https://res.cloudinary.com/tripshare/image/upload/${publicId}?signed=true&expires=${Date.now() + (options?.expiresIn || 3600) * 1000}`;
    return Promise.resolve(url);
  }

  async getFileInfo(publicId: string): Promise<any> {
    const mockFile = this.mockFiles.get(publicId);
    if (!mockFile) {
      throw new Error('File not found');
    }

    const fileExtension = mockFile.fileName.includes('.')
      ? mockFile.fileName.split('.').pop()
      : 'jpg';

    const result = {
      public_id: publicId,
      format: fileExtension,
      resource_type: 'image',
      bytes: mockFile.buffer.length,
      created_at: mockFile.uploadedAt.toISOString(),
    };

    return Promise.resolve(result);
  }

  isValidFileType(mimeType: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/avi',
      'video/wmv',
      'video/flv',
      'video/webm',
      'video/3gpp',
      'video/x-msvideo',
    ];

    return allowedTypes.includes(mimeType.toLowerCase());
  }

  getMaxFileSize(fileType: 'image' | 'video'): number {
    switch (fileType) {
      case 'image':
        return 10 * 1024 * 1024; // 10MB
      case 'video':
        return 100 * 1024 * 1024; // 100MB
      default:
        return 10 * 1024 * 1024;
    }
  }
}
