import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../providers';
import type { Group } from '../../types';

interface GroupCardProps {
  group: Group;
  onPress: () => void;
  showMembers?: boolean;
}

export function GroupCard({ group, onPress, showMembers = true }: GroupCardProps) {
  const { isDark } = useTheme();

  const formatMemberCount = (count: number) => {
    return count === 1 ? '1 member' : `${count} members`;
  };

  return (
    <TouchableOpacity
      className="bg-light-surface dark:bg-dark-400 rounded-2xl p-4 mb-4 border border-light-border dark:border-dark-300"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        {/* Group Avatar/Cover */}
        <View className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900 items-center justify-center mr-4">
          {group.coverImage ? (
            <Image 
              source={{ uri: group.coverImage }} 
              className="w-full h-full rounded-2xl"
              resizeMode="cover"
            />
          ) : (
            <Ionicons 
              name="people" 
              size={28} 
              color={isDark ? '#4ECDC4' : '#14b8a6'} 
            />
          )}
        </View>

        {/* Group Info */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text 
              className="text-lg font-semibold text-light-text dark:text-white"
              numberOfLines={1}
            >
              {group.name}
            </Text>
            
            {/* Privacy indicator */}
            <View className="flex-row items-center">
              {group.isPublic ? (
                <Ionicons 
                  name="globe-outline" 
                  size={16} 
                  color={isDark ? '#A1A1AA' : '#6B7280'} 
                />
              ) : (
                <Ionicons 
                  name="lock-closed-outline" 
                  size={16} 
                  color={isDark ? '#A1A1AA' : '#6B7280'} 
                />
              )}
            </View>
          </View>

          {group.description && (
            <Text 
              className="text-sm text-light-text-secondary dark:text-dark-50 mb-2"
              numberOfLines={2}
            >
              {group.description}
            </Text>
          )}

          {/* Member count and capacity */}
          {showMembers && (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons 
                  name="people-outline" 
                  size={14} 
                  color={isDark ? '#A1A1AA' : '#6B7280'} 
                />
                <Text className="text-sm text-light-text-secondary dark:text-dark-50 ml-1">
                  {formatMemberCount(group.memberCount)}
                </Text>
              </View>

              {/* Capacity indicator */}
              <View className="flex-row items-center">
                <View className={`
                  w-2 h-2 rounded-full mr-1 
                  ${group.isAtCapacity 
                    ? 'bg-danger-500' 
                    : group.memberCount / group.maxMembers > 0.8 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                  }
                `} />
                <Text className="text-xs text-light-text-secondary dark:text-dark-50">
                  {group.memberCount}/{group.maxMembers}
                </Text>
              </View>
            </View>
          )}

          {/* Additional info badges */}
          <View className="flex-row items-center mt-2 flex-wrap">
            {group.requiresApproval && (
              <View className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded-full mr-2 mb-1">
                <Text className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                  Approval Required
                </Text>
              </View>
            )}
            
            {group.isAtCapacity && (
              <View className="bg-danger-100 dark:bg-danger-900 px-2 py-1 rounded-full mr-2 mb-1">
                <Text className="text-xs text-danger-800 dark:text-danger-200 font-medium">
                  Full
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
} 