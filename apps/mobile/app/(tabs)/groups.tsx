import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers';

export default function GroupsScreen() {
  const { isDark } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-black">
      <View className="pt-5 px-5 pb-5">
        <Text className="text-3xl font-bold text-light-text dark:text-white">
          Groups
        </Text>
      </View>
      
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="items-center py-15">
          <Ionicons name="people" size={80} color={isDark ? "#4ECDC4" : "#14b8a6"} />
          <Text className="text-2xl font-semibold text-light-text dark:text-white mt-5 mb-3">
            No Groups Yet
          </Text>
          <Text className="text-base text-light-text-secondary dark:text-dark-50 text-center leading-6 mx-5">
            Join or create groups to start sharing your trips with friends
          </Text>
        </View>
        
        <View className="mt-10 gap-y-4">
          <TouchableOpacity className="flex-row items-center p-5 bg-light-surface dark:bg-dark-500 border border-light-border dark:border-dark-400 rounded-xl">
            <Ionicons name="add-circle-outline" size={24} color={isDark ? "#4ECDC4" : "#14b8a6"} />
            <Text className="text-lg font-medium text-light-text dark:text-white ml-3">
              Create Group
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-5 bg-light-surface dark:bg-dark-500 border border-light-border dark:border-dark-400 rounded-xl">
            <Ionicons name="search-outline" size={24} color={isDark ? "#4ECDC4" : "#14b8a6"} />
            <Text className="text-lg font-medium text-light-text dark:text-white ml-3">
              Find Groups
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 