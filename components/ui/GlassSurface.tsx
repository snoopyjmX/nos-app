import React from 'react';
import { View, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView, BlurTint } from 'expo-blur';
import { useAppTheme } from '../../context/ThemeContext';

export interface GlassSurfaceProps {
  intensity?: number;
  tint?: BlurTint;
  borderRadius?: number;
  radius?: number;
  isOverlay?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function GlassSurface({
  intensity = 80,
  tint,
  borderRadius,
  radius,
  isOverlay = false,
  style,
  children,
}: GlassSurfaceProps) {
  const { isDark } = useAppTheme();
  const effectiveRadius = radius ?? borderRadius;

  if (Platform.OS === 'web') {
    if (isOverlay) {
      return (
        <View
          style={[
            {
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 13, 24, 0.60)',
            },
            style,
          ]}
        >
          {children}
        </View>
      );
    }

    const isDarkTint =
      tint === 'dark' ||
      tint === 'systemUltraThinMaterialDark' ||
      tint === 'systemMaterialDark' ||
      tint === 'systemThinMaterialDark' ||
      (tint === undefined && isDark);

    const webStyle: ViewStyle = {
      backgroundColor: isDarkTint
        ? 'rgba(21, 18, 42, 0.88)'
        : 'rgba(248, 246, 254, 0.90)',
      borderColor: isDarkTint
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(124, 111, 224, 0.12)',
      borderWidth: 1,
      ...(effectiveRadius !== undefined ? { borderRadius: effectiveRadius } : {}),
    };

    return (
      <View style={[webStyle, style]}>
        {children}
      </View>
    );
  }

  const effectiveTint: BlurTint = tint || (isDark ? 'dark' : 'light');

  return (
    <BlurView
      intensity={intensity}
      tint={effectiveTint}
      style={[
        effectiveRadius !== undefined ? { borderRadius: effectiveRadius, overflow: 'hidden' } : undefined,
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

export default GlassSurface;
