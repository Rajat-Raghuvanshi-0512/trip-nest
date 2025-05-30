import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Camera } from 'expo-camera';
import type { CameraAsset, MediaPickerOptions } from '../types';

export class CameraUtils {
  // Request camera permissions
  static async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  // Request media library permissions
  static async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  }

  // Take photo with camera
  static async takePhoto(): Promise<CameraAsset | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        type: 'image',
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
      };
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }

  // Record video with camera
  static async recordVideo(): Promise<CameraAsset | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        type: 'video',
        fileName: asset.fileName || `video_${Date.now()}.mp4`,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
        duration: asset.duration ?? undefined,
      };
    } catch (error) {
      console.error('Error recording video:', error);
      throw error;
    }
  }

  // Pick media from library
  static async pickMedia(options: MediaPickerOptions = { mediaTypes: 'all' }): Promise<CameraAsset[]> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        throw new Error('Media library permission denied');
      }

      let mediaTypes: ImagePicker.MediaTypeOptions;
      switch (options.mediaTypes) {
        case 'images':
          mediaTypes = ImagePicker.MediaTypeOptions.Images;
          break;
        case 'videos':
          mediaTypes = ImagePicker.MediaTypeOptions.Videos;
          break;
        default:
          mediaTypes = ImagePicker.MediaTypeOptions.All;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: options.allowsEditing ?? false,
        quality: options.quality ?? 0.8,
        allowsMultipleSelection: options.allowsMultipleSelection ?? false,
        selectionLimit: options.selectionLimit ?? 1,
      });

      if (result.canceled || !result.assets) {
        return [];
      }

      return result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        fileName: asset.fileName || `media_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
        duration: asset.duration ?? undefined,
      }));
    } catch (error) {
      console.error('Error picking media:', error);
      throw error;
    }
  }

  // Pick single image
  static async pickImage(): Promise<CameraAsset | null> {
    const assets = await this.pickMedia({ 
      mediaTypes: 'images',
      allowsEditing: true,
      allowsMultipleSelection: false 
    });
    return assets[0] || null;
  }

  // Pick single video
  static async pickVideo(): Promise<CameraAsset | null> {
    const assets = await this.pickMedia({ 
      mediaTypes: 'videos',
      allowsEditing: true,
      allowsMultipleSelection: false 
    });
    return assets[0] || null;
  }

  // Pick multiple images
  static async pickMultipleImages(limit: number = 10): Promise<CameraAsset[]> {
    return await this.pickMedia({ 
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: limit 
    });
  }

  // Get file size in MB
  static getFileSizeInMB(sizeInBytes?: number): number {
    if (!sizeInBytes) return 0;
    return sizeInBytes / (1024 * 1024);
  }

  // Format file size for display
  static formatFileSize(sizeInBytes?: number): string {
    if (!sizeInBytes) return 'Unknown size';
    
    const sizeInMB = this.getFileSizeInMB(sizeInBytes);
    if (sizeInMB < 1) {
      return `${Math.round(sizeInBytes / 1024)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  }

  // Format duration for display
  static formatDuration(durationInSeconds?: number): string {
    if (!durationInSeconds) return '';
    
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
} 