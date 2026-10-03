import React from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { EmptyState, Skeleton } from '@/components/ui';
import { useTheme } from '@/theme';
import { MemoryCard } from './MemoryCard';
import { MemoriesHeader } from './MemoriesHeader';
import { MemoryItem, MemberProfile } from '../types';

interface MemoryListProps {
  memories: MemoryItem[];
  user: any;
  profileMap: Map<string, MemberProfile>;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  reducedMotion: boolean;
  insets: any;
  bottomInset: number;
  hasMore: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  onPreview: (item: MemoryItem) => void;
  onDelete: (item: MemoryItem) => void;
  onAddMemory: () => void;
}

export function MemoryList({
  memories,
  user,
  profileMap,
  loading,
  loadingMore,
  refreshing,
  reducedMotion,
  insets,
  bottomInset,
  hasMore,
  onRefresh,
  onLoadMore,
  onPreview,
  onDelete,
  onAddMemory,
}: MemoryListProps) {
  const { colors, radii } = useTheme();

  const header = (
    <MemoriesHeader
      topInset={insets.top}
      count={memories.length}
      hasMore={hasMore}
      onAddMemory={onAddMemory}
    />
  );

  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        {header}
        {[1, 2].map((_, i) => (
          <Skeleton key={i} width="100%" height={300} borderRadius={radii.lg} />
        ))}
      </View>
    );
  }

  if (memories.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={[styles.centerContainer, { paddingBottom: bottomInset }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {header}
        <LiquidGlassView variant="card" readable borderRadius={radii.md} style={styles.emptyCard}>
          <EmptyState
            icon="image"
            title="Ainda não temos memórias por aqui"
            description="Que tal criar a primeira e eternizar um momento especial de vocês?"
            actionLabel="Criar primeira memória"
            onAction={onAddMemory}
          />
        </LiquidGlassView>
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={memories}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: bottomInset },
      ]}
      ListHeaderComponent={header}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      renderItem={({ item, index }) => (
        <MemoryCard
          item={item}
          index={index}
          user={user}
          profileMap={profileMap}
          reducedMotion={reducedMotion}
          onPreview={onPreview}
          onDelete={onDelete}
        />
      )}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        ) : null
      }
      removeClippedSubviews={Platform.OS === 'android'}
    />
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    paddingHorizontal: 20,
    gap: 24,
  },
  centerContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  emptyCard: {
    width: '100%',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
