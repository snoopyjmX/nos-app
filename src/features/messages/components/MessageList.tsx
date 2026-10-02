import React from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { EmptyState } from '@/components/ui';
import { useTheme } from '@/theme';
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
  insets,
  flatListRef,
  handleScroll,
  handleContentSizeChange,
}: MessageListProps) {
  const { colors, radii, shadows } = useTheme();

  if (messages.length === 0) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={[styles.centerContainer, { paddingTop: insets.top + 80 }]}>
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.surface,
                borderRadius: radii.md,
                borderWidth: 0,
                ...shadows.soft,
              },
            ]}
          >
            <EmptyState
              icon="mail"
              title="Nenhum bilhete ainda"
              description="Surpreenda seu amor deixando o primeiro recado carinhoso aqui. Cada mensagem fica guardada com carinho."
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
        avatarUri={avatarUri}
        reducedMotion={reducedMotion}
        isNew={isNew}
      />
    );
  };

  const renderHeaderComponent = () => {
    if (!loadingOlder) return null;
    return (
      <View style={styles.loadingOlderBox}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(i) => i.id}
      renderItem={renderMessageItem}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: insets.top + (Platform.OS === 'ios' ? 70 : 66),
          paddingBottom: 24,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onContentSizeChange={handleContentSizeChange}
      ListHeaderComponent={renderHeaderComponent}
      maintainVisibleContentPosition={
        Platform.OS === 'ios'
          ? { minIndexForVisible: 0, autoscrollToTopThreshold: 10 }
          : undefined
      }
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={Platform.OS === 'android'}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  loadingOlderBox: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});
