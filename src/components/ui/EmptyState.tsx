import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Button } from './Button';

type IconName = keyof typeof Feather.glyphMap;

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing[24] }, style]}>
      {icon && (
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.primarySoft,
              marginBottom: spacing[16],
            },
          ]}
        >
          <Feather name={icon} size={32} color={colors.primary} />
        </View>
      )}
      <Text
        style={[
          styles.title,
          {
            color: colors.textPrimary,
            ...typography.font.bold,
            fontSize: typography.fontSize.lg,
            marginBottom: spacing[8],
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          {
            color: colors.textSecondary,
            ...typography.font.regular,
            fontSize: typography.fontSize.md,
            marginBottom: actionLabel ? spacing[24] : 0,
          },
        ]}
      >
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button onPress={onAction} fullWidth={false}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
