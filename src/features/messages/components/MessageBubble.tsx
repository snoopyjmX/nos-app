import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { ZoomIn, FadeIn } from 'react-native-reanimated';
import { Message, UserProfile } from '../types';
import { formatMessageTime } from '../utils/dateFormatting';

interface MessageBubbleProps {
  item: Message;
  isMe: boolean;
  authorProfile?: UserProfile;
  isSending: boolean;
  showDaySeparator: boolean;
  dayLabel: string;
  isLastInGroup: boolean;
  isDark: boolean;
  themeTokens: any;
  avatarUri?: string | null;
  reducedMotion: boolean;
  isNew: boolean;
}

export function MessageBubble({
  item,
  isMe,
  authorProfile,
  isSending,
  showDaySeparator,
  dayLabel,
  isLastInGroup,
  isDark,
  themeTokens,
  avatarUri,
  reducedMotion,
  isNew,
}: MessageBubbleProps) {
  const avatar = (
    <View
      style={[
        styles.avatarContainer,
        {
          backgroundColor: isDark
            ? 'rgba(157, 146, 240, 0.15)'
            : 'rgba(124, 111, 224, 0.12)',
          borderColor: isMe
            ? themeTokens.primary
            : isDark
            ? 'rgba(157, 146, 240, 0.4)'
            : 'rgba(124, 111, 224, 0.35)',
        },
      ]}
    >
      {avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.avatarFallback}>
          <LinearGradient
            colors={
              isMe
                ? [themeTokens.primary, themeTokens.primaryDark]
                : isDark
                ? ['#9D92F0', '#F7A6BB']
                : ['#EFECFC', '#FDEEF2']
            }
            style={StyleSheet.absoluteFill}
          />
          <Ionicons
            name="person"
            size={14}
            color={isMe ? '#FFFFFF' : themeTokens.primary}
          />
        </View>
      )}
    </View>
  );

  const balloonEntering = isNew
    ? (reducedMotion ? FadeIn.duration(150) : ZoomIn.duration(220))
    : undefined;

  return (
    <View>
      {showDaySeparator && (
        <View style={styles.daySeparatorContainer}>
          <View
            style={[
              styles.daySeparatorChip,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(124, 111, 224, 0.08)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(124, 111, 224, 0.15)',
              },
            ]}
          >
            <Text
              style={[
                styles.daySeparatorText,
                { color: themeTokens.textSecondary, fontFamily: 'Nunito_600SemiBold' },
              ]}
            >
              {dayLabel}
            </Text>
          </View>
        </View>
      )}

      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowMe : styles.messageRowPartner,
          { marginBottom: isLastInGroup ? 12 : 3 },
        ]}
      >
        {!isMe && (isLastInGroup ? avatar : <View style={styles.avatarSpacer} />)}

        {isMe ? (
          <Animated.View
            entering={balloonEntering}
            style={[
              styles.messageBubble,
              styles.bubbleMe,
              !isLastInGroup && { borderBottomRightRadius: 20 },
              isSending && styles.bubbleSending,
            ]}
          >
            <LinearGradient
              colors={isDark ? ['#9D92F0', '#7C6FE0'] : ['#7C6FE0', '#6358D4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.messageTextMe}>{item.content}</Text>
            <Text style={styles.messageTimeMe}>
              {isSending ? 'enviando...' : formatMessageTime(item.created_at)}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View
            entering={balloonEntering}
            style={[
              styles.messageBubble,
              styles.bubblePartner,
              !isLastInGroup && { borderBottomLeftRadius: 20 },
              {
                backgroundColor: isDark ? themeTokens.surface : '#FFFFFF',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(124, 111, 224, 0.15)',
              },
            ]}
          >
            <Text style={[styles.messageTextPartner, { color: themeTokens.textPrimary }]}>
              {item.content}
            </Text>
            <Text style={[styles.messageTimePartner, { color: themeTokens.textSecondary }]}>
              {formatMessageTime(item.created_at)}
            </Text>
          </Animated.View>
        )}

        {isMe && (isLastInGroup ? avatar : <View style={styles.avatarSpacer} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  daySeparatorContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  daySeparatorChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  daySeparatorText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowPartner: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  avatarSpacer: {
    width: 30,
    marginHorizontal: 6,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleMe: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 6,
    overflow: 'hidden',
    shadowColor: '#7C6FE0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  bubblePartner: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  messageTextMe: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 21,
    fontWeight: '500',
  },
  messageTextPartner: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  messageTimeMe: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    alignSelf: 'flex-end',
    fontWeight: '500',
  },
  messageTimePartner: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontWeight: '500',
  },
  bubbleSending: {
    opacity: 0.75,
  },
});
