import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, LayoutChangeEvent, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform } from 'react-native';
import { useTheme } from '@/theme';
import { useReducedMotion } from '@/lib/hooks/useAccessibility';
import { AnimatedIcon } from './AnimatedIcon';
import { LiquidGlassView } from './LiquidGlassView';
import { PressableScale } from './PressableScale';

type Mode = 'light' | 'dark';

interface LiquidThemeSelectorProps {
  currentMode: Mode;
  onChangeMode: (mode: Mode) => void;
}

const PADDING = 3;
const ICON_SIZE = 16;
const TEXT_LINE_HEIGHT = 20;

const OPTIONS: { mode: Mode; label: string; icon: 'sun' | 'moon' }[] = [
  { mode: 'light', label: 'Claro', icon: 'sun' },
  { mode: 'dark', label: 'Escuro', icon: 'moon' },
];

export function LiquidThemeSelector({ currentMode, onChangeMode }: LiquidThemeSelectorProps) {
  const { colors, typography, radii, motion } = useTheme();
  const reducedMotion = useReducedMotion();
  const [containerWidth, setContainerWidth] = useState(0);

  const progress = useSharedValue(currentMode === 'light' ? 0 : 1);
  // Deslocamento = metade da largura do container menos o recuo (metade da trilha interna)
  const travel = containerWidth > 0 ? containerWidth / 2 - PADDING : 0;

  useEffect(() => {
    const target = currentMode === 'light' ? 0 : 1;
    progress.value = reducedMotion
      ? withTiming(target, { duration: 120, easing: Easing.out(Easing.cubic) })
      : withSpring(target, motion.easing.springDock);
  }, [currentMode, reducedMotion, progress, motion.easing.springDock]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * travel }],
  }));

  const handleSelect = (mode: Mode) => {
    if (mode === currentMode) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeMode(mode);
  };

  return (
    <LiquidGlassView
      variant="control"
      readable
      borderRadius={radii.pill}
      style={styles.container}
      onLayout={(event: LayoutChangeEvent) => setContainerWidth(event.nativeEvent.layout.width)}
      accessibilityRole="radiogroup"
    >
      {/* Trilha interna com o mesmo recuo do container: o indicador ocupa exatamente metade dela */}
      <View style={styles.track} pointerEvents="none">
        <Animated.View style={[styles.indicator, { borderRadius: radii.pill }, indicatorStyle]}>
          <LinearGradient
            colors={[colors.glow, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {OPTIONS.map((option) => {
        const selected = currentMode === option.mode;
        const color = selected ? colors.onPrimary : colors.textSecondary;
        return (
          <PressableScale
            key={option.mode}
            style={styles.option}
            onPress={() => handleSelect(option.mode)}
            accessibilityRole="radio"
            accessibilityLabel={option.mode === 'dark' ? 'Modo escuro, roxo-noite' : 'Modo claro'}
            accessibilityState={{ selected }}
          >
            <View style={styles.optionContent}>
              <AnimatedIcon name={option.icon} size={ICON_SIZE} color={color} active={selected} />
              <Text style={[styles.optionText, { color, ...(selected ? typography.font.bold : typography.font.medium) }]}>
                {option.label}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </LiquidGlassView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    padding: PADDING,
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    right: PADDING,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '50%',
    overflow: 'hidden',
  },
  option: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  optionText: {
    fontSize: 14,
    lineHeight: TEXT_LINE_HEIGHT,
    // Mesma altura de linha nos dois pesos, para o texto não "dançar" ao trocar de estado
    includeFontPadding: false,
  },
});
