import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ThrowbackMemory } from '../types';
import { formatMemoryDate } from '../utils/time';
import { MemoryRowCard } from './MemoryRowCard';
import { HomeSectionHeader } from './HomeSectionHeader';

interface ThrowbackMemoryCardProps {
  throwbackMemory: ThrowbackMemory | null;
  handleOpenMemories: () => void;
  shouldAnimateCascade: boolean;
}

export function ThrowbackMemoryCard({
  throwbackMemory,
  handleOpenMemories,
  shouldAnimateCascade,
}: ThrowbackMemoryCardProps) {
  if (!throwbackMemory) return null;

  return (
    <Animated.View
      entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(240) : undefined}
      style={styles.section}
    >
      <HomeSectionHeader
        title="FAZ TEMPO..."
        actionLabel="Ver álbum"
        actionAccessibilityLabel="Ver álbum de memórias"
        onActionPress={handleOpenMemories}
      />

      <MemoryRowCard
        imageUri={throwbackMemory.displayUrl}
        fallbackIcon="clock"
        tag={throwbackMemory.label}
        title={throwbackMemory.title}
        titleLines={1}
        meta={formatMemoryDate(throwbackMemory.memory_date)}
        accessibilityLabel={`${throwbackMemory.label}: ${throwbackMemory.title}`}
        accessibilityHint="Abre o álbum de memórias"
        onPress={handleOpenMemories}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
});
