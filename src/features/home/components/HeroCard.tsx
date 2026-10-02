import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui';
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
  const { colors, typography, radii, shadows, isDark } = useTheme();

  return (
    <Animated.View
      entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(0) : undefined}
    >
      <PressableScale
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderColor: colors.border,
            ...shadows.soft,
          },
        ]}
        onPress={handleOpenMemories}
      >
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
            colors={
              isDark
                ? ['#2E2554', '#1F1B3A']
                : ['#EDE9FE', '#DDD6FE']
            }
            style={StyleSheet.absoluteFill}
          />
        )}

        <LinearGradient
          colors={[
            'rgba(15, 12, 28, 0.94)',
            'rgba(15, 12, 28, 0.78)',
            'rgba(15, 12, 28, 0.32)',
            'rgba(15, 12, 28, 0.02)',
          ]}
          locations={[0, 0.44, 0.76, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.photoBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Feather name="heart" size={13} color="#FFFFFF" />
          <Text style={[styles.photoBadgeText, { fontFamily: typography.fontFamily.bold }]}>Nós</Text>
        </View>

        <CoupleJourneyCounter
          startDate={effectiveStartDateStr}
        />
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    width: '100%',
    height: 245,
    overflow: 'hidden',
    padding: 20,
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
  },
  photoBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  photoBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: -0.2,
  },
});
