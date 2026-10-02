import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export function Card({
  children,
  style,
  variant = 'elevated',
  ...props
}: CardProps) {
  const { colors, radii, shadows, spacing } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          padding: spacing[16],
        },
        variant === 'elevated' && shadows.soft,
        variant === 'outlined' && {
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
