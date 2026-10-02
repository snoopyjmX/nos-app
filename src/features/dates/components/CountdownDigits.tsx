import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  useReducedMotion,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppTheme } from '@/lib/context/ThemeContext';
import { getThemeTokens } from '@/design/tokens/theme';
import { parseEventDate } from '../utils/formatting';

let hasAnimatedProgressThisSession = false;

interface AnimatedDigitStringProps {
  value: string;
  style?: any;
  reducedMotion?: boolean;
}

const AnimatedDigitString = React.memo(function AnimatedDigitString({
  value,
  style,
  reducedMotion,
}: AnimatedDigitStringProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Text
        key={value}
        entering={reducedMotion ? undefined : FadeInDown.duration(200)}
        exiting={reducedMotion ? undefined : FadeOutDown.duration(200)}
        style={[style, { fontVariant: ['tabular-nums'], position: 'absolute' }]}
      >
        {value}
      </Animated.Text>
      <Text style={[style, { opacity: 0, fontVariant: ['tabular-nums'] }]}>{value}</Text>
    </View>
  );
});

interface CountdownDigitsProps {
  targetDate: string;
  createdAt?: string;
}

export const CountdownDigits = React.memo(function CountdownDigits({ targetDate, createdAt }: CountdownDigitsProps) {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const styles = useMemo(() => getStyles(themeTokens, isDark), [themeTokens, isDark]);
  const reducedMotion = useReducedMotion();

  const calculateDiff = useCallback(() => {
    const target = parseEventDate(targetDate).getTime();
    const diff = target - Date.now();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isNow: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isNow: false };
  }, [targetDate]);

  const [countdown, setCountdown] = useState(calculateDiff);

  useEffect(() => {
    setCountdown(calculateDiff());
    let interval: ReturnType<typeof setInterval> | null = null;

    const startTimer = () => {
      if (!interval) {
        interval = setInterval(() => {
          setCountdown(calculateDiff());
        }, 1000);
      }
    };

    const stopTimer = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    startTimer();

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        setCountdown(calculateDiff());
        startTimer();
      } else {
        stopTimer();
      }
    };

    const handleVisibility = () => {
      if (typeof document !== 'undefined') {
        if (document.visibilityState === 'visible') {
          setCountdown(calculateDiff());
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
  }, [calculateDiff]);

  const targetProgress = useMemo(() => {
    const targetMs = new Date(targetDate).getTime();
    if (isNaN(targetMs)) return 0.5;
    const fallbackCreatedMs = targetMs - 30 * 24 * 60 * 60 * 1000;
    const parsedCreatedMs = createdAt ? new Date(createdAt).getTime() : NaN;
    const validCreatedMs = (!isNaN(parsedCreatedMs) && parsedCreatedMs < targetMs)
      ? parsedCreatedMs
      : fallbackCreatedMs;
    const totalDuration = Math.max(1, targetMs - validCreatedMs);
    const elapsed = Math.max(0, Math.min(totalDuration, Date.now() - validCreatedMs));
    return Math.max(0.04, Math.min(1, elapsed / totalDuration));
  }, [targetDate, createdAt]);

  const progress = useSharedValue(hasAnimatedProgressThisSession ? targetProgress : 0);

  useEffect(() => {
    if (!hasAnimatedProgressThisSession) {
      hasAnimatedProgressThisSession = true;
      progress.value = withTiming(targetProgress, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = withTiming(targetProgress, { duration: 300 });
    }
  }, [targetProgress, progress]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${Math.max(4, Math.min(100, progress.value * 100))}%`,
  }));

  if (countdown.isNow) {
    return (
      <View style={styles.eventHappeningBox}>
        <Ionicons name="heart" size={20} color="#7C3AED" />
        <Text style={styles.eventHappeningText}>É hoje! Aproveitem cada segundo.</Text>
      </View>
    );
  }

  return (
    <View style={styles.lowerCountdownPanel}>
      <View style={styles.progressBarTrack}>
        <Animated.View style={[styles.progressBarFill, progressBarStyle]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#8E7CE8', opacity: 0.8 }]} />
          <View style={styles.progressTipHeart}>
            <Ionicons name="heart" size={8} color="#FFFFFF" />
          </View>
        </Animated.View>
      </View>

      <View style={styles.countdownColumnsRow}>
        <View style={styles.countColumn}>
          <AnimatedDigitString
            value={String(countdown.days)}
            style={styles.countNumber}
            reducedMotion={reducedMotion}
          />
          <Text style={styles.countLabel}>DIAS</Text>
        </View>

        <View style={styles.columnDivider} />

        <View style={styles.countColumn}>
          <AnimatedDigitString
            value={String(countdown.hours).padStart(2, '0')}
            style={styles.countNumber}
            reducedMotion={reducedMotion}
          />
          <Text style={styles.countLabel}>HORAS</Text>
        </View>

        <View style={styles.columnDivider} />

        <View style={styles.countColumn}>
          <AnimatedDigitString
            value={String(countdown.minutes).padStart(2, '0')}
            style={styles.countNumber}
            reducedMotion={reducedMotion}
          />
          <Text style={styles.countLabel}>MINUTOS</Text>
        </View>

        <View style={styles.columnDivider} />

        <View style={styles.countColumn}>
          <AnimatedDigitString
            value={String(countdown.seconds).padStart(2, '0')}
            style={styles.countNumber}
            reducedMotion={reducedMotion}
          />
          <Text style={styles.countLabel}>SEGUNDOS</Text>
        </View>
      </View>
    </View>
  );
});

const getStyles = (themeTokens: any, isDark: boolean) => StyleSheet.create({
  lowerCountdownPanel: {
    backgroundColor: isDark ? '#1C1835' : '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124, 111, 224, 0.08)',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
    marginBottom: 20,
    overflow: 'visible',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
  },
  progressTipHeart: {
    position: 'absolute',
    right: -6,
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: themeTokens.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: themeTokens.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  countdownColumnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countColumn: {
    alignItems: 'center',
    flex: 1,
  },
  countNumber: {
    fontSize: 22,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    color: themeTokens.textPrimary,
    marginBottom: 4,
  },
  countLabel: {
    fontSize: 10,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    color: themeTokens.textSecondary,
    letterSpacing: 0.8,
  },
  columnDivider: {
    width: 1,
    height: 24,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(124, 111, 224, 0.15)',
  },
  eventHappeningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: isDark ? 'rgba(124, 111, 224, 0.12)' : 'rgba(124, 111, 224, 0.05)',
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(124, 111, 224, 0.2)' : 'rgba(124, 111, 224, 0.1)',
    gap: 8,
  },
  eventHappeningText: {
    fontSize: 15,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    color: themeTokens.textPrimary,
  },
});
