import React, { useEffect, useId, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import Svg, { ClipPath, Defs, G, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/lib/hooks/useAccessibility';
import { useTheme } from '@/theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface BeamProps {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  perimeter: number;
  color: string;
  strokeWidth: number;
  duration: number;
  beamFraction: number;
}

function Beam({
  x,
  y,
  width,
  height,
  radius,
  perimeter,
  color,
  strokeWidth,
  duration,
  beamFraction,
}: BeamProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
  }, [duration, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: -progress.value * perimeter,
  }));

  const beam = perimeter * beamFraction;

  return (
    <AnimatedRect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={radius}
      ry={radius}
      fill="none"
      stroke={color}
      strokeOpacity={0.8}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray={`${beam} ${perimeter - beam}`}
      animatedProps={animatedProps}
    />
  );
}

interface BorderBeamProps {
  /** Raio do contêiner (o contorno é recuado pela espessura do traço). */
  radius: number;
  /** Cor do feixe. Padrão: `colors.primaryText`. */
  color?: string;
  /** Duração de uma volta completa, em ms. */
  duration?: number;
  strokeWidth?: number;
  /** Comprimento do feixe como fração do perímetro (0 a 1). */
  beamFraction?: number;
}

/**
 * Borda sutil com um feixe de luz que percorre o contorno. Preenche o contêiner pai
 * (que precisa de `position` definido pelo layout) sem capturar toques; recorta o SVG no
 * próprio raio, então nada vaza para fora do contorno enquanto a medição do layout atualiza.
 * Fora de foco ou com Reduce Motion, mostra só a borda estática.
 */
export function BorderBeam({
  radius,
  color,
  duration = 6000,
  strokeWidth = 1.5,
  beamFraction = 0.18,
}: BorderBeamProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  // Aba fora de foco continua montada: desmontar o feixe encerra o loop e poupa CPU/bateria.
  const focused = useIsFocused();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const clipId = `border-beam-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  const innerWidth = Math.max(size.width - strokeWidth, 0);
  const innerHeight = Math.max(size.height - strokeWidth, 0);
  const innerRadius = Math.max(radius - strokeWidth / 2, 0);
  const perimeter = 2 * (innerWidth + innerHeight) - (8 - 2 * Math.PI) * innerRadius;
  const inset = strokeWidth / 2;
  const ready = size.width > 0 && size.height > 0 && perimeter > 0;

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: radius, overflow: 'hidden' },
        // WebKit ignora o recorte arredondado de filhos compostos (SVG animado) sem um contexto isolado.
        Platform.OS === 'web' ? ({ isolation: 'isolate' } as object) : null,
      ]}
      onLayout={handleLayout}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {ready ? (
        // 100% + viewBox: o SVG acompanha o contêiner na hora, sem sobrar quando o card encolhe.
        // Absoluto para a altura em % resolver contra o contêiner, não como item flex.
        <Svg
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%"
          viewBox={`0 0 ${size.width} ${size.height}`}
          preserveAspectRatio="none"
        >
          {/* Recorte dentro do próprio SVG: vale mesmo que o overflow do CSS falhe no Safari. */}
          <Defs>
            <ClipPath id={clipId}>
              <Rect x={0} y={0} width={size.width} height={size.height} rx={radius} ry={radius} />
            </ClipPath>
          </Defs>
          <G clipPath={`url(#${clipId})`}>
            <Rect
              x={inset}
              y={inset}
              width={innerWidth}
              height={innerHeight}
              rx={innerRadius}
              ry={innerRadius}
              fill="none"
              stroke={colors.glassBorder}
              strokeWidth={strokeWidth}
            />
            {focused && !reducedMotion ? (
              <Beam
                x={inset}
                y={inset}
                width={innerWidth}
                height={innerHeight}
                radius={innerRadius}
                perimeter={perimeter}
                color={color ?? colors.primaryText}
                strokeWidth={strokeWidth}
                duration={duration}
                beamFraction={beamFraction}
              />
            ) : null}
          </G>
        </Svg>
      ) : null}
    </View>
  );
}
