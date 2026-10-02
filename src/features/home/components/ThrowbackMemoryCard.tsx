import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from '@/design/ui/PressableScale';

interface ThrowbackMemoryCardProps {
  throwbackMemory: any;
  handleOpenMemories: () => void;
  shouldAnimateCascade: boolean;
  isDark: boolean;
  themeTokens: any;
}

export function ThrowbackMemoryCard({
  throwbackMemory,
  handleOpenMemories,
  shouldAnimateCascade,
  isDark,
  themeTokens,
}: ThrowbackMemoryCardProps) {
  if (!throwbackMemory) return null;

  return (
    <Animated.View
      entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(240) : undefined}
      style={{ marginTop: 20 }}
    >
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionHeaderTitle, { color: isDark ? '#AAA5B8' : '#7E7699' }]}>
          FAZ TEMPO...
        </Text>
        <PressableScale onPress={handleOpenMemories}>
          <Text style={[styles.sectionHeaderLink, { color: themeTokens.primary }]}>
            Ver todas
          </Text>
        </PressableScale>
      </View>

      <PressableScale
        style={[
          styles.memoryCard,
          {
            backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
          },
        ]}
        onPress={handleOpenMemories}
      >
        <View
          style={[
            styles.memoryThumbBox,
            {
              backgroundColor: isDark ? 'rgba(157, 146, 240, 0.12)' : '#EFECFC',
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
            <Ionicons name="time-outline" size={22} color={themeTokens.primary} />
          )}
        </View>

        <View style={styles.memoryContent}>
          <Text style={[styles.throwbackTag, { color: themeTokens.accent }]}>
            {throwbackMemory.label}
          </Text>
          <Text
            style={[styles.memoryTitleText, { color: isDark ? '#F3F1FB' : '#1E1A33' }]}
            numberOfLines={1}
          >
            {throwbackMemory.title}
          </Text>
          <Text style={[styles.memoryDateText, { color: isDark ? '#AAA5B8' : '#7E7699' }]}>
            {throwbackMemory.memory_date.split('-').reverse().join('/')}
          </Text>
        </View>

        <View
          style={[
            styles.memoryChevronBox,
            {
              backgroundColor: isDark ? 'rgba(157, 146, 240, 0.12)' : 'rgba(124, 111, 224, 0.08)',
            },
          ]}
        >
          <Ionicons name="chevron-forward" size={17} color={themeTokens.primary} />
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
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sectionHeaderLink: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
  },
  memoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  memoryThumbBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 14,
  },
  memoryContent: {
    flex: 1,
    paddingRight: 8,
  },
  throwbackTag: {
    fontSize: 11,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  memoryTitleText: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    marginBottom: 4,
  },
  memoryDateText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
  },
  memoryChevronBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
