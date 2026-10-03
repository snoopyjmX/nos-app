import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useReducedMotion } from '@/lib/hooks/useAccessibility';
import { useTheme } from '@/theme';
import { parseEventDate, yearCycleProgress } from '../utils/formatting';

const PROGRESS_MS = 900;

interface CountdownDigitsProps {
  targetDate: string;
  title: string;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Folha isolada: o relógio de 1s re-renderiza só este componente, nunca a tela.
export const CountdownDigits = React.memo(function CountdownDigits({ targetDate, title }: CountdownDigitsProps) {
  const { colors, typography, radii, spacing } = useTheme();
  const reducedMotion = useReducedMotion();

  const calculateDiff = useCallback(() => {
    const diff = parseEventDate(targetDate).getTime() - Date.now();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isNow: true };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      isNow: false,
    };
  }, [targetDate]);

  const [countdown, setCountdown] = useState(calculateDiff);

  useEffect(() => {
    setCountdown(calculateDiff());
    let interval: ReturnType<typeof setInterval> | null = null;

    const startTimer = () => {
      if (!interval) {
        interval = setInterval(() => setCountdown(calculateDiff()), 1000);
      }
    };

    const stopTimer = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    startTimer();

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        setCountdown(calculateDiff());
        startTimer();
      } else {
        stopTimer();
      }
    });

    return () => {
      stopTimer();
      sub.remove();
    };
  }, [calculateDiff]);

  const cycle = yearCycleProgress(targetDate);
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = reducedMotion
      ? cycle
      : withTiming(cycle, { duration: PROGRESS_MS, easing: Easing.out(Easing.cubic) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle, reducedMotion]);

  // transform em vez de width: a barra desliza para dentro da trilha recortada
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.value - 1) * trackWidth }],
  }));

  if (countdown.isNow) {
    return (
      <View style={[styles.celebration, { gap: spacing[12] }]} accessible accessibilityLabel={`Chegou o dia: ${title}`}>
        <Feather name="star" size={20} color={colors.accentText} />
        <Text style={[styles.celebrationText, { color: colors.textPrimary, ...typography.font.bold }]}>
          Esse momento chegou!
        </Text>
        <Feather name="star" size={20} color={colors.accentText} />
      </View>
    );
  }

  const displays = [
    { key: 'days', value: countdown.days, label: 'DIAS' },
    { key: 'hours', value: countdown.hours, label: 'HORAS' },
    { key: 'minutes', value: countdown.minutes, label: 'MIN' },
    { key: 'seconds', value: countdown.seconds, label: 'SEG' },
  ];

  // Um único rótulo falado; os segundos nunca são anunciados em loop.
  const spokenLabel = `Faltam ${plural(countdown.days, 'dia', 'dias')}, ${plural(countdown.hours, 'hora', 'horas')} e ${plural(
    countdown.minutes,
    'minuto',
    'minutos'
  )} para ${title}. ${Math.round(cycle * 100)}% do ciclo anual vivido.`;

  return (
    <View accessible accessibilityRole="timer" accessibilityLabel={spokenLabel}>
      <View
        style={{ gap: spacing[16] }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={[styles.grid, { gap: spacing[8] }]}>
          {displays.map((display) => (
            <LiquidGlassView
              key={display.key}
              variant="pill"
              borderRadius={radii.md}
              style={styles.display}
            >
              <Text style={[styles.digit, { color: colors.textPrimary, ...typography.font.black }]}>
                {display.value.toString().padStart(2, '0')}
              </Text>
              <Text style={[styles.digitLabel, { color: colors.textSecondary, ...typography.font.bold }]}>
                {display.label}
              </Text>
            </LiquidGlassView>
          ))}
        </View>

        <View style={{ gap: spacing[8] }}>
          <View
            style={[styles.track, { backgroundColor: colors.glassBorder }]}
            onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
          >
            <Animated.View style={[styles.fill, fillStyle]}>
              <LinearGradient
                colors={colors.progressGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <Text style={[styles.progressLabel, { color: colors.textSecondary, ...typography.font.medium }]}>
            {Math.round(cycle * 100)}% do ciclo anual vivido
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  celebration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingVertical: 10,
  },
  celebrationText: {
    fontSize: 20,
  },
  grid: {
    flexDirection: 'row',
  },
  display: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize: 28,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
  },
  digitLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressLabel: {
    fontSize: 12,
  },
});
