import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../providers';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  hint?: string;
}

export function Input({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  hint,
  className,
  ...props
}: InputProps) {
  const { isDark } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const iconColor = isDark ? '#4ECDC4' : '#14b8a6';
  const placeholderColor = isDark ? '#8E8E93' : '#8E8E93';

  return (
    <View className={`${className || ''}`}>
      {label && (
        <Text className="text-base font-medium text-light-text dark:text-white mb-2">
          {label}
        </Text>
      )}
      
      <View className={`
        flex-row items-center
        bg-light-surface dark:bg-dark-400
        border border-light-border dark:border-dark-300
        rounded-xl
        px-4 py-3
        ${error ? 'border-danger-500' : 'focus:border-primary-500 dark:focus:border-primary-400'}
      `}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={error ? '#FF6B6B' : placeholderColor}
            style={{ marginRight: 12 }}
          />
        )}
        
        <TextInput
          className="flex-1 text-base text-light-text dark:text-white"
          placeholderTextColor={placeholderColor}
          secureTextEntry={isPassword && !isPasswordVisible}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity onPress={togglePasswordVisibility}>
            <Ionicons 
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color={placeholderColor}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Ionicons 
              name={rightIcon} 
              size={20} 
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text className="text-sm text-danger-500 mt-1">
          {error}
        </Text>
      )}
      
      {hint && !error && (
        <Text className="text-sm text-light-text-secondary dark:text-dark-50 mt-1">
          {hint}
        </Text>
      )}
    </View>
  );
} 