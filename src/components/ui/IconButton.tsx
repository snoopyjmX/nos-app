import React from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { PressableScale } from './PressableScale';

type IconName = keyof typeof Feather.glyphMap;

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: number;
  disabled?: boolean;
  loading?: boolean;
}

export function IconButton({
  icon,
  onPress,
  variant = 'ghost',
  size = 24,
  disabled = false,
  loading = false,
}: IconButtonProps) {
  const { colors, radii } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.primarySoft;
      case 'ghost': return 'transparent';
      default: return 'transparent';
    }
  };

  const getIconColor = () => {
    if (disabled && variant === 'primary') return colors.textSecondary;
    switch (variant) {
      case 'primary': return colors.surface;
      case 'secondary': return colors.primary;
      case 'ghost': return colors.textSecondary;
      default: return colors.primary;
    }
  };

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: radii.pill,
          width: size + 20,
          height: size + 20,
          opacity: disabled && variant !== 'primary' ? 0.5 : 1,
        },
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={getIconColor()} size="small" />
      ) : (
        <Feather name={icon} size={size} color={getIconColor()} />
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
});
