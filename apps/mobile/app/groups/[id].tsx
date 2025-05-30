import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';

import { useTheme } from '../../providers';
import { Button } from '../../src/components/common';
import { MemberCard } from '../../src/components/groups';
import { MediaGallery, UploadProgress } from '../../src/components/media';
import { groupService } from '../../src/services/groupService';
import { mediaService } from '../../src/services/mediaService';
import { useUploadMedia, useGroupMediaCount } from '../../src/hooks';
import type { Group, GroupMember, GroupJoinRequest, CameraAsset, MediaUploadProgress, MediaGalleryFilters } from '../../src/types';

type TabType = 'overview' | 'members' | 'requests' | 'media';

export default function GroupDetailScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<GroupJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentUserRole, setCurrentUserRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER'>('MEMBER');
  
  // Media state
  const [uploads, setUploads] = useState<MediaUploadProgress[]>([]);
  const [mediaFilters, setMediaFilters] = useState<MediaGalleryFilters>({});
  
  const uploadMediaMutation = useUploadMedia();
  const { data: mediaCount } = useGroupMediaCount(id || '', !!id);

  useEffect(() => {
    if (id) {
      loadGroupData();
    }
  }, [id]);

  const loadGroupData = useCallback(async () => {
    if (!id) return;
    
    try {
      const [groupData, membersData] = await Promise.all([
        groupService.getGroup(id),
        groupService.getGroupMembers(id),
      ]);
      
      setGroup(groupData);
      setMembers(membersData);
      
      // Find current user's role
      const currentUser = membersData.find(member => member.user.userId === 'current-user-id'); // Replace with actual user ID
      if (currentUser) {
        setCurrentUserRole(currentUser.role);
      }

      // Load join requests if user is admin
      if (currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN')) {
        try {
          const requestsData = await groupService.getJoinRequests(id);
          setJoinRequests(requestsData);
        } catch (error) {
          // User might not have permission to view requests
          console.log('No permission to view requests');
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load group data',
      });
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  };

  const handleShareInvite = async () => {
    if (!group) return;
    
    try {
      await Share.share({
        message: `Join our group "${group.name}" on TripShare! Use invite code: ${group.inviteCode}`,
        title: `Join ${group.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.leaveGroup(id!);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'You have left the group',
              });
              router.back();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to leave group',
              });
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = async (member: GroupMember) => {
    try {
      await groupService.removeMember(id!, member.user.userId!);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Member removed successfully',
      });
      loadGroupData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to remove member',
      });
    }
  };

  const handleChangeRole = async (member: GroupMember) => {
    const newRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    try {
      await groupService.changeMemberRole(id!, member.user.userId!, { role: newRole });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Role changed to ${newRole}`,
      });
      loadGroupData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to change role',
      });
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await groupService.approveJoinRequest(requestId);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Join request approved',
      });
      loadGroupData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to approve request',
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await groupService.rejectJoinRequest(requestId);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Join request rejected',
      });
      loadGroupData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to reject request',
      });
    }
  };

  // Media handlers
  const handleMediaUpload = async (assets: CameraAsset[]) => {
    if (!id) return;

    for (const asset of assets) {
      // Validate file size
      const validation = mediaService.validateFileSize(asset);
      if (!validation.valid) {
        Toast.show({
          type: 'error',
          text1: 'File Too Large',
          text2: validation.error,
        });
        continue;
      }

      const uploadId = `upload_${Date.now()}_${Math.random()}`;
      const uploadProgress: MediaUploadProgress = {
        id: uploadId,
        fileName: asset.fileName || 'Unknown file',
        progress: 0,
        status: 'uploading',
      };

      setUploads(prev => [...prev, uploadProgress]);

      try {
        await uploadMediaMutation.mutateAsync({
          groupId: id,
          asset,
          options: {
            onProgress: (progress) => {
              setUploads(prev => prev.map(upload => 
                upload.id === uploadId 
                  ? { ...upload, progress, status: progress === 100 ? 'processing' : 'uploading' }
                  : upload
              ));
            },
            onSuccess: () => {
              setUploads(prev => prev.map(upload => 
                upload.id === uploadId 
                  ? { ...upload, progress: 100, status: 'completed' }
                  : upload
              ));
              // Remove completed upload after 3 seconds
              setTimeout(() => {
                setUploads(prev => prev.filter(upload => upload.id !== uploadId));
              }, 3000);
            },
            onError: (error) => {
              setUploads(prev => prev.map(upload => 
                upload.id === uploadId 
                  ? { ...upload, status: 'failed', error }
                  : upload
              ));
            },
          },
        });
      } catch (error) {
        // Error already handled in onError callback
      }
    }
  };

  const handleCancelUpload = (uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  };

  const handleRetryUpload = (uploadId: string) => {
    // For now, just remove the failed upload
    // In a real implementation, you'd retry the upload
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  };

  const renderTabButton = (tab: TabType, title: string, icon: string, count?: number) => (
    <TouchableOpacity
      className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-xl ${
        activeTab === tab 
          ? 'bg-primary-500 dark:bg-primary-400' 
          : 'bg-light-surface dark:bg-dark-400'
      }`}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={icon as keyof typeof Ionicons.glyphMap} 
        size={18} 
        color={activeTab === tab ? 'white' : (isDark ? '#A1A1AA' : '#6B7280')} 
      />
      <Text className={`ml-2 font-medium ${
        activeTab === tab 
          ? 'text-white' 
          : 'text-light-text-secondary dark:text-dark-50'
      }`}>
        {title}
      </Text>
      {count !== undefined && count > 0 && (
        <View className="ml-1 bg-danger-500 rounded-full w-5 h-5 items-center justify-center">
          <Text className="text-xs text-white font-bold">{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderOverviewTab = () => (
    <View className="px-5">
      {/* Group Info */}
      <View className="bg-light-surface dark:bg-dark-400 rounded-2xl p-6 mb-6 border border-light-border dark:border-dark-300">
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-3xl bg-primary-100 dark:bg-primary-900 items-center justify-center mb-4">
            <Ionicons name="people" size={32} color={isDark ? '#4ECDC4' : '#14b8a6'} />
          </View>
          <Text className="text-2xl font-bold text-light-text dark:text-white text-center">
            {group?.name}
          </Text>
          <Text className="text-base text-light-text-secondary dark:text-dark-50 text-center mt-2">
            {group?.description}
          </Text>
        </View>

        {/* Stats */}
        <View className="flex-row justify-around py-4 border-t border-light-border dark:border-dark-300">
          <View className="items-center">
            <Text className="text-2xl font-bold text-primary-500 dark:text-primary-400">
              {group?.memberCount}
            </Text>
            <Text className="text-sm text-light-text-secondary dark:text-dark-50">
              Members
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-primary-500 dark:text-primary-400">
              {mediaCount?.count || 0}
            </Text>
            <Text className="text-sm text-light-text-secondary dark:text-dark-50">
              Media
            </Text>
          </View>
          <View className="items-center">
            <View className={`w-3 h-3 rounded-full ${
              group?.isAtCapacity 
                ? 'bg-danger-500' 
                : (group?.memberCount || 0) / (group?.maxMembers || 1) > 0.8 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500'
            }`} />
            <Text className="text-sm text-light-text-secondary dark:text-dark-50 mt-1">
              Status
            </Text>
          </View>
        </View>
      </View>

      {/* Invite Code */}
      <View className="bg-light-surface dark:bg-dark-400 rounded-xl p-4 mb-6 border border-light-border dark:border-dark-300">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-medium text-light-text dark:text-white mb-1">
              Invite Code
            </Text>
            <Text className="text-lg font-mono text-primary-500 dark:text-primary-400">
              {group?.inviteCode}
            </Text>
          </View>
          <Button
            title="Share"
            variant="outline"
            size="small"
            onPress={handleShareInvite}
            icon={<Ionicons name="share-outline" size={16} color={isDark ? '#4ECDC4' : '#14b8a6'} />}
          />
        </View>
      </View>

      {/* Actions */}
      <View className="gap-y-3">
        {currentUserRole !== 'OWNER' && (
          <Button
            title="Leave Group"
            variant="danger"
            onPress={handleLeaveGroup}
            icon={<Ionicons name="exit-outline" size={20} color="white" />}
            fullWidth
          />
        )}
      </View>
    </View>
  );

  const renderMembersTab = () => (
    <View className="px-5">
      <Text className="text-lg font-semibold text-light-text dark:text-white mb-4">
        Members ({members.length})
      </Text>
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          currentUserRole={currentUserRole}
          currentUserId="current-user-id" // Replace with actual user ID
          onRemove={handleRemoveMember}
          onChangeRole={handleChangeRole}
        />
      ))}
    </View>
  );

  const renderRequestsTab = () => (
    <View className="px-5">
      <Text className="text-lg font-semibold text-light-text dark:text-white mb-4">
        Join Requests ({joinRequests.length})
      </Text>
      {joinRequests.length === 0 ? (
        <View className="items-center py-12">
          <Ionicons name="checkmark-circle" size={60} color={isDark ? '#4ECDC4' : '#14b8a6'} />
          <Text className="text-lg font-medium text-light-text dark:text-white mt-4">
            No Pending Requests
          </Text>
          <Text className="text-sm text-light-text-secondary dark:text-dark-50 text-center mt-2">
            All join requests have been processed
          </Text>
        </View>
      ) : (
        joinRequests.map((request) => (
          <View key={request.id} className="bg-light-surface dark:bg-dark-400 rounded-xl p-4 mb-3 border border-light-border dark:border-dark-300">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold text-light-text dark:text-white">
                  {request.user.fullName || request.user.username}
                </Text>
                <Text className="text-sm text-light-text-secondary dark:text-dark-50">
                  @{request.user.username}
                </Text>
                {request.message && (
                  <Text className="text-sm text-light-text dark:text-white mt-2">
                    &ldquo;{request.message}&rdquo;
                  </Text>
                )}
              </View>
              <View className="flex-row gap-x-2">
                <TouchableOpacity
                  className="bg-green-500 rounded-lg px-3 py-2"
                  onPress={() => handleApproveRequest(request.id)}
                >
                  <Ionicons name="checkmark" size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-danger-500 rounded-lg px-3 py-2"
                  onPress={() => handleRejectRequest(request.id)}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderMediaTab = () => (
    <View className="px-5">
      <UploadProgress
        uploads={uploads}
        onCancel={handleCancelUpload}
        onRetry={handleRetryUpload}
      />
      <MediaGallery
        groupId={id!}
        showUpload={true}
        onUpload={handleMediaUpload}
        filters={mediaFilters}
        onFiltersChange={setMediaFilters}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-light-background dark:bg-black">
        <View className="flex-1 items-center justify-center">
          <Ionicons name="people" size={60} color={isDark ? "#4ECDC4" : "#14b8a6"} />
          <Text className="text-lg text-light-text-secondary dark:text-dark-50 mt-4">
            Loading group...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-300">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-light-text dark:text-white">
          {group?.name}
        </Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row gap-x-2 px-5 py-4">
        {renderTabButton('overview', 'Overview', 'information-circle-outline')}
        {renderTabButton('media', 'Media', 'images-outline', mediaCount?.count)}
        {renderTabButton('members', 'Members', 'people-outline')}
        {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && 
          renderTabButton('requests', 'Requests', 'person-add-outline', joinRequests.length)
        }
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="pb-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'members' && renderMembersTab()}
          {activeTab === 'requests' && renderRequestsTab()}
          {activeTab === 'media' && renderMediaTab()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 