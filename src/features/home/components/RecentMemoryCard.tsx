import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { RecentMemory } from '../types';
import { formatRelativePast } from '../utils/time';
import { MemoryRowCard } from './MemoryRowCard';
import { HomeSectionHeader } from './HomeSectionHeader';

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
  const imageUri = recentMemory?.displayUrl || recentMemory?.image_url;

  return (
    <Animated.View
      entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(180) : undefined}
      style={styles.section}
    >
      <HomeSectionHeader
        title="MEMÓRIA RECENTE"
        actionLabel="Ver álbum"
        actionAccessibilityLabel="Ver álbum de memórias"
        onActionPress={handleOpenMemories}
      />

      <View>
        {recentMemory ? (
          <MemoryRowCard
            imageUri={imageUri}
            fallbackIcon="image"
            title={recentMemory.title}
            meta={formatRelativePast(recentMemory.memory_date)}
            accessibilityLabel={`Memória recente: ${recentMemory.title}, ${formatRelativePast(recentMemory.memory_date).toLowerCase()}`}
            accessibilityHint="Abre o álbum de memórias"
            onPress={handleOpenMemories}
          />
        ) : (
          <MemoryRowCard
            fallbackIcon="plus"
            title="Guardar momento"
            meta="Nenhuma memória ainda"
            accessibilityLabel="Guardar o primeiro momento do casal"
            accessibilityHint="Abre o álbum para adicionar uma memória"
            onPress={handleOpenMemories}
          />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
});
