import React, { useEffect, useId } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/lib/hooks/useAccessibility';
import { useTheme } from '@/theme';

const PROGRESS_MS = 900;
const STROKE_WIDTH = 6;

// Arco horizontal: curva quadrática suave dentro do viewBox.
const VIEWBOX_WIDTH = 300;
const VIEWBOX_HEIGHT = 36;
const P0 = { x: 10, y: 30 };
const P1 = { x: 150, y: 2 };
const P2 = { x: 290, y: 30 };
const ARC_PATH = `M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`;

// Tabela de comprimento de arco: permite achar o ponto da curva para uma fração do percurso.
const LUT_STEPS = 64;
const LUT_X: number[] = [];
const LUT_Y: number[] = [];
const LUT_LEN: number[] = [];
for (let i = 0; i <= LUT_STEPS; i += 1) {
  const t = i / LUT_STEPS;
  const u = 1 - t;
  LUT_X.push(u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x);
  LUT_Y.push(u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y);
  LUT_LEN.push(
    i === 0 ? 0 : LUT_LEN[i - 1] + Math.hypot(LUT_X[i] - LUT_X[i - 1], LUT_Y[i] - LUT_Y[i - 1]),
  );
}
const ARC_LENGTH = LUT_LEN[LUT_STEPS];

function pointAt(fraction: number) {
  'worklet';
  const target = Math.min(Math.max(fraction, 0), 1) * ARC_LENGTH;
  let i = 1;
  while (i < LUT_STEPS && LUT_LEN[i] < target) {
    i += 1;
  }
  const span = LUT_LEN[i] - LUT_LEN[i - 1];
  const k = span > 0 ? (target - LUT_LEN[i - 1]) / span : 0;
  return {
    x: LUT_X[i - 1] + (LUT_X[i] - LUT_X[i - 1]) * k,
    y: LUT_Y[i - 1] + (LUT_Y[i] - LUT_Y[i - 1]) * k,
  };
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CycleArcProgressProps {
  /** Fração do ciclo anual, de 0 a 1. */
  progress: number;
  /** Percentual já formatado, ex.: "42%". */
  percentLabel: string;
}

export function CycleArcProgress({ progress, percentLabel }: CycleArcProgressProps) {
  const { colors, typography, spacing } = useTheme();
  const reducedMotion = useReducedMotion();
  const focused = useIsFocused();
  const gradientId = `cycle-arc-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const clamped = Math.min(Math.max(progress, 0), 1);
  const animated = focused && !reducedMotion;
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = animated
      ? withTiming(clamped, { duration: PROGRESS_MS, easing: Easing.out(Easing.cubic) })
      : clamped;
  }, [clamped, animated, value]);

  const fillProps = useAnimatedProps(() => ({
    strokeDashoffset: ARC_LENGTH * (1 - value.value),
  }));
  const haloProps = useAnimatedProps(() => {
    const p = pointAt(value.value);
    return { cx: p.x, cy: p.y };
  });
  const coreProps = useAnimatedProps(() => {
    const p = pointAt(value.value);
    return { cx: p.x, cy: p.y };
  });

  const label = `${percentLabel} do ciclo anual vivido`;

  return (
    <View
      style={{ gap: spacing[8] }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg
        width="100%"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        style={styles.arc}
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.primary} />
            <Stop offset="0.7" stopColor={colors.primaryText} />
            <Stop offset="1" stopColor={colors.accentText} />
          </LinearGradient>
        </Defs>

        <Path
          d={ARC_PATH}
          fill="none"
          stroke={colors.glassBorder}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
        <AnimatedPath
          d={ARC_PATH}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
          animatedProps={fillProps}
        />
        <AnimatedCircle r={9} fill={colors.accentGlass} animatedProps={haloProps} />
        <AnimatedCircle r={3} fill={colors.white} animatedProps={coreProps} />
      </Svg>

      <Text style={[styles.label, { color: colors.textSecondary, ...typography.font.medium }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  arc: {
    width: '100%',
    aspectRatio: VIEWBOX_WIDTH / VIEWBOX_HEIGHT,
  },
  label: {
    fontSize: 12,
  },
});
