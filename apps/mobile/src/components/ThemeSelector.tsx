import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeMode } from '../contexts/ThemeContext';

export const ThemeSelector: React.FC = () => {
  const { themeMode, setThemeMode, isDark } = useTheme();

  const themeOptions: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: 'light', label: 'Light', icon: 'sunny-outline' },
    { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
    { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];

  return (
    <View className="bg-light-surface dark:bg-dark-500 rounded-xl border border-light-border dark:border-dark-400 p-4">
      <View className="flex-row items-center mb-3">
        <Ionicons 
          name="color-palette-outline" 
          size={24} 
          color={isDark ? "#4ECDC4" : "#14b8a6"} 
        />
        <Text className="flex-1 text-base font-medium text-light-text dark:text-white ml-3">
          Appearance
        </Text>
      </View>
      
      <View className="flex-row justify-between">
        {themeOptions.map((option) => (
          <TouchableOpacity
            key={option.mode}
            onPress={() => setThemeMode(option.mode)}
            className={`flex-1 items-center p-3 mx-1 rounded-lg ${
              themeMode === option.mode
                ? 'bg-primary-500 dark:bg-primary-400'
                : 'bg-light-background dark:bg-dark-400'
            }`}
          >
            <Ionicons
              name={option.icon}
              size={20}
              color={
                themeMode === option.mode
                  ? '#FFFFFF'
                  : isDark
                  ? '#8E8E93'
                  : '#6D6D80'
              }
            />
            <Text
              className={`text-sm font-medium mt-1 ${
                themeMode === option.mode
                  ? 'text-white'
                  : 'text-light-text-secondary dark:text-dark-50'
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}; 