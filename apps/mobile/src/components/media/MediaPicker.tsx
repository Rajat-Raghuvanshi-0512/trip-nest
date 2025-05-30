import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../providers';
import { CameraUtils } from '../../utils/cameraUtils';
import type { CameraAsset } from '../../types';

interface MediaPickerProps {
  onMediaSelected: (assets: CameraAsset[]) => void;
  allowMultiple?: boolean;
  mediaTypes?: 'images' | 'videos' | 'all';
  maxSelection?: number;
}

export function MediaPicker({
  onMediaSelected,
  allowMultiple = false,
  mediaTypes = 'all',
  maxSelection = 10,
}: MediaPickerProps) {
  const { isDark } = useTheme();

  const showMediaOptions = () => {
    const options = [];

    if (mediaTypes === 'images' || mediaTypes === 'all') {
      options.push(
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Gallery', onPress: handlePickFromGallery }
      );
    }

    if (mediaTypes === 'videos' || mediaTypes === 'all') {
      options.push({ text: 'Record Video', onPress: handleRecordVideo });
    }

    options.push({ text: 'Cancel', style: 'cancel' as const });

    Alert.alert('Select Media', 'Choose an option', options);
  };

  const handleTakePhoto = async () => {
    try {
      const asset = await CameraUtils.takePhoto();
      if (asset) {
        onMediaSelected([asset]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleRecordVideo = async () => {
    try {
      const asset = await CameraUtils.recordVideo();
      if (asset) {
        onMediaSelected([asset]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record video. Please try again.');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      let assets: CameraAsset[];
      
      if (allowMultiple) {
        assets = await CameraUtils.pickMedia({
          mediaTypes,
          allowsMultipleSelection: true,
          selectionLimit: maxSelection,
        });
      } else {
        const singleAsset = mediaTypes === 'images' 
          ? await CameraUtils.pickImage()
          : mediaTypes === 'videos'
          ? await CameraUtils.pickVideo()
          : await CameraUtils.pickImage(); // Default to image for 'all'
        
        assets = singleAsset ? [singleAsset] : [];
      }

      if (assets.length > 0) {
        onMediaSelected(assets);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick media. Please try again.');
    }
  };

  const getIconName = () => {
    switch (mediaTypes) {
      case 'images':
        return 'camera' as const;
      case 'videos':
        return 'videocam' as const;
      default:
        return 'add' as const;
    }
  };

  const getButtonText = () => {
    switch (mediaTypes) {
      case 'images':
        return allowMultiple ? 'Add Photos' : 'Add Photo';
      case 'videos':
        return allowMultiple ? 'Add Videos' : 'Add Video';
      default:
        return allowMultiple ? 'Add Media' : 'Add Media';
    }
  };

  return (
    <TouchableOpacity
      onPress={showMediaOptions}
      className={`
        ${isDark ? 'bg-dark-400' : 'bg-light-surface'}
        border-2 border-dashed
        ${isDark ? 'border-dark-300' : 'border-light-border'}
        rounded-xl
        p-6
        items-center
        justify-center
        min-h-[120px]
      `}
    >
      <View className="items-center">
        <View
          className={`
            ${isDark ? 'bg-primary-400/20' : 'bg-primary-500/20'}
            rounded-full
            p-3
            mb-3
          `}
        >
          <Ionicons
            name={getIconName()}
            size={32}
            color={isDark ? '#4ECDC4' : '#14b8a6'}
          />
        </View>
        <Text
          className={`
            ${isDark ? 'text-white' : 'text-light-text'}
            text-base
            font-medium
            text-center
          `}
        >
          {getButtonText()}
        </Text>
        <Text
          className={`
            ${isDark ? 'text-dark-200' : 'text-light-text/60'}
            text-sm
            text-center
            mt-1
          `}
        >
          Tap to select from camera or gallery
        </Text>
      </View>
    </TouchableOpacity>
  );
} 