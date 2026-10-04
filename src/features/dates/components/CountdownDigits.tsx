import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useTheme } from '@/theme';
import { parseEventDate, yearCycleProgress } from '../utils/formatting';
import { CycleArcProgress } from './CycleArcProgress';

interface CountdownDigitsProps {
  targetDate: string;
  title: string;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Folha isolada: o relógio de 1s re-renderiza só este componente, nunca a tela.
export const CountdownDigits = React.memo(function CountdownDigits({ targetDate, title }: CountdownDigitsProps) {
  const { colors, typography, radii, spacing } = useTheme();

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
              disableBlur
              borderRadius={radii.md}
              style={styles.display}
            >
              <Text style={[styles.digit, { color: colors.textPrimary, ...typography.font.black }]}>
                {display.value.toString().padStart(2, '0')}
              </Text>
              <Text style={[styles.digitLabel, { color: colors.textMuted, ...typography.font.medium }]}>
                {display.label}
              </Text>
            </LiquidGlassView>
          ))}
        </View>

        <CycleArcProgress progress={cycle} percentLabel={`${Math.round(cycle * 100)}%`} />
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
    paddingVertical: 12,
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
});
