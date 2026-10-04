import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/lib/hooks/useAccessibility';
import { useTheme } from '@/theme';

// Coordenadas numéricas num viewBox fixo: porcentagens em formas quebram no react-native-svg nativo.
const WIDTH = 24;
const HEIGHT = 32;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const NODE_RADIUS = 5;
const CORE_RADIUS = 2;
const PULSE_SCALE = 1.2;
const PULSE_HALF_CYCLE_MS = 1500; // ida e volta = 3s

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Linha vertical sutil com um nó estelar no centro; liga uma memória à próxima no feed.
export function ConstellationConnector() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  // Aba fora de foco continua montada: sem foco o pulso é interrompido.
  const focused = useIsFocused();
  const scale = useSharedValue(1);

  const pulsing = focused && !reducedMotion;

  useEffect(() => {
    if (!pulsing) {
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(
      withTiming(PULSE_SCALE, { duration: PULSE_HALF_CYCLE_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulsing, scale]);

  const haloProps = useAnimatedProps(() => ({ r: NODE_RADIUS * scale.value }));

  return (
    <View
      pointerEvents="none"
      style={styles.container}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Line x1={CENTER_X} y1={0} x2={CENTER_X} y2={HEIGHT} stroke={colors.glassBorder} strokeWidth={1} />
        <AnimatedCircle cx={CENTER_X} cy={CENTER_Y} r={NODE_RADIUS} fill={colors.accentGlass} animatedProps={haloProps} />
        <Circle cx={CENTER_X} cy={CENTER_Y} r={CORE_RADIUS} fill={colors.accentText} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: HEIGHT,
    alignItems: 'center',
  },
});
