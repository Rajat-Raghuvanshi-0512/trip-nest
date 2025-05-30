import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

import { useTheme } from '../../providers';
import { Button, Input } from '../../src/components/common';
import { groupService } from '../../src/services/groupService';
import type { CreateGroupDto } from '../../src/types';

export default function CreateGroupScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateGroupDto>({
    name: '',
    description: '',
    maxMembers: 10,
    isPublic: false,
    requiresApproval: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Group name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (formData.maxMembers && (formData.maxMembers < 2 || formData.maxMembers > 100)) {
      newErrors.maxMembers = 'Max members must be between 2 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const group = await groupService.createGroup(formData);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Group created successfully!',
      });
      router.replace(`/groups/${group.id}` as any);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create group',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof CreateGroupDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-300">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDark ? '#FFFFFF' : '#000000'} 
          />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-light-text dark:text-white">
          Create Group
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="py-6">
          {/* Group Icon */}
          <View className="items-center mb-8">
            <View className="w-24 h-24 rounded-3xl bg-primary-100 dark:bg-primary-900 items-center justify-center">
              <Ionicons 
                name="people" 
                size={40} 
                color={isDark ? '#4ECDC4' : '#14b8a6'} 
              />
            </View>
            <Text className="text-sm text-light-text-secondary dark:text-dark-50 mt-2">
              Group Icon
            </Text>
          </View>

          {/* Form Fields */}
          <View className="gap-y-4">
            <Input
              label="Group Name"
              placeholder="Enter group name"
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              error={errors.name}
              icon="people-outline"
              maxLength={50}
            />

            <Input
              label="Description"
              placeholder="Describe your group"
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              error={errors.description}
              icon="document-text-outline"
              multiline
              numberOfLines={3}
              maxLength={500}
              style={{ height: 80, textAlignVertical: 'top' }}
            />

            <Input
              label="Maximum Members"
              placeholder="10"
              value={formData.maxMembers?.toString() || ''}
              onChangeText={(text) => {
                const num = parseInt(text) || 10;
                updateFormData('maxMembers', num);
              }}
              error={errors.maxMembers}
              icon="person-add-outline"
              keyboardType="numeric"
              maxLength={3}
            />

            {/* Settings */}
            <View className="mt-6">
              <Text className="text-lg font-semibold text-light-text dark:text-white mb-4">
                Group Settings
              </Text>

              {/* Public/Private Toggle */}
              <View className="bg-light-surface dark:bg-dark-400 rounded-xl p-4 mb-4 border border-light-border dark:border-dark-300">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Ionicons 
                        name={formData.isPublic ? "globe-outline" : "lock-closed-outline"} 
                        size={20} 
                        color={isDark ? '#4ECDC4' : '#14b8a6'} 
                      />
                      <Text className="text-base font-medium text-light-text dark:text-white ml-2">
                        {formData.isPublic ? 'Public Group' : 'Private Group'}
                      </Text>
                    </View>
                    <Text className="text-sm text-light-text-secondary dark:text-dark-50">
                      {formData.isPublic 
                        ? 'Anyone can find and request to join this group'
                        : 'Only people with invite links can join this group'
                      }
                    </Text>
                  </View>
                  <Switch
                    value={formData.isPublic}
                    onValueChange={(value) => updateFormData('isPublic', value)}
                    trackColor={{ 
                      false: isDark ? '#3a3a3c' : '#D1D1D6', 
                      true: isDark ? '#4ECDC4' : '#14b8a6' 
                    }}
                    thumbColor={formData.isPublic ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>
              </View>

              {/* Approval Required Toggle */}
              <View className="bg-light-surface dark:bg-dark-400 rounded-xl p-4 border border-light-border dark:border-dark-300">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Ionicons 
                        name={formData.requiresApproval ? "checkmark-circle-outline" : "enter-outline"} 
                        size={20} 
                        color={isDark ? '#4ECDC4' : '#14b8a6'} 
                      />
                      <Text className="text-base font-medium text-light-text dark:text-white ml-2">
                        {formData.requiresApproval ? 'Approval Required' : 'Auto Join'}
                      </Text>
                    </View>
                    <Text className="text-sm text-light-text-secondary dark:text-dark-50">
                      {formData.requiresApproval 
                        ? 'New members need approval from admins'
                        : 'New members can join immediately'
                      }
                    </Text>
                  </View>
                  <Switch
                    value={formData.requiresApproval}
                    onValueChange={(value) => updateFormData('requiresApproval', value)}
                    trackColor={{ 
                      false: isDark ? '#3a3a3c' : '#D1D1D6', 
                      true: isDark ? '#4ECDC4' : '#14b8a6' 
                    }}
                    thumbColor={formData.requiresApproval ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View className="px-5 py-4 border-t border-light-border dark:border-dark-300">
        <Button
          title="Create Group"
          onPress={handleSubmit}
          loading={loading}
          icon={!loading ? <Ionicons name="add" size={20} color="white" /> : undefined}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
} 