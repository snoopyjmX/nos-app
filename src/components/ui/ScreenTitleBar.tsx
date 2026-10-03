import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { LiquidGlassView } from './LiquidGlassView';
import { useTheme } from '@/theme';

type IconName = keyof typeof Feather.glyphMap;

interface ScreenTitleBarProps {
  title: string;
  subtitle: string;
  topInset: number;
  actionLabel?: string;
  actionAccessibilityLabel?: string;
  actionIcon?: IconName;
  onAction?: () => void;
}

// Cabeçalho editorial das telas rolláveis: título marcante, subtítulo e uma ação em vidro.
export function ScreenTitleBar({
  title,
  subtitle,
  topInset,
  actionLabel,
  actionAccessibilityLabel,
  actionIcon = 'plus',
  onAction,
}: ScreenTitleBarProps) {
  const { colors, typography, radii, spacing } = useTheme();

  return (
    <View
      style={[
        styles.row,
        { paddingTop: topInset + spacing[12], paddingBottom: spacing[20], gap: spacing[12] },
      ]}
    >
      <View style={styles.titleBlock}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary, ...typography.font.black }]}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, ...typography.font.medium }]}>{subtitle}</Text>
      </View>

      {onAction && actionLabel ? (
      <PressableScale onPress={onAction} accessibilityRole="button" accessibilityLabel={actionAccessibilityLabel}>
        <LiquidGlassView
          variant="control"
          readable
          borderRadius={radii.pill}
          style={[styles.action, { gap: spacing[8], paddingHorizontal: spacing[16] }]}
        >
          <Feather name={actionIcon} size={18} color={colors.primaryText} />
          <Text style={[styles.actionText, { color: colors.primaryText, ...typography.font.bold }]}>{actionLabel}</Text>
        </LiquidGlassView>
      </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flexShrink: 1,
    minWidth: 160,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  action: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
  },
});
