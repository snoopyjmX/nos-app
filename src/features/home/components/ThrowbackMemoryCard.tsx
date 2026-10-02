import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui';
import { useTheme } from '@/theme';

interface ThrowbackMemoryCardProps {
  throwbackMemory: any;
  handleOpenMemories: () => void;
  shouldAnimateCascade: boolean;
}

export function ThrowbackMemoryCard({
  throwbackMemory,
  handleOpenMemories,
  shouldAnimateCascade,
}: ThrowbackMemoryCardProps) {
  const { colors, typography, radii, shadows } = useTheme();

  if (!throwbackMemory) return null;

  return (
    <Animated.View
      entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(240) : undefined}
      style={{ marginTop: 20 }}
    >
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionHeaderTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.bold }]}>
          FAZ TEMPO...
        </Text>
        <PressableScale onPress={handleOpenMemories}>
          <Text style={[styles.sectionHeaderLink, { color: colors.primary, fontFamily: typography.fontFamily.bold }]}>
            Ver todas
          </Text>
        </PressableScale>
      </View>

      <PressableScale
        style={[
          styles.memoryCard,
          {
            backgroundColor: colors.surface,
            borderRadius: radii.md,
            borderWidth: 0,
            ...shadows.soft,
          },
        ]}
        onPress={handleOpenMemories}
      >
        <View
          style={[
            styles.memoryThumbBox,
            {
              backgroundColor: colors.primarySoft,
            },
          ]}
        >
          {throwbackMemory.displayUrl ? (
            <ExpoImage
              source={{ uri: throwbackMemory.displayUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          ) : (
            <Feather name="clock" size={22} color={colors.primary} />
          )}
        </View>

        <View style={styles.memoryContent}>
          <Text style={[styles.throwbackTag, { color: colors.accent, fontFamily: typography.fontFamily.bold }]}>
            {throwbackMemory.label}
          </Text>
          <Text
            style={[styles.memoryTitleText, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}
            numberOfLines={1}
          >
            {throwbackMemory.title}
          </Text>
          <Text style={[styles.memoryDateText, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
            {throwbackMemory.memory_date.split('-').reverse().join('/')}
          </Text>
        </View>

        <View
          style={[
            styles.memoryChevronBox,
            {
              backgroundColor: colors.primarySoft,
            },
          ]}
        >
          <Feather name="chevron-right" size={17} color={colors.primary} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  sectionHeaderLink: {
    fontSize: 13,
  },
  memoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
  memoryThumbBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 14,
  },
  memoryContent: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  throwbackTag: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  memoryTitleText: {
    fontSize: 16,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  memoryDateText: {
    fontSize: 13,
  },
  memoryChevronBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
