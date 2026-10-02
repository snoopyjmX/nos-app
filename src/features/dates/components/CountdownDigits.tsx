import React, { useState, useEffect, useCallback } from 'react';
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
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme';
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
  const { colors, typography, isDark } = useTheme();
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

    const sub = AppState.addEventListener('change', handleAppState);

    return () => {
      stopTimer();
      sub.remove();
    };
  }, [calculateDiff]);

  const progressValue = useSharedValue(0);

  useEffect(() => {
    if (countdown.isNow || !createdAt) {
      progressValue.value = 1;
      return;
    }

    const targetTime = parseEventDate(targetDate).getTime();
    const startTime = new Date(createdAt).getTime();
    const totalDuration = targetTime - startTime;

    if (totalDuration <= 0) {
      progressValue.value = 1;
      return;
    }

    const currentDuration = Date.now() - startTime;
    let currentProgress = Math.max(0, Math.min(1, currentDuration / totalDuration));
    if (isNaN(currentProgress)) currentProgress = 0;

    if (!hasAnimatedProgressThisSession && !reducedMotion) {
      progressValue.value = 0;
      progressValue.value = withTiming(currentProgress, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      });
      hasAnimatedProgressThisSession = true;
    } else {
      progressValue.value = withTiming(currentProgress, {
        duration: 1000,
        easing: Easing.linear,
      });
    }
  }, [countdown.isNow, createdAt, targetDate, reducedMotion]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value * 100}%`,
    };
  });

  if (countdown.isNow) {
    return (
      <View style={[styles.bottomSection, { borderTopColor: colors.border }]}>
        <View style={styles.celebrationContainer}>
          <Feather name="star" size={20} color={colors.accent} />
          <Text style={[styles.celebrationText, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
            Esse momento chegou!
          </Text>
          <Feather name="star" size={20} color={colors.accent} />
        </View>
      </View>
    );
  }

  const formatDigit = (n: number) => n.toString().padStart(2, '0');

  return (
    <View style={[styles.bottomSection, { borderTopColor: colors.border }]}>
      <View style={styles.countdownGrid}>
        <View style={styles.digitBox}>
          <AnimatedDigitString
            value={formatDigit(countdown.days)}
            style={[styles.digitText, { color: colors.primary, fontFamily: typography.fontFamily.bold }]}
            reducedMotion={reducedMotion}
          />
          <Text style={[styles.digitLabel, { color: colors.textSecondary }]}>DIAS</Text>
        </View>
        <Text style={[styles.digitSeparator, { color: colors.border }]}>:</Text>
        <View style={styles.digitBox}>
          <AnimatedDigitString
            value={formatDigit(countdown.hours)}
            style={[styles.digitText, { color: colors.primary, fontFamily: typography.fontFamily.bold }]}
            reducedMotion={reducedMotion}
          />
          <Text style={[styles.digitLabel, { color: colors.textSecondary }]}>HRS</Text>
        </View>
        <Text style={[styles.digitSeparator, { color: colors.border }]}>:</Text>
        <View style={styles.digitBox}>
          <AnimatedDigitString
            value={formatDigit(countdown.minutes)}
            style={[styles.digitText, { color: colors.primary, fontFamily: typography.fontFamily.bold }]}
            reducedMotion={reducedMotion}
          />
          <Text style={[styles.digitLabel, { color: colors.textSecondary }]}>MIN</Text>
        </View>
        <Text style={[styles.digitSeparator, { color: colors.border }]}>:</Text>
        <View style={styles.digitBox}>
          <AnimatedDigitString
            value={formatDigit(countdown.seconds)}
            style={[styles.digitText, { color: colors.primary, fontFamily: typography.fontFamily.bold }]}
            reducedMotion={reducedMotion}
          />
          <Text style={[styles.digitLabel, { color: colors.textSecondary }]}>SEG</Text>
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.08)' }]}>
          <Animated.View style={[styles.progressBarFill, { backgroundColor: colors.primary }, progressStyle]} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  bottomSection: {
    padding: 20,
    borderTopWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  celebrationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  celebrationText: {
    fontSize: 20,
  },
  countdownGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  digitBox: {
    alignItems: 'center',
    flex: 1,
  },
  digitText: {
    fontSize: 28,
  },
  digitLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
  },
  digitSeparator: {
    fontSize: 24,
    fontWeight: '300',
    marginTop: -16,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
