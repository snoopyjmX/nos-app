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

const PADDING = 4;

const OPTIONS: { mode: Mode; label: string; icon: 'sun' | 'moon' }[] = [
  { mode: 'light', label: 'Claro', icon: 'sun' },
  { mode: 'dark', label: 'Escuro', icon: 'moon' },
];

export function LiquidThemeSelector({ currentMode, onChangeMode }: LiquidThemeSelectorProps) {
  const { colors, typography, radii, motion } = useTheme();
  const reducedMotion = useReducedMotion();
  const [containerWidth, setContainerWidth] = useState(0);

  const progress = useSharedValue(currentMode === 'light' ? 0 : 1);
  const pillWidth = containerWidth > 0 ? (containerWidth - PADDING * 2) / 2 : 0;

  useEffect(() => {
    const target = currentMode === 'light' ? 0 : 1;
    progress.value = reducedMotion
      ? withTiming(target, { duration: 120, easing: Easing.out(Easing.cubic) })
      : withSpring(target, motion.easing.springDock);
  }, [currentMode, reducedMotion, progress, motion.easing.springDock]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * pillWidth }],
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
      {pillWidth > 0 && (
        <Animated.View style={[styles.indicator, { width: pillWidth, borderRadius: radii.pill }, indicatorStyle]}>
          <LinearGradient
            colors={[colors.glow, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

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
              <AnimatedIcon name={option.icon} size={16} color={color} active={selected} />
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
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    padding: PADDING,
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    bottom: PADDING,
    overflow: 'hidden',
  },
  option: {
    flex: 1,
    minHeight: 44,
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
  },
});
