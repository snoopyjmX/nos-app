import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui';
import { RecentMemory } from '../types';
import { formatMemoryDate } from '../utils/time';
import { useTheme } from '@/theme';

interface RecentMemoryCardProps {
  recentMemory: RecentMemory | null;
  handleOpenMemories: () => void;
  shouldAnimateCascade: boolean;
}

export function RecentMemoryCard({
  recentMemory,
  handleOpenMemories,
  shouldAnimateCascade,
}: RecentMemoryCardProps) {
  const { colors, typography, radii, shadows } = useTheme();

  return (
    <Animated.View
      entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(180) : undefined}
    >
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionHeaderTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.bold }]}>
          MEMÓRIA RECENTE
        </Text>
        <PressableScale onPress={handleOpenMemories}>
          <Text style={[styles.sectionHeaderLink, { color: colors.primary, fontFamily: typography.fontFamily.bold }]}>
            Ver todas
          </Text>
        </PressableScale>
      </View>

      {recentMemory ? (
        <PressableScale
          style={[
            styles.memoryCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radii.md,
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
            {recentMemory.displayUrl || recentMemory.image_url ? (
              <ExpoImage
                source={{ uri: (recentMemory.displayUrl || recentMemory.image_url) as string }}
                style={styles.memoryThumbImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            ) : (
              <Feather name="image" size={22} color={colors.primary} />
            )}
          </View>

          <View style={styles.memoryContent}>
            <Text
              style={[styles.memoryTitleText, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}
              numberOfLines={2}
            >
              {recentMemory.title}
            </Text>
            <Text style={[styles.memoryDateText, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
              {formatMemoryDate(recentMemory.memory_date)}
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
            <Feather name="chevron-right" size={15} color={colors.primary} />
          </View>
        </PressableScale>
      ) : (
        <PressableScale
          style={[
            styles.memoryCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radii.md,
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
            <Feather name="plus" size={24} color={colors.primary} />
          </View>
          <View style={styles.memoryContent}>
            <Text style={[styles.memoryTitleText, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
              Guardar momento
            </Text>
            <Text style={[styles.memoryDateText, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
              Nenhuma memória ainda
            </Text>
          </View>
        </PressableScale>
      )}
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
    marginTop: 8,
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
    marginBottom: 16,
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
  memoryThumbImage: {
    width: '100%',
    height: '100%',
  },
  memoryContent: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  memoryTitleText: {
    fontSize: 16,
    letterSpacing: -0.3,
    marginBottom: 4,
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
