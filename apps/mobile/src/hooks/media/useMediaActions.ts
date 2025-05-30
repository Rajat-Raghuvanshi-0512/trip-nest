import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '../../services';
import type { UpdateCaptionDto } from '../../types';
import Toast from 'react-native-toast-message';

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mediaId: string) => mediaService.deleteMedia(mediaId),
    onSuccess: () => {
      // Invalidate all media queries as we don't know which group this media belonged to
      queryClient.invalidateQueries({ queryKey: ['group-media'] });
      queryClient.invalidateQueries({ queryKey: ['group-media-count'] });
      
      Toast.show({
        type: 'success',
        text1: 'Media Deleted',
        text2: 'Media item has been deleted successfully',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: error.message,
      });
    },
  });
};

export const useUpdateMediaCaption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mediaId, data }: { mediaId: string; data: UpdateCaptionDto }) =>
      mediaService.updateMediaCaption(mediaId, data),
    onSuccess: () => {
      // Invalidate media queries
      queryClient.invalidateQueries({ queryKey: ['group-media'] });
      
      Toast.show({
        type: 'success',
        text1: 'Caption Updated',
        text2: 'Media caption has been updated successfully',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message,
      });
    },
  });
};

export const useGetDownloadUrl = () => {
  return useMutation({
    mutationFn: (mediaId: string) => mediaService.getDownloadUrl(mediaId),
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Download Failed',
        text2: error.message,
      });
    },
  });
}; 