import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { mediaService } from '../../services';
import type { MediaGalleryFilters } from '../../types';

export const useGroupMedia = (
  groupId: string,
  filters?: MediaGalleryFilters,
  enabled: boolean = true
) => {
  return useInfiniteQuery({
    queryKey: ['group-media', groupId, filters],
    queryFn: ({ pageParam = 1 }) => 
      mediaService.getGroupMedia(groupId, pageParam, 20, filters),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    enabled: enabled && !!groupId,
  });
};

export const useGroupMediaCount = (groupId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['group-media-count', groupId],
    queryFn: () => mediaService.getGroupMediaCount(groupId),
    enabled: enabled && !!groupId,
  });
}; 