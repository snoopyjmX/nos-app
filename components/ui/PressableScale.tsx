import React, { useState, useEffect } from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  activeOpacity?: number;
  enableHaptic?: boolean;
}

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.5 };

export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  activeOpacity = 0.92,
  enableHaptic = true,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) {
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const reanimatedReducedMotion = useReducedMotion();
  const effectiveReducedMotion = systemReducedMotion || reanimatedReducedMotion;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReducedMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReducedMotion);
    return () => sub.remove();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = (e: any) => {
    if (disabled) return;
    if (enableHaptic && Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    if (!effectiveReducedMotion) {
      scale.value = withSpring(scaleTo, SPRING_CONFIG);
    }
    opacity.value = withSpring(activeOpacity, SPRING_CONFIG);
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    if (disabled) return;
    if (!effectiveReducedMotion) {
      scale.value = withSpring(1, SPRING_CONFIG);
    }
    opacity.value = withSpring(1, SPRING_CONFIG);
    if (onPressOut) onPressOut(e);
  };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

export default PressableScale;
