import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { LiquidGlassView } from './LiquidGlassView';
import { LiquidGlassButton } from './LiquidGlassButton';

type IconName = keyof typeof Feather.glyphMap;

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: IconName;
  onAction?: () => void;
  card?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  card = false,
  style,
}: EmptyStateProps) {
  const { colors, typography, spacing, radii } = useTheme();

  const content = (
    <View style={[styles.container, { padding: spacing[24] }]}>
      {icon && (
        <LiquidGlassView
          variant="control"
          borderRadius={radii.pill}
          style={[
            styles.iconContainer,
            {
              borderColor: colors.border,
              marginBottom: spacing[16],
            },
          ]}
        >
          <Feather name={icon} size={28} color={colors.primary} />
        </LiquidGlassView>
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
            marginBottom: actionLabel && onAction ? spacing[20] : 0,
          },
        ]}
      >
        {description}
      </Text>
      {actionLabel && onAction && (
        <View style={styles.actionWrapper}>
          <LiquidGlassButton
            label={actionLabel}
            icon={actionIcon}
            onPress={onAction}
            variant="accent"
          />
        </View>
      )}
    </View>
  );

  if (card) {
    return (
      <LiquidGlassView
        variant="card"
        readable
        borderRadius={radii.lg}
        style={[styles.cardWrapper, style]}
      >
        {content}
      </LiquidGlassView>
    );
  }

  return <View style={[styles.wrapper, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 60,
    height: 60,
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
  actionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

