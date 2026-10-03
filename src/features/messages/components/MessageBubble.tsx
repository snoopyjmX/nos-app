import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { ZoomIn, FadeIn } from 'react-native-reanimated';
import { Avatar } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useTheme } from '@/theme';
import { Message, UserProfile } from '../types';
import { formatMessageTime } from '../utils/dateFormatting';

const BUBBLE_RADIUS = 20;
const TAIL_RADIUS = 6;
const AVATAR_SIZE = 28;

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
  const { colors, typography, radii, spacing } = useTheme();

  const balloonEntering = isNew
    ? reducedMotion
      ? FadeIn.duration(150)
      : ZoomIn.duration(220)
    : undefined;

  const time = formatMessageTime(item.created_at);
  const authorName = isMe ? 'Você' : authorProfile?.name?.split(' ')[0] || 'Seu amor';
  const statusLabel = isSending ? 'Enviando…' : time;

  // Cauda sutil só no último balão do grupo, no canto junto ao autor.
  const corners = isMe
    ? { borderBottomRightRadius: isLastInGroup ? TAIL_RADIUS : BUBBLE_RADIUS }
    : { borderBottomLeftRadius: isLastInGroup ? TAIL_RADIUS : BUBBLE_RADIUS };

  return (
    <View>
      {showDaySeparator && (
        <View style={[styles.daySeparator, { marginVertical: spacing[16] }]}>
          <LiquidGlassView variant="pill" readable borderRadius={radii.pill} style={styles.dayChip}>
            <Text
              accessibilityRole="header"
              style={[styles.dayText, { color: colors.textSecondary, ...typography.font.bold }]}
            >
              {dayLabel}
            </Text>
          </LiquidGlassView>
        </View>
      )}

      <View
        style={[
          styles.row,
          isMe ? styles.rowMe : styles.rowPartner,
          { marginBottom: isLastInGroup ? 14 : 4 },
        ]}
      >
        {!isMe &&
          (isLastInGroup ? (
            <Avatar url={avatarUri} name={authorName} size={AVATAR_SIZE} />
          ) : (
            <View style={styles.avatarSpacer} />
          ))}

        <Animated.View
          entering={balloonEntering}
          style={[styles.balloonWrapper, isSending && styles.sending]}
          accessible
          accessibilityLabel={`${authorName}, ${isSending ? 'enviando' : time}: ${item.content}`}
        >
          {isMe ? (
            <View
              style={[
                styles.bubble,
                styles.bubbleMe,
                { borderRadius: BUBBLE_RADIUS },
                corners,
              ]}
            >
              <LinearGradient
                colors={colors.bubbleSent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[styles.text, { color: colors.white, ...typography.font.regular }]}>
                {item.content}
              </Text>
              <Text style={[styles.time, { color: colors.white, ...typography.font.medium }]}>
                {statusLabel}
              </Text>
            </View>
          ) : (
            <LiquidGlassView
              variant="card"
              readable
              borderRadius={BUBBLE_RADIUS}
              corners={corners}
              style={styles.bubble}
            >
              <Text style={[styles.text, { color: colors.textPrimary, ...typography.font.regular }]}>
                {item.content}
              </Text>
              <Text style={[styles.time, { color: colors.textSecondary, ...typography.font.regular }]}>
                {time}
              </Text>
            </LiquidGlassView>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  daySeparator: {
    alignItems: 'center',
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dayText: {
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  rowMe: {
    justifyContent: 'flex-end',
  },
  rowPartner: {
    justifyContent: 'flex-start',
  },
  avatarSpacer: {
    width: AVATAR_SIZE,
  },
  balloonWrapper: {
    maxWidth: '78%',
    flexShrink: 1,
  },
  sending: {
    opacity: 0.7,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    overflow: 'hidden',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  time: {
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});
