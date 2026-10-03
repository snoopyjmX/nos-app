import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { NextMilestone } from '../types';
import { formatDaysUntil, formatMemoryDate } from '../utils/time';
import { useTheme } from '@/theme';

interface NextMilestoneCardProps {
  nextMilestone: NextMilestone | null;
  handleOpenDates: () => void;
  shouldAnimateCascade: boolean;
}

export function NextMilestoneCard({
  nextMilestone,
  handleOpenDates,
  shouldAnimateCascade,
}: NextMilestoneCardProps) {
  const { colors, typography, radii, spacing } = useTheme();

  if (!nextMilestone) return null;

  const countdown = formatDaysUntil(nextMilestone.daysRemaining);
  const dateLabel = formatMemoryDate(nextMilestone.event_date);

  return (
    <Animated.View
      entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(120) : undefined}
      style={{ marginBottom: spacing[20] }}
    >
      <PressableScale
        onPress={handleOpenDates}
        accessibilityRole="button"
        accessibilityLabel={`Próximo momento: ${nextMilestone.title}, ${countdown.toLowerCase()}`}
        accessibilityHint="Abre as datas do casal"
      >
        <LiquidGlassView variant="card" readable borderRadius={radii.md} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: colors.primarySoft, borderRadius: radii.sm }]}>
            <Feather name="star" size={20} color={colors.primaryText} />
          </View>

          <View style={styles.content}>
            <Text style={[styles.label, { color: colors.textSecondary, ...typography.font.bold }]}>
              PRÓXIMO MOMENTO
            </Text>
            <Text
              style={[styles.title, { color: colors.textPrimary, ...typography.font.bold }]}
              numberOfLines={2}
            >
              {nextMilestone.title}
            </Text>
            {dateLabel ? (
              <Text style={[styles.meta, { color: colors.textSecondary, ...typography.font.regular }]}>
                {dateLabel}
              </Text>
            ) : null}
          </View>

          <View style={[styles.chip, { backgroundColor: colors.primarySoft, borderRadius: radii.pill }]}>
            <Text style={[styles.chipText, { color: colors.primaryText, ...typography.font.bold }]}>
              {countdown}
            </Text>
          </View>
        </LiquidGlassView>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: 14,
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 120,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
  },
});
