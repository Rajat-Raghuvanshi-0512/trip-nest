import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/auth/useAuth';
import { useLogout } from '../../src/hooks/auth/useLogout';
import { showToast } from '../../src/utils/toast';
import { ThemeSelector } from '../../src/components/ThemeSelector';
import { useTheme } from '../../providers';

export default function ProfileScreen() {
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const { isDark } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutMutation.mutateAsync();
              showToast.success('You have been logged out', 'Logout Successful');
              
              // Navigate to login with a small delay to ensure auth state is updated
              setTimeout(() => {
                router.replace('/(auth)/login');
              }, 100);
            } catch (error: any) {
              showToast.error(error.message || 'Failed to logout', 'Logout Failed');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-black">
      <View className="pt-5 px-5 pb-5">
        <Text className="text-3xl font-bold text-light-text dark:text-white">
          Profile
        </Text>
      </View>
      
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="items-center py-8">
          <View className="w-30 h-30 rounded-full bg-light-surface dark:bg-dark-500 border-4 border-primary-500 dark:border-primary-400 justify-center items-center mb-4">
            <Ionicons name="person" size={60} color={isDark ? "#4ECDC4" : "#14b8a6"} />
          </View>
          <Text className="text-2xl font-bold text-light-text dark:text-white mb-1">
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user?.username || 'Trip Explorer'
            }
          </Text>
          <Text className="text-base text-light-text-secondary dark:text-dark-50">
            {user?.email || 'explorer@tripshare.com'}
          </Text>
        </View>
        
        <View className="flex-row justify-around py-8 mb-5 bg-light-surface dark:bg-dark-500 rounded-xl border border-light-border dark:border-dark-400">
          <View className="items-center">
            <Text className="text-2xl font-bold text-primary-500 dark:text-primary-400 mb-1">
              0
            </Text>
            <Text className="text-sm text-light-text-secondary dark:text-dark-50">
              Trips
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-primary-500 dark:text-primary-400 mb-1">
              0
            </Text>
            <Text className="text-sm text-light-text-secondary dark:text-dark-50">
              Photos
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-primary-500 dark:text-primary-400 mb-1">
              0
            </Text>
            <Text className="text-sm text-light-text-secondary dark:text-dark-50">
              Friends
            </Text>
          </View>
        </View>
        
        {/* Theme Selector */}
        <View className="mb-5">
          <ThemeSelector />
        </View>
        
        <View className="gap-y-3">
          <TouchableOpacity className="flex-row items-center p-4 bg-light-surface dark:bg-dark-500 rounded-xl border border-light-border dark:border-dark-400">
            <Ionicons name="settings-outline" size={24} color={isDark ? "#4ECDC4" : "#14b8a6"} />
            <Text className="flex-1 text-base font-medium text-light-text dark:text-white ml-3">
              Settings
            </Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? "#8E8E93" : "#6D6D80"} />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4 bg-light-surface dark:bg-dark-500 rounded-xl border border-light-border dark:border-dark-400">
            <Ionicons name="help-circle-outline" size={24} color={isDark ? "#4ECDC4" : "#14b8a6"} />
            <Text className="flex-1 text-base font-medium text-light-text dark:text-white ml-3">
              Help & Support
            </Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? "#8E8E93" : "#6D6D80"} />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4 bg-light-surface dark:bg-dark-500 rounded-xl border border-light-border dark:border-dark-400">
            <Ionicons name="information-circle-outline" size={24} color={isDark ? "#4ECDC4" : "#14b8a6"} />
            <Text className="flex-1 text-base font-medium text-light-text dark:text-white ml-3">
              About
            </Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? "#8E8E93" : "#6D6D80"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center p-4 bg-light-surface dark:bg-dark-500 rounded-xl border border-danger-500 mt-5"
            onPress={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
            <Text className="flex-1 text-base font-medium text-danger-500 ml-3">
              {logoutMutation.isPending ? 'Logging out...' : 'Log Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 