import React, { useEffect } from 'react';
import { StyleProp, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { useReducedMotion } from '@/lib/hooks/useAccessibility';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 20, borderRadius, style }: SkeletonProps) {
  const { colors, radii } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.45;
      return;
    }

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [reducedMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          backgroundColor: colors.border,
          borderRadius: borderRadius ?? radii.sm,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
