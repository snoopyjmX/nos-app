import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from '@/design/ui/PressableScale';
import { CoupleJourneyCounter } from './CoupleJourneyCounter';

interface HeroCardProps {
  heroImageUri: string | null | undefined;
  effectiveStartDateStr: string | null;
  handleOpenMemories: () => void;
  shouldAnimateCascade: boolean;
  isDark: boolean;
  themeTokens: any;
}

export function HeroCard({
  heroImageUri,
  effectiveStartDateStr,
  handleOpenMemories,
  shouldAnimateCascade,
  isDark,
  themeTokens,
}: HeroCardProps) {
  return (
    <Animated.View
      entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(0) : undefined}
    >
      <PressableScale
        style={[
          styles.heroCard,
          {
            backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
            shadowColor: '#7C6FE0',
          },
        ]}
        onPress={handleOpenMemories}
        activeOpacity={0.92}
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

        <View style={styles.photoBadge}>
          <Ionicons name="heart" size={13} color="#FFFFFF" />
          <Text style={styles.photoBadgeText}>Nós</Text>
        </View>

        <CoupleJourneyCounter
          startDate={effectiveStartDateStr}
          isDark={isDark}
          themeTokens={themeTokens}
        />
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    width: '100%',
    height: 245,
    borderRadius: 28,
    overflow: 'hidden',
    padding: 20,
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#7C6FE0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  photoBadgeText: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
