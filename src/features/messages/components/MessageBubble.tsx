import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { ZoomIn, FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/theme';
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
  avatarUri,
  reducedMotion,
  isNew,
}: MessageBubbleProps) {
  const { colors, typography, shadows, isDark } = useTheme();

  const avatar = (
    <View
      style={[
        styles.avatarContainer,
        {
          backgroundColor: colors.primarySoft,
          borderColor: isMe ? colors.primary : colors.border,
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
                ? [colors.primary, colors.primary]
                : [colors.primarySoft, colors.primarySoft]
            }
            style={StyleSheet.absoluteFill}
          />
          <Feather
            name="user"
            size={14}
            color={isMe ? '#FFFFFF' : colors.primary}
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
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.08)',
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.daySeparatorText,
                { color: colors.textSecondary, fontFamily: typography.fontFamily.bold },
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
              isSending && { opacity: 0.7 },
              shadows.soft,
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.messageTextMe, { fontFamily: typography.fontFamily.regular }]}>{item.content}</Text>
            <Text style={[styles.messageTimeMe, { fontFamily: typography.fontFamily.regular }]}>
              {isSending ? 'enviando...' : formatMessageTime(item.created_at)}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View
            entering={balloonEntering}
            style={[
              styles.messageBubble,
              styles.bubblePartner,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              !isLastInGroup && { borderBottomLeftRadius: 20 },
              shadows.soft,
            ]}
          >
            <Text
              style={[
                styles.messageTextPartner,
                { color: colors.textPrimary, fontFamily: typography.fontFamily.regular },
              ]}
            >
              {item.content}
            </Text>
            <Text
              style={[
                styles.messageTimePartner,
                { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
              ]}
            >
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
    marginVertical: 18,
  },
  daySeparatorChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  daySeparatorText: {
    fontSize: 12,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSpacer: {
    width: 28,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  bubbleMe: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
    marginRight: 8,
  },
  bubblePartner: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 20,
    marginLeft: 8,
    borderWidth: 1,
  },
  messageTextMe: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextPartner: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTimeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  messageTimePartner: {
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});
