import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { SpecialDate } from '../types';
import { getCategoryMeta, formatHeroDatePTBR } from '../utils/formatting';
import { CountdownDigits } from './CountdownDigits';
import { useTheme } from '@/theme';

interface DatesHeroCardProps {
  nextEvent: SpecialDate | null;
  reducedMotion?: boolean;
}

export function DatesHeroCard({ nextEvent, reducedMotion }: DatesHeroCardProps) {
  const { colors, typography, radii, spacing } = useTheme();

  if (!nextEvent) return null;

  const meta = getCategoryMeta(nextEvent.category);

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(350)}
      style={{ marginBottom: spacing[20] }}
    >
      <LiquidGlassView
        variant="hero"
        borderRadius={radii.lg}
        style={[styles.card, { padding: spacing[20], gap: spacing[16] }]}
      >
        <View style={[styles.categoryChip, { backgroundColor: meta.bg }]}>
          <Feather name={meta.icon} size={12} color={meta.color} />
          <Text style={[styles.categoryChipText, { color: meta.color, ...typography.font.medium }]}>{meta.label}</Text>
        </View>

        <View style={{ gap: spacing[8] }}>
          <Text style={[styles.tag, { color: colors.textMuted, ...typography.font.medium }]}>PRÓXIMO MOMENTO</Text>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: colors.textPrimary, ...typography.font.black }]}
          >
            {nextEvent.title}
          </Text>
          <View style={styles.dateRow}>
            <Feather name="calendar" size={14} color={colors.primaryText} />
            <Text style={[styles.dateText, { color: colors.textSecondary, ...typography.font.medium }]}>
              {formatHeroDatePTBR(nextEvent.event_date)}
            </Text>
          </View>
        </View>

        <CountdownDigits targetDate={nextEvent.event_date} title={nextEvent.title} />
      </LiquidGlassView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  categoryChipText: {
    fontSize: 12,
  },
  tag: {
    fontSize: 12,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.7,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    flexShrink: 1,
  },
});
