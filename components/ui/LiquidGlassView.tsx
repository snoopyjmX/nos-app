import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../constants/theme';

interface LiquidGlassViewProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
  variant?: 'hero' | 'card' | 'pill' | 'control';
}

export function LiquidGlassView({
  children,
  style,
  intensity,
  borderRadius = 28,
  variant = 'card',
  ...rest
}: LiquidGlassViewProps) {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);

  const defaultIntensity =
    intensity !== undefined
      ? intensity
      : variant === 'hero' || variant === 'control'
      ? 88
      : 75;

  const shadowStyles =
    variant === 'hero'
      ? { shadowColor: themeTokens.shadow, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.14, shadowRadius: 26, elevation: 8 }
      : variant === 'pill'
      ? { shadowColor: themeTokens.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 }
      : { shadowColor: themeTokens.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.09, shadowRadius: 18, elevation: 4 };

  return (
    <View
      style={[
        shadowStyles,
        {
          borderRadius,
          borderColor: isDark
            ? themeTokens.glassBorder
            : variant === 'hero'
            ? 'rgba(255, 255, 255, 0.85)'
            : themeTokens.glassBorder,
          borderTopColor: isDark
            ? 'rgba(255, 255, 255, 0.28)'
            : 'rgba(255, 255, 255, 0.95)',
        },
        styles.borderContainer,
        style,
      ]}
      {...rest}
    >
      {/* Camada 1: Blur View Ultra Thin Material */}
      <View style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]}>
        <BlurView
          tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
          intensity={Platform.OS === 'ios' ? defaultIntensity : 100}
          style={StyleSheet.absoluteFill}
        />

        {/* Camada 2: Superfície Translúcida com Tint Fosco */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? themeTokens.glassSurface
                : variant === 'hero'
                ? 'rgba(255, 255, 255, 0.60)'
                : themeTokens.glassSurface,
            },
          ]}
        />

        {/* Camada 3: Reflexo Especular Superior (Apple Specular Highlight) */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.02)', 'transparent']
              : ['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0.15)', 'transparent']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.65 }}
          style={[StyleSheet.absoluteFill, { height: '55%' }]}
          pointerEvents="none"
        />
      </View>

      {/* Conteúdo interno */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  borderContainer: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroShadow: {
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 8,
  },
  cardShadow: {
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 4,
  },
  pillShadow: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
});
