import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/ui';
import { useTheme } from '@/theme';

interface HomeSectionHeaderProps {
  title: string;
  actionLabel: string;
  actionAccessibilityLabel: string;
  onActionPress: () => void;
}

export function HomeSectionHeader({
  title,
  actionLabel,
  actionAccessibilityLabel,
  onActionPress,
}: HomeSectionHeaderProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.row, { marginBottom: spacing[8] }]}>
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: colors.textSecondary, ...typography.font.bold }]}
      >
        {title}
      </Text>
      <PressableScale
        onPress={onActionPress}
        hitSlop={8}
        style={styles.action}
        accessibilityRole="button"
        accessibilityLabel={actionAccessibilityLabel}
      >
        <Text style={[styles.actionText, { color: colors.primaryText, ...typography.font.bold }]}>
          {actionLabel}
        </Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 12,
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
  },
});
