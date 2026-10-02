import React from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { EmptyState } from '@/design/ui/EmptyState';
import { MessageBubble } from './MessageBubble';
import { isSameDay, formatDaySeparator } from '../utils/dateFormatting';
import { Message, UserProfile } from '../types';

interface MessageListProps {
  messages: Message[];
  user: any;
  profileMap: Map<string, UserProfile>;
  loadingOlder: boolean;
  isInitialLoadDoneRef: React.MutableRefObject<boolean>;
  initialMessageIdsRef: React.MutableRefObject<Set<string>>;
  reducedMotion: boolean;
  isDark: boolean;
  themeTokens: any;
  insets: any;
  flatListRef: React.RefObject<any>;
  handleScroll: (event: any) => void;
  handleContentSizeChange: (w: number, h: number) => void;
}

export function MessageList({
  messages,
  user,
  profileMap,
  loadingOlder,
  isInitialLoadDoneRef,
  initialMessageIdsRef,
  reducedMotion,
  isDark,
  themeTokens,
  insets,
  flatListRef,
  handleScroll,
  handleContentSizeChange,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={[styles.centerContainer, { paddingTop: insets.top + 80 }]}>
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: isDark ? themeTokens.surface : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.15)',
              },
            ]}
          >
            <EmptyState
              icon="mail-open-outline"
              title="Nenhum bilhete ainda"
              subtitle="Surpreenda seu amor deixando o primeiro recado carinhoso aqui. Cada mensagem fica guardada com carinho."
              compact
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  const renderMessageItem = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.created_by === user?.id;
    const authorProfile = profileMap.get(item.created_by);
    const isSending = item.sending || item.id.startsWith('temp-');

    const prevItem = index > 0 ? messages[index - 1] : null;
    const showDaySeparator = !prevItem || !isSameDay(prevItem.created_at, item.created_at);
    const dayLabel = showDaySeparator ? formatDaySeparator(item.created_at) : '';

    const nextItem = index < messages.length - 1 ? messages[index + 1] : null;
    const isLastInGroup =
      !nextItem ||
      nextItem.created_by !== item.created_by ||
      !isSameDay(item.created_at, nextItem.created_at);

    const avatarUri =
      authorProfile?.avatar_url ||
      (isMe ? user?.user_metadata?.avatar_url || user?.user_metadata?.picture : null);

    const isNew = isInitialLoadDoneRef.current && !initialMessageIdsRef.current.has(item.id);

    return (
      <MessageBubble
        item={item}
        isMe={isMe}
        authorProfile={authorProfile}
        isSending={isSending || false}
        showDaySeparator={showDaySeparator}
        dayLabel={dayLabel}
        isLastInGroup={isLastInGroup}
        isDark={isDark}
        themeTokens={themeTokens}
        avatarUri={avatarUri}
        reducedMotion={reducedMotion}
        isNew={isNew}
      />
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={renderMessageItem}
      contentContainerStyle={[
        styles.listContent,
        {
          paddingTop: insets.top + (Platform.OS === 'ios' ? 70 : 66),
          paddingBottom: 16,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onContentSizeChange={handleContentSizeChange}
      maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
      ListHeaderComponent={
        loadingOlder ? (
          <View style={styles.loadingOlderContainer}>
            <ActivityIndicator size="small" color={themeTokens.primary} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyCard: {
    padding: 28,
    alignItems: 'center',
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  loadingOlderContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
