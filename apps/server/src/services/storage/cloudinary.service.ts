import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import {
  StorageService,
  UploadOptions,
  UploadResult,
  DeleteOptions,
  ThumbnailOptions,
  SignedUrlOptions,
} from './storage.interface';

// Cloudinary response interfaces
interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  width?: number;
  height?: number;
  bytes: number;
  duration?: number;
  etag: string;
  created_at: string;
}

interface CloudinaryDeleteResult {
  result: string;
}

@Injectable()
export class CloudinaryService implements StorageService {
  private readonly logger = new Logger(CloudinaryService.name);
  private isConfigured = false;

  constructor(private configService: ConfigService) {
    this.configureCloudinary();
  }

  private configureCloudinary(): void {
    try {
      const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
      const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
      const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

      if (!cloudName || !apiKey || !apiSecret) {
        throw new Error('Missing Cloudinary configuration');
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });

      this.isConfigured = true;
      this.logger.log('Cloudinary configured successfully');
    } catch (error) {
      this.logger.error('Failed to configure Cloudinary', error);
      throw new Error('Cloudinary configuration failed');
    }
  }

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured');
    }

    return new Promise<UploadResult>((resolve, reject) => {
      const uploadOptions = {
        folder: options.folder || 'trip-nest',
        resource_type: options.resourceType || 'auto',
        use_filename: true,
        unique_filename: true,
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const uploadStream = (cloudinary as any).uploader.upload_stream(
        uploadOptions,
        (error: any, result: any) => {
          if (error) {
            this.logger.error('Upload failed', error);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            reject(new Error(`Upload failed: ${error.message}`));
            return;
          }

          if (!result) {
            reject(new Error('Upload failed: No result returned'));
            return;
          }

          const cloudinaryResult = result as CloudinaryUploadResult;

          try {
            const uploadResult: UploadResult = {
              url: cloudinaryResult.url,
              secureUrl: cloudinaryResult.secure_url,
              publicId: cloudinaryResult.public_id,
              format: cloudinaryResult.format,
              resourceType: cloudinaryResult.resource_type,
              width: cloudinaryResult.width,
              height: cloudinaryResult.height,
              bytes: cloudinaryResult.bytes,
              duration: cloudinaryResult.duration,
              thumbnailUrl: this.generateThumbnailUrl(
                cloudinaryResult.public_id,
              ),
              metadata: {
                format: cloudinaryResult.format,
                bytes: cloudinaryResult.bytes,
                etag: cloudinaryResult.etag,
                created_at: cloudinaryResult.created_at,
              },
            };

            resolve(uploadResult);
          } catch (processingError) {
            this.logger.error(
              'Error processing upload result',
              processingError,
            );
            reject(new Error('Error processing upload result'));
          }
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      uploadStream.end(buffer);
    });
  }

  async deleteFile(publicId: string, options?: DeleteOptions): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured');
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await (cloudinary as any).uploader.destroy(publicId, {
        resource_type: options?.resourceType || 'image',
        invalidate: options?.invalidate || false,
      });

      const deleteResult = result as CloudinaryDeleteResult;

      if (deleteResult.result !== 'ok') {
        throw new Error(`Delete failed: ${deleteResult.result}`);
      }

      this.logger.log(`Successfully deleted file: ${publicId}`);
    } catch (error) {
      this.logger.error(`Delete failed for ${publicId}`, error);
      throw new Error(`Delete failed: ${(error as Error).message}`);
    }
  }

  generateThumbnail(
    publicId: string,
    options?: ThumbnailOptions,
  ): Promise<string> {
    if (!this.isConfigured) {
      return Promise.reject(new Error('Cloudinary not configured'));
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const thumbnailUrl = (cloudinary as any).url(publicId, {
        width: options?.width || 300,
        height: options?.height || 300,
        crop: options?.crop || 'fill',
        format: options?.format || 'jpg',
        quality: options?.quality || 'auto',
      });

      return Promise.resolve(thumbnailUrl as string);
    } catch (error) {
      this.logger.error(`Failed to generate thumbnail for: ${publicId}`, error);
      return Promise.reject(
        new Error(`Thumbnail generation failed: ${(error as Error).message}`),
      );
    }
  }

  private generateThumbnailUrl(publicId: string): string {
    if (!this.isConfigured) {
      return '';
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return (cloudinary as any).url(publicId, {
        width: 300,
        height: 300,
        crop: 'fill',
        format: 'jpg',
      });
    } catch (error) {
      this.logger.error(
        `Failed to generate thumbnail URL for: ${publicId}`,
        error,
      );
      return '';
    }
  }

  getSignedUrl(publicId: string, options?: SignedUrlOptions): Promise<string> {
    if (!this.isConfigured) {
      return Promise.reject(new Error('Cloudinary not configured'));
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const signedUrl = (cloudinary as any).url(publicId, {
        sign_url: true,
        secure: true,
        transformation: options?.transformation,
        expires_at: options?.expiresIn
          ? Math.floor(Date.now() / 1000) + options.expiresIn
          : undefined,
      });

      return Promise.resolve(signedUrl as string);
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL for: ${publicId}`,
        error,
      );
      return Promise.reject(
        new Error(`Signed URL generation failed: ${(error as Error).message}`),
      );
    }
  }

  async getFileInfo(publicId: string): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured');
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return await (cloudinary as any).api.resource(publicId);
    } catch (error) {
      this.logger.error(`Failed to get file info for: ${publicId}`, error);
      throw new Error(`Get file info failed: ${(error as Error).message}`);
    }
  }

  isValidFileType(mimeType: string): boolean {
    const validTypes = [
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
    return validTypes.includes(mimeType);
  }

  getMaxFileSize(fileType: 'image' | 'video'): number {
    return fileType === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
  }
}
