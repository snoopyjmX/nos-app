import React from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native';
import { useTheme } from '@/theme';
import { PressableScale } from './PressableScale';

interface ButtonProps {
  children: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
}: ButtonProps) {
  const { colors, radii, spacing, typography } = useTheme();

  const getBackgroundColor = () => {
    if (disabled && variant === 'primary') return colors.primarySoft;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.primarySoft;
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled && variant === 'primary') return colors.textSecondary;
    switch (variant) {
      case 'primary':
        return colors.surface; // Texto claro sobre fundo escuro
      case 'secondary':
      case 'ghost':
        return colors.primary;
      default:
        return colors.surface;
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
          paddingVertical: spacing[12],
          paddingHorizontal: spacing[24],
          width: fullWidth ? '100%' : 'auto',
          opacity: disabled && variant !== 'primary' ? 0.5 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.fontSize.md,
            },
          ]}
        >
          {children}
        </Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48, // Tap target mínimo 44px
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    textAlign: 'center',
  },
});
