import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { CoupleJourneyCounter } from './CoupleJourneyCounter';
import { useTheme } from '@/theme';

interface HeroCardProps {
  heroImageUri: string | null | undefined;
  effectiveStartDateStr: string | null;
  handleOpenMemories: () => void;
  shouldAnimateCascade: boolean;
}

export function HeroCard({
  heroImageUri,
  effectiveStartDateStr,
  handleOpenMemories,
  shouldAnimateCascade,
}: HeroCardProps) {
  const { colors, typography, radii, spacing } = useTheme();

  return (
    <Animated.View
      entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(0) : undefined}
      style={{ marginBottom: spacing[16] }}
    >
      <LiquidGlassView variant="hero" borderRadius={radii.lg} style={[styles.card, { padding: spacing[16], gap: spacing[16] }]}>
        <PressableScale
          onPress={handleOpenMemories}
          accessibilityRole="imagebutton"
          accessibilityLabel={
            heroImageUri ? 'Foto de uma memória recente do casal' : 'Espaço da foto do casal, vazio'
          }
          accessibilityHint="Abre o álbum de memórias"
        >
          <View style={[styles.photo, { borderRadius: radii.md, backgroundColor: colors.primarySoft }]}>
            {heroImageUri ? (
              <ExpoImage
                source={{ uri: heroImageUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            ) : (
              <LinearGradient
                colors={[colors.primarySoft, colors.orbLavender]}
                style={[StyleSheet.absoluteFill, styles.placeholder]}
              >
                <Feather name="image" size={28} color={colors.primaryText} />
              </LinearGradient>
            )}

            {/* Véu suave na base: o texto fica sempre fora da foto, o véu só ampara o selo */}
            <LinearGradient colors={colors.photoScrim} style={styles.scrim} pointerEvents="none" />

            <View style={[styles.badge, { backgroundColor: colors.photoBadge }]}>
              <Feather name="heart" size={13} color={colors.white} />
              <Text style={[styles.badgeText, { color: colors.white, ...typography.font.bold }]}>
                Nós
              </Text>
            </View>
          </View>
        </PressableScale>

        <CoupleJourneyCounter startDate={effectiveStartDateStr} />
      </LiquidGlassView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  photo: {
    width: '100%',
    aspectRatio: 16 / 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  badge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    letterSpacing: -0.2,
  },
});
