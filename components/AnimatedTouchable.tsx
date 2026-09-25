import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedTouchableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle> | any;
  scaleTo?: number;
  activeOpacity?: number;
}

export function AnimatedTouchable({
  children,
  style,
  scaleTo = 0.93,
  activeOpacity = 0.82,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: AnimatedTouchableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = (e: any) => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    scale.value = withSpring(scaleTo, { damping: 10, stiffness: 350 });
    opacity.value = withTiming(activeOpacity, { duration: 120 });
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 10, stiffness: 350 });
    opacity.value = withTiming(1, { duration: 150 });
    if (onPressOut) onPressOut(e);
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
