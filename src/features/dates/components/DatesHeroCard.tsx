import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SpecialDate } from '../types';
import { getCategoryMeta, formatHeroDatePTBR } from '../utils/formatting';
import { Floating3DHeart } from './Floating3DHeart';
import { CountdownDigits } from './CountdownDigits';
import { useAppTheme } from '@/lib/context/ThemeContext';
import { getThemeTokens } from '@/design/tokens/theme';

interface DatesHeroCardProps {
  nextEvent: SpecialDate | null;
  reducedMotion?: boolean;
}

export function DatesHeroCard({ nextEvent, reducedMotion }: DatesHeroCardProps) {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const styles = useMemo(() => getStyles(themeTokens, isDark), [themeTokens, isDark]);

  if (!nextEvent) return null;

  const meta = getCategoryMeta(nextEvent.category);

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(400).delay(100)}
      style={styles.heroCardContainer}
    >
      <View style={[styles.heroGradientBackground, { backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF' }]}>
        <Floating3DHeart />

        <View style={styles.heroTopSection}>
          <View style={styles.heroTextContent}>
            <View style={[styles.categoryChip, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon as any} size={11} color={meta.color} />
              <Text style={[styles.categoryChipText, { color: meta.color }]}>{meta.label}</Text>
            </View>

            <Text style={styles.heroTag}>PRÓXIMO MOMENTO</Text>

            <Text style={styles.heroTitle} numberOfLines={2}>
              {nextEvent.title}
            </Text>

            <View style={styles.heroDateRow}>
              <View style={styles.heroCalendarIconBox}>
                <Ionicons name="calendar-outline" size={13} color={themeTokens.primary} />
              </View>
              <Text style={styles.heroDateText}>
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

const getStyles = (themeTokens: any, isDark: boolean) => StyleSheet.create({
  heroCardContainer: {
    borderRadius: 28,
    marginBottom: 20,
    shadowColor: themeTokens.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  heroGradientBackground: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.85)',
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
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
  },
  heroTag: {
    fontSize: 10,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    letterSpacing: 1,
    color: themeTokens.primary,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    color: themeTokens.textPrimary,
    lineHeight: 28,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroCalendarIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(124, 111, 224, 0.20)' : '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDateText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
    color: themeTokens.textSecondary,
  },
});
