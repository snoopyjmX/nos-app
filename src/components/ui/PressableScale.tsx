import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { useReducedMotion } from '@/lib/hooks/useAccessibility';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const REDUCED_PRESS_OPACITY = 0.7;
const REDUCED_FADE_MS = 120;

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}

export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  ...props
}: PressableScaleProps) {
  const { motion } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const settle = (pressed: boolean) => {
    if (reducedMotion) {
      // Sem escala: apenas um fade curto como feedback.
      opacity.value = withTiming(pressed ? REDUCED_PRESS_OPACITY : 1, {
        duration: REDUCED_FADE_MS,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }
    scale.value = withSpring(
      pressed ? scaleTo : 1,
      pressed ? motion.easing.springPressIn : motion.easing.springPressOut
    );
  };

  return (
    <AnimatedPressable
      {...props}
      style={[animatedStyle, style]}
      onPressIn={(e) => {
        settle(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        settle(false);
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
