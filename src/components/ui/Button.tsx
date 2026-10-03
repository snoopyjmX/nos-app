import React from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
        return 'transparent'; // o gradiente lavanda é desenhado atrás do texto
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
        return colors.onPrimary; // texto escuro sobre lavanda
      case 'secondary':
      case 'ghost':
        return colors.primaryText;
      default:
        return colors.onPrimary;
    }
  };

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          borderRadius: radii.pill,
          paddingVertical: spacing[12],
          paddingHorizontal: spacing[24],
          width: fullWidth ? '100%' : 'auto',
          opacity: disabled && variant !== 'primary' ? 0.5 : 1,
          overflow: 'hidden',
          backgroundColor: disabled && variant === 'primary' ? colors.primarySoft : getBackgroundColor(),
        },
      ]}
    >
      {variant === 'primary' && !disabled ? (
        <LinearGradient
          colors={[colors.glow, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              ...typography.font.bold,
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
