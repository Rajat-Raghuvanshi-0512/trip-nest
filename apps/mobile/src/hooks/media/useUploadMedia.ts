import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '../../services';
import type { CameraAsset, MediaUploadOptions } from '../../types';
import Toast from 'react-native-toast-message';

interface UploadMediaParams {
  groupId: string;
  asset: CameraAsset;
  options?: MediaUploadOptions;
}

export const useUploadMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, asset, options }: UploadMediaParams) =>
      mediaService.uploadMedia(groupId, asset, options),
    onSuccess: (data, variables) => {
      console.log(`[useUploadMedia] Upload successful, invalidating cache for group:`, variables.groupId);
      
      // Invalidate and refetch group media queries immediately
      queryClient.invalidateQueries({ 
        queryKey: ['group-media', variables.groupId],
        exact: false // This will match all queries that start with ['group-media', groupId]
      });
      queryClient.invalidateQueries({ queryKey: ['group-media-count', variables.groupId] });
      
      // Also trigger a manual refetch after a small delay to ensure server processing is complete
      setTimeout(() => {
        console.log(`[useUploadMedia] Manually refetching group media after delay:`, variables.groupId);
        queryClient.refetchQueries({ 
          queryKey: ['group-media', variables.groupId],
          exact: false // This will refetch all queries that start with ['group-media', groupId]
        });
        queryClient.refetchQueries({ queryKey: ['group-media-count', variables.groupId] });
      }, 1000);
      
      console.log(`[useUploadMedia] Cache invalidated for group:`, variables.groupId);
      
      Toast.show({
        type: 'success',
        text1: 'Upload Successful',
        text2: 'Your media has been uploaded successfully',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.message,
      });
    },
  });
}; 