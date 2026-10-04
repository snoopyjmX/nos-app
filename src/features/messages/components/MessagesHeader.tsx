import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar, IconButton } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { isAndroidWeb, supportsBackdropFilter, webBackdropStyle } from '@/components/ui/glassWeb';
import { useReducedTransparency } from '@/lib/hooks/useAccessibility';
import { useAppTheme } from '@/lib/context/ThemeContext';
import { useTheme } from '@/theme';

const FADE_EXTENSION = 28;
const FADE_BLUR_INTENSITY = 60;
// Máscara que dissolve o desfoque na borda inferior (Safari/PWA)
const WEB_FADE_MASK = {
  maskImage: 'linear-gradient(to bottom, black 65%, transparent)',
  WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent)',
} as object;

// Desfoque de borda a borda atrás do cabeçalho: os balões se dissolvem ao subir, sem vazar pelas laterais.
function TopBlurFade() {
  const { isDark } = useAppTheme();
  const { colors } = useTheme();
  const reducedTransparency = useReducedTransparency();
  const isWeb = Platform.OS === 'web';
  const blurred = !reducedTransparency && (isWeb ? supportsBackdropFilter() && !isAndroidWeb() : true);
  const veil = [...colors.dockFade].reverse() as [string, string, ...string[]];

  return (
    <View style={styles.fade} pointerEvents="none">
      {blurred && isWeb ? (
        <View style={[StyleSheet.absoluteFill, webBackdropStyle(FADE_BLUR_INTENSITY), WEB_FADE_MASK]} />
      ) : null}
      {blurred && !isWeb ? (
        <BlurView
          intensity={FADE_BLUR_INTENSITY}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <LinearGradient colors={veil} style={StyleSheet.absoluteFill} />
    </View>
  );
}

interface MessagesHeaderProps {
  topInset: number;
  onGoBack: () => void;
  partnerName: string;
  partnerAvatarUri?: string | null;
}

export function MessagesHeader({
  topInset,
  onGoBack,
  partnerName,
  partnerAvatarUri,
}: MessagesHeaderProps) {
  const { colors, typography, radii, spacing } = useTheme();

  return (
    <View
      style={{ paddingTop: topInset + spacing[8], paddingHorizontal: spacing[16] }}
    >
      <TopBlurFade />
      <LiquidGlassView
        variant="hero"
        borderRadius={radii.lg}
        style={[styles.card, { gap: spacing[12], paddingHorizontal: spacing[12], paddingVertical: spacing[12] }]}
      >
        <IconButton
          icon="arrow-left"
          variant="secondary"
          onPress={onGoBack}
          accessibilityLabel="Voltar"
        />

        <Avatar url={partnerAvatarUri} name={partnerName} size={44} />

        <View style={styles.identity}>
          <Text
            accessibilityRole="header"
            style={[styles.name, { color: colors.textPrimary, ...typography.font.black }]}
            numberOfLines={1}
          >
            {partnerName}
          </Text>
          <LiquidGlassView variant="pill" disableBlur readable borderRadius={radii.pill} style={styles.badge}>
            <Text style={[styles.badgeText, { color: colors.textSecondary, ...typography.font.medium }]}>
              Espaço privado
            </Text>
          </LiquidGlassView>
        </View>
      </LiquidGlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  fade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -FADE_EXTENSION,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  identity: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 20,
    letterSpacing: -0.4,
    alignSelf: 'stretch',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
  },
});
