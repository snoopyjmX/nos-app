import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SpecialDate } from '../types';
import { getCategoryMeta, formatHeroDatePTBR } from '../utils/formatting';
import { Floating3DHeart } from './Floating3DHeart';
import { CountdownDigits } from './CountdownDigits';
import { useTheme } from '@/theme';

interface DatesHeroCardProps {
  nextEvent: SpecialDate | null;
  reducedMotion?: boolean;
}

export function DatesHeroCard({ nextEvent, reducedMotion }: DatesHeroCardProps) {
  const { colors, typography, radii, shadows } = useTheme();

  if (!nextEvent) return null;

  const meta = getCategoryMeta(nextEvent.category);

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(400).delay(100)}
      style={styles.heroCardContainer}
    >
      <View 
        style={[
          styles.heroGradientBackground, 
          { 
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderColor: colors.border,
            ...shadows.soft,
          }
        ]}
      >
        <Floating3DHeart />

        <View style={styles.heroTopSection}>
          <View style={styles.heroTextContent}>
            <View style={[styles.categoryChip, { backgroundColor: meta.bg }]}>
              <Feather name={meta.icon as any} size={11} color={meta.color} />
              <Text style={[styles.categoryChipText, { color: meta.color, fontFamily: typography.fontFamily.bold }]}>{meta.label}</Text>
            </View>

            <Text style={[styles.heroTag, { color: colors.textSecondary, fontFamily: typography.fontFamily.bold }]}>PRÓXIMO MOMENTO</Text>

            <Text style={[styles.heroTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]} numberOfLines={2}>
              {nextEvent.title}
            </Text>

            <View style={styles.heroDateRow}>
              <View style={[styles.heroCalendarIconBox, { backgroundColor: colors.primarySoft }]}>
                <Feather name="calendar" size={13} color={colors.primary} />
              </View>
              <Text style={[styles.heroDateText, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
                {formatHeroDatePTBR(nextEvent.event_date)}
              </Text>
            </View>
          </View>
        </View>

        <CountdownDigits targetDate={nextEvent.event_date} createdAt={nextEvent.created_at} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  heroCardContainer: {
    marginBottom: 20,
    width: '100%',
  },
  heroGradientBackground: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroTopSection: {
    position: 'relative',
    flexDirection: 'row',
    padding: 20,
    minHeight: 120,
  },
  heroTextContent: {
    flex: 1,
    paddingRight: 110,
    justifyContent: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryChipText: {
    fontSize: 10,
  },
  heroTag: {
    fontSize: 11,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 28,
    marginBottom: 10,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroCalendarIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDateText: {
    fontSize: 13,
  },
});
