import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../providers';
import type { GroupMember } from '../../types';

interface MemberCardProps {
  member: GroupMember;
  currentUserRole?: 'OWNER' | 'ADMIN' | 'MEMBER';
  currentUserId?: string;
  onRemove?: (member: GroupMember) => void;
  onChangeRole?: (member: GroupMember) => void;
  showActions?: boolean;
}

export function MemberCard({ 
  member, 
  currentUserRole,
  currentUserId,
  onRemove,
  onChangeRole,
  showActions = true 
}: MemberCardProps) {
  const { isDark } = useTheme();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return isDark ? '#FFD700' : '#F59E0B';
      case 'ADMIN':
        return isDark ? '#4ECDC4' : '#14b8a6';
      default:
        return isDark ? '#A1A1AA' : '#6B7280';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'diamond-outline';
      case 'ADMIN':
        return 'shield-checkmark-outline';
      default:
        return 'person-outline';
    }
  };

  const canRemoveMember = () => {
    if (!currentUserRole || !currentUserId) return false;
    if (member.user.userId === currentUserId) return false; // Can't remove self
    if (member.role === 'OWNER') return false; // Can't remove owner
    
    if (currentUserRole === 'OWNER') return true;
    if (currentUserRole === 'ADMIN' && member.role === 'MEMBER') return true;
    
    return false;
  };

  const canChangeRole = () => {
    if (!currentUserRole || !currentUserId) return false;
    if (member.user.userId === currentUserId) return false; // Can't change own role
    if (member.role === 'OWNER') return false; // Can't change owner role
    
    return currentUserRole === 'OWNER';
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.user.fullName || member.user.username} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => onRemove?.(member)
        }
      ]
    );
  };

  const handleRoleChange = () => {
    const newRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    const action = newRole === 'ADMIN' ? 'promote' : 'demote';
    
    Alert.alert(
      'Change Role',
      `Are you sure you want to ${action} ${member.user.fullName || member.user.username} ${newRole === 'ADMIN' ? 'to Admin' : 'to Member'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action === 'promote' ? 'Promote' : 'Demote',
          onPress: () => onChangeRole?.(member)
        }
      ]
    );
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <View className="bg-light-surface dark:bg-dark-400 rounded-xl p-4 mb-3 border border-light-border dark:border-dark-300">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {/* Avatar */}
          <View className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center mr-3">
            <Text className="text-lg font-semibold text-primary-500 dark:text-primary-400">
              {(member.user.fullName || member.user.username).charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Member Info */}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text 
                className="text-base font-semibold text-light-text dark:text-white mr-2"
                numberOfLines={1}
              >
                {member.user.fullName || member.user.username}
              </Text>
              
              {/* Role Badge */}
              <View className="flex-row items-center bg-opacity-20 px-2 py-1 rounded-full" 
                    style={{ backgroundColor: `${getRoleColor(member.role)}20` }}>
                <Ionicons 
                  name={getRoleIcon(member.role) as keyof typeof Ionicons.glyphMap}
                  size={12} 
                  color={getRoleColor(member.role)}
                />
                <Text 
                  className="text-xs font-medium ml-1"
                  style={{ color: getRoleColor(member.role) }}
                >
                  {member.role}
                </Text>
              </View>
            </View>

            <Text className="text-sm text-light-text-secondary dark:text-dark-50">
              @{member.user.username}
            </Text>

            <View className="flex-row items-center mt-1">
              <Ionicons 
                name="calendar-outline" 
                size={12} 
                color={isDark ? '#A1A1AA' : '#6B7280'} 
              />
              <Text className="text-xs text-light-text-secondary dark:text-dark-50 ml-1">
                Joined {formatJoinDate(member.joinedAt)}
              </Text>
            </View>

            {member.invitedBy && (
              <View className="flex-row items-center mt-1">
                <Ionicons 
                  name="person-add-outline" 
                  size={12} 
                  color={isDark ? '#A1A1AA' : '#6B7280'} 
                />
                <Text className="text-xs text-light-text-secondary dark:text-dark-50 ml-1">
                  Invited by {member.invitedBy.fullName || member.invitedBy.username}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        {showActions && (canRemoveMember() || canChangeRole()) && (
          <View className="flex-row items-center ml-2">
            {canChangeRole() && (
              <TouchableOpacity 
                onPress={handleRoleChange}
                className="p-2 mr-1"
              >
                <Ionicons 
                  name={member.role === 'ADMIN' ? 'remove-circle-outline' : 'add-circle-outline'}
                  size={20} 
                  color={isDark ? '#4ECDC4' : '#14b8a6'} 
                />
              </TouchableOpacity>
            )}

            {canRemoveMember() && (
              <TouchableOpacity 
                onPress={handleRemove}
                className="p-2"
              >
                <Ionicons 
                  name="trash-outline" 
                  size={20} 
                  color="#FF6B6B" 
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
} 