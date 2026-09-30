import React from 'react';
import { StyleSheet, View, useWindowDimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../../context/ThemeContext';
import { COLORS, DARK_COLORS } from '../../constants/theme';

export function AtmosphereBackground() {
  const { width, height } = useWindowDimensions();
  const { isDark } = useAppTheme();

  const themeTokens = isDark ? DARK_COLORS : COLORS;

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
            ...(Platform.OS === 'web' ? { filter: 'blur(80px)' } as any : {}),
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
            ...(Platform.OS === 'web' ? { filter: 'blur(80px)' } as any : {}),
          },
        ]}
      />

      {/* Diffuse blur overlay to melt orbs into the Liquid Glass atmosphere */}
      {Platform.OS !== 'web' ? (
        <BlurView
          intensity={isDark ? 85 : 75}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(15, 13, 24, 0.4)' : 'rgba(248, 249, 252, 0.4)' }]} pointerEvents="none" />
      )}
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
