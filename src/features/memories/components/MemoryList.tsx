import React from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { EmptyState } from '@/design/ui/EmptyState';
import { MemoryCard } from './MemoryCard';
import { MemoryItem, MemberProfile } from '../types';

interface MemoryListProps {
  memories: MemoryItem[];
  user: any;
  profileMap: Map<string, MemberProfile>;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  isDark: boolean;
  themeTokens: any;
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
  isDark,
  themeTokens,
  reducedMotion,
  insets,
  tabBarHeight,
  onRefresh,
  onLoadMore,
  onPreview,
  onDelete,
  onAddMemory,
}: MemoryListProps) {
  if (loading) {
    return (
      <View style={[styles.skeletonContainer, { paddingTop: insets.top + (Platform.OS === 'ios' ? 70 : 66) }]}>
        {[1, 2, 3].map((_, i) => (
          <View
            key={i}
            style={[
              styles.skeletonCard,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(142, 124, 232, 0.08)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(142, 124, 232, 0.15)',
              },
            ]}
          />
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
            tintColor={themeTokens.primary}
            colors={[themeTokens.primary]}
          />
        }
      >
        <View
          style={[
            styles.emptyCard,
            {
              borderColor: themeTokens.glassBorder,
              backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
              shadowColor: themeTokens.shadow,
            },
          ]}
        >
          <EmptyState
            icon="images-outline"
            title="Ainda não temos memórias por aqui"
            subtitle="Que tal criar a primeira e eternizar um momento especial de vocês?"
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
      renderItem={({ item, index }) => (
        <MemoryCard
          item={item}
          index={index}
          user={user}
          profileMap={profileMap}
          isDark={isDark}
          themeTokens={themeTokens}
          reducedMotion={reducedMotion}
          onPreview={onPreview}
          onDelete={onDelete}
        />
      )}
      contentContainerStyle={[
        styles.listContent,
        {
          paddingTop: insets.top + (Platform.OS === 'ios' ? 70 : 66),
          paddingBottom: tabBarHeight + 90,
        },
      ]}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      initialNumToRender={6}
      maxToRenderPerBatch={8}
      windowSize={5}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color={themeTokens.primary} />
          </View>
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={themeTokens.primary}
          colors={[themeTokens.primary]}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  skeletonCard: {
    width: '100%',
    height: 320,
    borderRadius: 28,
    borderWidth: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyCard: {
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 4,
    width: '100%',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  loadingMoreContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
});
