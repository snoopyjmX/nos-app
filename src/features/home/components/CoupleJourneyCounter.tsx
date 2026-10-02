import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { calculateAccumulatedTime } from '../utils/time';

let hasAnimatedHeroCounterThisSession = false;

interface CoupleJourneyCounterProps {
  startDate: string | null;
  isDark: boolean;
  themeTokens: any;
}

export const CoupleJourneyCounter = React.memo(function CoupleJourneyCounter({
  startDate,
  isDark,
  themeTokens,
}: CoupleJourneyCounterProps) {
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

  return (
    <View style={styles.journeyContent}>
      <Text style={styles.journeyLabel}>NOSSA JORNADA</Text>
      <Text style={styles.journeyTitle}>Juntos há</Text>
      <Text style={styles.journeyDaysDisplay}>{animatedDays} dias</Text>
      <View
        style={[
          styles.journeyBreakdownPill,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.18)'
              : 'rgba(240, 236, 254, 0.92)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.25)'
              : 'rgba(255, 255, 255, 0.85)',
          },
        ]}
      >
        <Text
          style={[
            styles.journeyBreakdownText,
            { color: isDark ? '#DDD6FE' : '#6D28D9' },
          ]}
        >
          {timeTotals.breakdownMonths}{' '}
          {timeTotals.breakdownMonths === 1 ? 'mês' : 'meses'} •{' '}
          {timeTotals.breakdownDays}{' '}
          {timeTotals.breakdownDays === 1 ? 'dia' : 'dias'} •{' '}
          {timeTotals.breakdownHours}h
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  journeyContent: {
    alignSelf: 'flex-start',
  },
  journeyLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 2,
  },
  journeyTitle: {
    fontSize: 22,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  journeyDaysDisplay: {
    fontSize: 40,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    color: '#DDD6FE',
    letterSpacing: -0.8,
    lineHeight: 44,
    marginBottom: 10,
    fontVariant: ['tabular-nums'],
  },
  journeyBreakdownPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  journeyBreakdownText: {
    fontSize: 13,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
