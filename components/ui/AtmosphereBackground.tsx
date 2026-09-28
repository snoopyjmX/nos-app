import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../../context/ThemeContext';
import { COLORS, DARK_COLORS } from '../../constants/theme';

let SkiaLib: any = null;
try {
  // Only attempt to load Skia if native JSI bindings are initialized (dev client / standalone)
  if (typeof globalThis !== 'undefined' && (globalThis as any).SkiaApi != null) {
    SkiaLib = require('@shopify/react-native-skia');
  }
} catch {
  SkiaLib = null;
}

export function AtmosphereBackground() {
  const { width, height } = useWindowDimensions();
  const { isDark } = useAppTheme();

  const themeTokens = isDark ? DARK_COLORS : COLORS;

  // If running in an environment with Skia native module compiled in (Development Build)
  if (SkiaLib && SkiaLib.Canvas && SkiaLib.Circle) {
    const { Canvas, Circle, BlurMask, LinearGradient: SkiaGradient, vec } = SkiaLib;
    return (
      <View style={[styles.container, { backgroundColor: themeTokens.background }]}>
        <Canvas style={{ width, height }}>
          <Circle cx={width} cy={0} r={width * 0.8}>
            <SkiaGradient
              start={vec(width, 0)}
              end={vec(width * 0.2, height * 0.4)}
              colors={[
                themeTokens.orbLavender,
                isDark ? 'rgba(76, 58, 140, 0)' : 'rgba(221, 214, 254, 0)',
              ]}
            />
            <BlurMask blur={isDark ? 90 : 80} style="normal" />
          </Circle>

          <Circle cx={0} cy={height} r={width * 0.7}>
            <SkiaGradient
              start={vec(0, height)}
              end={vec(width * 0.8, height * 0.6)}
              colors={[
                themeTokens.orbPink,
                isDark ? 'rgba(58, 42, 77, 0)' : 'rgba(252, 231, 243, 0)',
              ]}
            />
            <BlurMask blur={isDark ? 100 : 90} style="normal" />
          </Circle>
        </Canvas>
      </View>
    );
  }

  // Graceful native fallback for Expo Go and environments without Skia binary (AGENTS.md Seção 11)
  return (
    <View style={[styles.container, { backgroundColor: themeTokens.background }]} pointerEvents="none">
      {/* Top right Lavender orb */}
      <View
        style={[
          styles.orb,
          {
            top: -width * 0.25,
            right: -width * 0.25,
            width: width * 1.05,
            height: width * 1.05,
            backgroundColor: themeTokens.orbLavender,
            opacity: isDark ? 0.35 : 0.5,
          },
        ]}
      />

      {/* Bottom left Pink orb */}
      <View
        style={[
          styles.orb,
          {
            bottom: -width * 0.25,
            left: -width * 0.25,
            width: width * 0.95,
            height: width * 0.95,
            backgroundColor: themeTokens.orbPink,
            opacity: isDark ? 0.35 : 0.5,
          },
        ]}
      />

      {/* Diffuse blur overlay to melt orbs into the Liquid Glass atmosphere */}
      <BlurView
        intensity={isDark ? 85 : 75}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...(StyleSheet.absoluteFill as object),
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
});
