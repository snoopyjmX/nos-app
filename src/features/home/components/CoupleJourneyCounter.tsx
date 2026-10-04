import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { calculateAccumulatedTime, formatFullDate } from '../utils/time';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';

import { useTheme } from '@/theme';
import { motion } from '@/theme/motion';

let hasAnimatedHeroCounterThisSession = false;

// Cápsulas sobem com fade, 60ms uma após a outra, dentro da cascata da Home.
// Preset puro de propósito: na web, withInitialValues gera um keyframe próprio e o
// Reanimated 4.5.1 termina a entrada com position absolute, tirando a cápsula do fluxo.
const CAPSULE_ENTER_DELAY = 120;
const CAPSULE_STAGGER = 60;

const capsuleEntering = (index: number) =>
  FadeInDown.duration(motion.duration.normal)
    .delay(CAPSULE_ENTER_DELAY + index * CAPSULE_STAGGER)
    .easing(Easing.bezier(...motion.easing.easeOut));

interface CoupleJourneyCounterProps {
  startDate: string | null;
  /** Entrada em cascata das cápsulas; a Home liga só na primeira visita da sessão e sem Reduced Motion. */
  animateEntrance?: boolean;
}

export const CoupleJourneyCounter = React.memo(function CoupleJourneyCounter({
  startDate,
  animateEntrance = false,
}: CoupleJourneyCounterProps) {
  const { colors, typography, radii, spacing } = useTheme();
  const [timeTotals, setTimeTotals] = useState(() => calculateAccumulatedTime(startDate));
  const [animatedDays, setAnimatedDays] = useState(() => {
    return hasAnimatedHeroCounterThisSession ? timeTotals.days : 0;
  });

  useEffect(() => {
    setTimeTotals(calculateAccumulatedTime(startDate));

    let timer: ReturnType<typeof setInterval> | null = null;

    const startTimer = () => {
      if (!timer) {
        timer = setInterval(() => {
          setTimeTotals(calculateAccumulatedTime(startDate));
        }, 60000);
      }
    };

    const stopTimer = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    startTimer();

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        setTimeTotals(calculateAccumulatedTime(startDate));
        startTimer();
      } else {
        stopTimer();
      }
    };

    const handleVisibility = () => {
      if (typeof document !== 'undefined') {
        if (document.visibilityState === 'visible') {
          setTimeTotals(calculateAccumulatedTime(startDate));
          startTimer();
        } else {
          stopTimer();
        }
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppState);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      stopTimer();
      appStateSub.remove();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [startDate]);

  useEffect(() => {
    if (hasAnimatedHeroCounterThisSession) {
      setAnimatedDays(timeTotals.days);
      return;
    }

    const target = timeTotals.days;
    if (target <= 0) {
      setAnimatedDays(0);
      hasAnimatedHeroCounterThisSession = true;
      return;
    }

    hasAnimatedHeroCounterThisSession = true;
    const duration = 900;
    const startTime = Date.now();
    let frameId: number;

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(ease * target);
      setAnimatedDays(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setAnimatedDays(target);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [timeTotals.days]);

  const { breakdownMonths, breakdownDays, breakdownHours } = timeTotals;
  const sinceLabel = startDate ? `Desde ${formatFullDate(startDate)}` : 'Nossa jornada';

  const capsules = [
    { key: 'months', value: breakdownMonths, label: breakdownMonths === 1 ? 'mês' : 'meses' },
    { key: 'days', value: breakdownDays, label: breakdownDays === 1 ? 'dia' : 'dias' },
    { key: 'hours', value: breakdownHours, label: breakdownHours === 1 ? 'hora' : 'horas' },
  ];

  const spokenLabel = `${sinceLabel}. Juntos há ${timeTotals.days} ${
    timeTotals.days === 1 ? 'dia' : 'dias'
  }: ${capsules.map((c) => `${c.value} ${c.label}`).join(', ')}`;

  return (
    <View accessible accessibilityRole="text" accessibilityLabel={spokenLabel}>
      <View
        style={{ gap: spacing[16] }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.headline}>
          <Text style={[styles.since, { color: colors.textMuted, ...typography.font.medium }]}>
            {sinceLabel.toUpperCase()}
          </Text>
          <View style={styles.daysRow}>
            <Text style={[styles.daysNumber, { color: colors.textPrimary, ...typography.font.black }]}>
              {animatedDays}
            </Text>
            <Text style={[styles.daysUnit, { color: colors.primaryText, ...typography.font.black }]}>
              {timeTotals.days === 1 ? 'dia juntos' : 'dias juntos'}
            </Text>
          </View>
        </View>

        <View style={[styles.capsules, { gap: spacing[8] }]}>
          {capsules.map((capsule, index) => (
            <Animated.View
              key={capsule.key}
              entering={animateEntrance ? capsuleEntering(index) : undefined}
              style={styles.capsuleSlot}
            >
              <LiquidGlassView variant="pill" disableBlur borderRadius={radii.md} style={styles.capsule}>
                <Text style={[styles.capsuleValue, { color: colors.textPrimary, ...typography.font.bold }]}>
                  {capsule.value}
                </Text>
                <Text style={[styles.capsuleLabel, { color: colors.textSecondary, ...typography.font.medium }]}>
                  {capsule.label}
                </Text>
              </LiquidGlassView>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  headline: {
    gap: 2,
  },
  since: {
    fontSize: 12,
    letterSpacing: 1.2,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: 8,
  },
  daysNumber: {
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  daysUnit: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  capsules: {
    flexDirection: 'row',
  },
  capsuleSlot: {
    flex: 1,
    minWidth: 0,
  },
  capsule: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleValue: {
    fontSize: 24,
    lineHeight: 30,
    fontVariant: ['tabular-nums'],
  },
  capsuleLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
