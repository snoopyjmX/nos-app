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
import { useAppTheme } from '@/lib/context/ThemeContext';
import { getThemeColors } from '@/theme';
import { useReducedTransparency } from '@/lib/hooks/useAccessibility';
import { supportsBackdropFilter, webBackdropStyle } from './glassWeb';

// Borda chanfrada fina: o brilho vem do borderTopColor mais claro.
const BORDER_WIDTH = 0.8;

type GlassVariant = 'hero' | 'card' | 'pill' | 'control' | 'scrim';

interface LiquidGlassViewProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
  variant?: GlassVariant;
  disableBlur?: boolean;
  /**
   * Usa o piso de contraste para texto corrido (padrão em 'card').
   * Os demais variants usam a tinta de vidro bem translúcida.
   */
  readable?: boolean;
  /** Substitui a tinta do vidro (ex.: véu escuro sobre foto, para texto claro com contraste AA). */
  tintColor?: string;
  /** Raios por canto (ex.: cauda de balão). Sobrescrevem `borderRadius` nos cantos informados. */
  corners?: Pick<
    ViewStyle,
    'borderTopLeftRadius' | 'borderTopRightRadius' | 'borderBottomLeftRadius' | 'borderBottomRightRadius'
  >;
}

export function LiquidGlassView({
  children,
  style,
  intensity,
  borderRadius = 28,
  variant = 'card',
  disableBlur = false,
  readable,
  tintColor,
  corners,
  ...rest
}: LiquidGlassViewProps) {
  const { isDark } = useAppTheme();
  const theme = getThemeColors(isDark);
  const reducedTransparency = useReducedTransparency();

  const isScrim = variant === 'scrim';
  const isWeb = Platform.OS === 'web';
  const solid = reducedTransparency || (isWeb && !supportsBackdropFilter());
  const useReadable = readable ?? variant === 'card';

  const blurIntensity =
    intensity !== undefined
      ? intensity
      : variant === 'hero' || variant === 'control' || isScrim
      ? 88
      : 75;

  const shadowStyles =
    variant === 'hero'
      ? {
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: 0.14,
          shadowRadius: 26,
          elevation: 8,
        }
      : variant === 'pill'
      ? {
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 2,
        }
      : isScrim
      ? null
      : {
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.09,
          shadowRadius: 18,
          elevation: 4,
        };

  const tint = tintColor && !solid
    ? tintColor
    : isScrim
    ? solid
      ? theme.overlayDark
      : theme.overlayMedium
    : solid
    ? theme.surface
    : useReadable
    ? theme.glassSurfaceReadable
    : theme.glassSurface;

  return (
    // Camada externa: só sombra e raio, transparente e sem overflow (o iOS cortaria a sombra).
    <View style={[shadowStyles, { borderRadius }, corners, style]} {...rest}>
      {/* Camada interna: recorta tinta, blur, reflexo e borda no raio. */}
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.clip,
          { borderRadius },
          corners,
          !isScrim && { borderColor: theme.glassBorder, borderTopColor: theme.glassBorderTop },
          isWeb && !solid ? webBackdropStyle(blurIntensity) : null,
        ]}
        pointerEvents="none"
      >
        {!isWeb && !solid && !disableBlur && (
          <BlurView
            tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
            intensity={Platform.OS === 'ios' ? blurIntensity : 100}
            style={StyleSheet.absoluteFill}
          />
        )}

        <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />

        {!solid && !isScrim && (
          <LinearGradient
            colors={theme.glassHighlight}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.65 }}
            style={[StyleSheet.absoluteFill, styles.highlight]}
          />
        )}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    borderWidth: BORDER_WIDTH,
  },
  highlight: {
    height: '55%',
  },
});
