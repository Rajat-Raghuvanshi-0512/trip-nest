import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../providers';
import type { MediaUploadProgress } from '../../types';

interface UploadProgressProps {
  uploads: MediaUploadProgress[];
  onCancel?: (uploadId: string) => void;
  onRetry?: (uploadId: string) => void;
}

export function UploadProgress({ uploads, onCancel, onRetry }: UploadProgressProps) {
  const { isDark } = useTheme();

  if (uploads.length === 0) return null;

  const renderUploadItem = (upload: MediaUploadProgress) => {
    const getStatusColor = () => {
      switch (upload.status) {
        case 'uploading':
        case 'processing':
          return isDark ? '#4ECDC4' : '#14b8a6';
        case 'completed':
          return '#10B981';
        case 'failed':
          return '#EF4444';
        default:
          return isDark ? '#6B7280' : '#9CA3AF';
      }
    };

    const getStatusIcon = () => {
      switch (upload.status) {
        case 'uploading':
        case 'processing':
          return 'cloud-upload-outline';
        case 'completed':
          return 'checkmark-circle';
        case 'failed':
          return 'alert-circle';
        default:
          return 'cloud-outline';
      }
    };

    return (
      <View
        key={upload.id}
        className={`
          ${isDark ? 'bg-dark-400' : 'bg-light-surface'}
          rounded-lg
          p-3
          mb-2
          border
          ${isDark ? 'border-dark-300' : 'border-light-border'}
        `}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <Ionicons
              name={getStatusIcon() as any}
              size={20}
              color={getStatusColor()}
            />
            <Text
              className={`
                ml-2 font-medium flex-1
                ${isDark ? 'text-white' : 'text-light-text'}
              `}
              numberOfLines={1}
            >
              {upload.fileName}
            </Text>
          </View>

          <View className="flex-row items-center">
            {upload.status === 'failed' && onRetry && (
              <TouchableOpacity
                onPress={() => onRetry(upload.id)}
                className="mr-2 p-1"
              >
                <Ionicons
                  name="refresh"
                  size={16}
                  color={isDark ? '#4ECDC4' : '#14b8a6'}
                />
              </TouchableOpacity>
            )}
            
            {(upload.status === 'uploading' || upload.status === 'failed') && onCancel && (
              <TouchableOpacity
                onPress={() => onCancel(upload.id)}
                className="p-1"
              >
                <Ionicons
                  name="close"
                  size={16}
                  color={isDark ? '#6B7280' : '#9CA3AF'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Progress bar */}
        {(upload.status === 'uploading' || upload.status === 'processing') && (
          <View className="mb-2">
            <View
              className={`
                h-2 rounded-full
                ${isDark ? 'bg-dark-300' : 'bg-light-border'}
              `}
            >
              <View
                className="h-full rounded-full bg-primary-500"
                style={{ width: `${upload.progress}%` }}
              />
            </View>
            <Text
              className={`
                text-xs mt-1
                ${isDark ? 'text-dark-200' : 'text-light-text/60'}
              `}
            >
              {upload.status === 'processing' ? 'Processing...' : `${upload.progress}%`}
            </Text>
          </View>
        )}

        {/* Status message */}
        <Text
          className={`
            text-xs capitalize
            ${upload.status === 'failed' 
              ? 'text-red-500' 
              : upload.status === 'completed'
              ? 'text-green-500'
              : isDark ? 'text-dark-200' : 'text-light-text/60'
            }
          `}
        >
          {upload.status === 'failed' && upload.error 
            ? upload.error 
            : upload.status
          }
        </Text>
      </View>
    );
  };

  return (
    <View className="mb-4">
      <Text
        className={`
          text-sm font-medium mb-3
          ${isDark ? 'text-white' : 'text-light-text'}
        `}
      >
        Uploads ({uploads.length})
      </Text>
      {uploads.map(renderUploadItem)}
    </View>
  );
} 