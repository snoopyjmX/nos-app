import React from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { EmptyState, Skeleton } from '@/components/ui';
import { useTheme } from '@/theme';
import { MemoryCard } from './MemoryCard';
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
  tabBarHeight: number;
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
  tabBarHeight,
  onRefresh,
  onLoadMore,
  onPreview,
  onDelete,
  onAddMemory,
}: MemoryListProps) {
  const { colors, radii, shadows } = useTheme();

  if (loading) {
    return (
      <View style={[styles.skeletonContainer, { paddingTop: insets.top + (Platform.OS === 'ios' ? 70 : 66) }]}>
        {[1, 2, 3].map((_, i) => (
          <Skeleton key={i} width="100%" height={320} borderRadius={radii.md} />
        ))}
      </View>
    );
  }

  if (memories.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={[styles.centerContainer, { paddingTop: insets.top + 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: colors.surface,
              borderRadius: radii.md,
              ...shadows.soft,
            },
          ]}
        >
          <EmptyState
            icon="image"
            title="Ainda não temos memórias por aqui"
            description="Que tal criar a primeira e eternizar um momento especial de vocês?"
            actionLabel="Criar primeira memória"
            onAction={onAddMemory}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={memories}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.listContent,
        {
          paddingTop: insets.top + (Platform.OS === 'ios' ? 70 : 66),
          paddingBottom: tabBarHeight + 60,
        },
      ]}
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
    gap: 20,
  },
  centerContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    width: '100%',
    padding: 24,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
