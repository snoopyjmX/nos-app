import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useTheme } from '@/theme';

type IconName = keyof typeof Feather.glyphMap;

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  style?: StyleProp<ViewStyle>;
}

export function Toast({ message, type = 'info', style }: ToastProps) {
  const { colors, typography, spacing, radii, shadows } = useTheme();

  let iconName: IconName = 'info';
  let iconColor: string = colors.primary;

  if (type === 'success') {
    iconName = 'check-circle';
    iconColor = colors.success;
  } else if (type === 'error') {
    iconName = 'alert-circle';
    iconColor = colors.danger;
  }

  return (
    <Animated.View
      entering={FadeInUp}
      exiting={FadeOutUp}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: radii.md,
          padding: spacing[16],
          ...shadows.medium,
        },
        style,
      ]}
    >
      <Feather name={iconName} size={20} color={iconColor} style={styles.icon} />
      <Text
        style={[
          styles.text,
          {
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.medium,
            fontSize: typography.fontSize.sm,
          },
        ]}
      >
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 200,
    maxWidth: '90%',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    flex: 1,
  },
});
