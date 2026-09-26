import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface AnimatedTouchableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle> | any;
  scaleTo?: number;
  activeOpacity?: number;
}

export function AnimatedTouchable({
  children,
  style,
  scaleTo = 1,
  activeOpacity = 0.85,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: AnimatedTouchableProps) {
  const handlePressIn = (e: any) => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    if (disabled) return;
    if (onPressOut) onPressOut(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        typeof style === 'function' ? style({ pressed }) : style,
        pressed && !disabled && { opacity: activeOpacity },
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
