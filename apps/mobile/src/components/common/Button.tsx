import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { useTheme } from '../../../providers';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const { isDark } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return `${
          isDark 
            ? 'bg-primary-400 active:bg-primary-500' 
            : 'bg-primary-500 active:bg-primary-600'
        }`;
      case 'secondary':
        return 'bg-light-surface dark:bg-dark-400 active:bg-light-border dark:active:bg-dark-300';
      case 'danger':
        return 'bg-danger-500 active:bg-danger-600';
      case 'outline':
        return `border-2 ${
          isDark 
            ? 'border-primary-400 active:bg-primary-400/10' 
            : 'border-primary-500 active:bg-primary-500/10'
        } bg-transparent`;
      default:
        return '';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-2';
      case 'medium':
        return 'px-4 py-3';
      case 'large':
        return 'px-6 py-4';
      default:
        return '';
    }
  };

  const getTextStyles = () => {
    const baseStyles = 'font-semibold text-center';
    
    if (variant === 'outline') {
      return `${baseStyles} ${
        isDark ? 'text-primary-400' : 'text-primary-500'
      }`;
    }
    
    if (variant === 'secondary') {
      return `${baseStyles} text-light-text dark:text-white`;
    }
    
    return `${baseStyles} text-white`;
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      default:
        return '';
    }
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50' : ''}
        rounded-xl
        flex-row
        items-center
        justify-center
        ${className || ''}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'secondary' 
            ? (isDark ? '#4ECDC4' : '#14b8a6') 
            : 'white'
          } 
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text className={`${getTextStyles()} ${getTextSizeStyles()} ${icon ? 'ml-2' : ''}`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
} 