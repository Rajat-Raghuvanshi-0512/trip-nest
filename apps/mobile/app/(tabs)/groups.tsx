import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  SafeAreaView, 
  RefreshControl,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

import { useTheme } from '../../providers';
import { Button } from '../../src/components/common';
import { GroupCard } from '../../src/components/groups';
import { groupService } from '../../src/services/groupService';
import type { Group } from '../../src/types';

export default function GroupsScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await groupService.getMyGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load groups'
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleGroupPress = (group: Group) => {
    router.push(`/groups/${group.id}` as any);
  };

  const handleCreateGroup = () => {
    router.push('/groups/create' as any);
  };

  const handleJoinWithCode = () => {
    Alert.prompt(
      'Join Group',
      'Enter the group invite code:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Join', 
          onPress: async (code) => {
            if (code && code.trim()) {
              try {
                await groupService.joinWithCode(code.trim().toUpperCase());
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: 'Successfully joined the group!'
                });
                loadGroups();
              } catch (error: any) {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: error.message || 'Failed to join group'
                });
              }
            }
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const renderEmptyState = () => (
    <View className="items-center py-20">
      <Ionicons name="people" size={80} color={isDark ? "#4ECDC4" : "#14b8a6"} />
      <Text className="text-2xl font-semibold text-light-text dark:text-white mt-5 mb-3">
        No Groups Yet
      </Text>
      <Text className="text-base text-light-text-secondary dark:text-dark-50 text-center leading-6 mx-5 mb-8">
        Join or create groups to start sharing your trips with friends
      </Text>
      
      <View className="w-full px-5 gap-y-3">
        <Button
          title="Create Group"
          onPress={handleCreateGroup}
          icon={<Ionicons name="add" size={20} color="white" />}
          fullWidth
        />
        <Button
          title="Join with Code"
          variant="outline"
          onPress={handleJoinWithCode}
          icon={<Ionicons name="keypad-outline" size={20} color={isDark ? "#4ECDC4" : "#14b8a6"} />}
          fullWidth
        />
      </View>
    </View>
  );

  const renderGroupsList = () => (
    <View className="px-5">
      {/* Header Actions */}
      <View className="flex-row gap-x-3 mb-6">
        <Button
          title="Create"
          onPress={handleCreateGroup}
          icon={<Ionicons name="add" size={18} color="white" />}
          size="small"
          className="flex-1"
        />
        <Button
          title="Join"
          variant="outline"
          onPress={handleJoinWithCode}
          icon={<Ionicons name="keypad-outline" size={18} color={isDark ? "#4ECDC4" : "#14b8a6"} />}
          size="small"
          className="flex-1"
        />
      </View>

      {/* Groups List */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-light-text dark:text-white mb-4">
          My Groups ({groups.length})
        </Text>
        
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onPress={() => handleGroupPress(group)}
          />
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-light-background dark:bg-black">
        <View className="pt-5 px-5 pb-5">
          <Text className="text-3xl font-bold text-light-text dark:text-white">
            Groups
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Ionicons name="people" size={60} color={isDark ? "#4ECDC4" : "#14b8a6"} />
          <Text className="text-lg text-light-text-secondary dark:text-dark-50 mt-4">
            Loading groups...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-black">
      <View className="pt-5 px-5 pb-5">
        <Text className="text-3xl font-bold text-light-text dark:text-white">
          Groups
        </Text>
      </View>
      
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {groups.length === 0 ? renderEmptyState() : renderGroupsList()}
      </ScrollView>
    </SafeAreaView>
  );
} 