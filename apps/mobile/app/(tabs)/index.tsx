import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers';

export default function CameraScreen() {
  const { isDark } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-black">
      <View className="pt-5 px-5 pb-5 items-center">
        <Text className="text-2xl font-bold text-light-text dark:text-white tracking-widest">
          TRIPSHARE
        </Text>
      </View>
      
      <View className="flex-1 justify-center items-center px-5">
        <View className="items-center p-10 rounded-2xl border-2 border-dashed border-primary-500 dark:border-primary-400 bg-primary-500/10 dark:bg-primary-400/10">
          <Ionicons name="camera" size={80} color={isDark ? "#4ECDC4" : "#14b8a6"} />
          <Text className="text-2xl font-semibold text-light-text dark:text-white mt-4">
            Camera
          </Text>
          <Text className="text-base text-light-text-secondary dark:text-dark-50 mt-2 text-center">
            Capture your trip moments
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
} 