import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from '@/design/ui/PressableScale';
import { MemoryItem, MemberProfile } from '../types';
import { formatFullDatePTBR, formatSavedAtDateTime } from '../utils/formatting';

interface MemoryCardProps {
  item: MemoryItem;
  index: number;
  user: any;
  profileMap: Map<string, MemberProfile>;
  isDark: boolean;
  themeTokens: any;
  reducedMotion: boolean;
  onPreview: (item: MemoryItem) => void;
  onDelete: (item: MemoryItem) => void;
}

export function MemoryCard({
  item,
  index,
  user,
  profileMap,
  isDark,
  themeTokens,
  reducedMotion,
  onPreview,
  onDelete,
}: MemoryCardProps) {
  const imageUrl = item.displayThumbUrl || item.displayUrl || item.image_url;
  const authorProfile = item.created_by ? profileMap.get(item.created_by) : undefined;
  const isMe = item.created_by === user?.id;
  const authorName = isMe ? 'Você' : authorProfile?.name || 'Parceiro(a)';
  const isHero = index === 0;

  return (
    <Animated.View
      layout={reducedMotion ? undefined : LinearTransition.duration(250)}
      style={styles.cardWrapper}
    >
      <PressableScale
        onPress={() => onPreview(item)}
        onLongPress={() => onDelete(item)}
        activeOpacity={0.94}
      >
        <View
          style={[
            styles.memoryCard,
            {
              borderColor: themeTokens.glassBorder,
              backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
              shadowColor: themeTokens.shadow,
            },
            isHero && [
              styles.heroMemoryCard,
              {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(124, 111, 224, 0.20)',
              },
            ],
          ]}
        >
          <Image
            source={{ uri: imageUrl }}
            style={[styles.cardImage, isHero && styles.heroCardImage]}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            recyclingKey={item.id}
          />

          <View style={styles.cardContent}>
            <View style={styles.cardMetaRow}>
              <View
                style={[
                  styles.datePill,
                  {
                    backgroundColor: isDark ? 'rgba(142, 124, 232, 0.16)' : 'rgba(142, 124, 232, 0.1)',
                    borderColor: isDark ? 'rgba(142, 124, 232, 0.28)' : 'rgba(142, 124, 232, 0.18)',
                  },
                ]}
              >
                <Ionicons name="calendar-outline" size={13} color={themeTokens.primary} />
                <Text style={[styles.datePillText, { color: themeTokens.primary }]}>
                  {formatFullDatePTBR(item.memory_date)}
                </Text>
              </View>

              <View style={styles.signatureBadge}>
                <Ionicons name="sparkles" size={11} color={themeTokens.accent} />
                <Text style={[styles.signatureAuthorText, { color: themeTokens.primary }]} numberOfLines={1}>
                  Eternizado por {authorName}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.cardTitle,
                { color: themeTokens.textPrimary },
                isHero && styles.heroCardTitle,
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>

            {item.created_at ? (
              <View style={styles.savedAtRow}>
                <Ionicons name="time-outline" size={12} color={themeTokens.textSecondary} />
                <Text style={[styles.savedAtText, { color: themeTokens.textSecondary }]}>
                  Salvo em {formatSavedAtDateTime(item.created_at)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 20,
  },
  memoryCard: {
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  heroMemoryCard: {
    borderRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 124, 232, 0.08)',
  },
  heroCardImage: {
    height: 290,
    borderRadius: 22,
  },
  cardContent: {
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 4,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
    borderWidth: 1,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  heroCardTitle: {
    fontSize: 21,
    lineHeight: 28,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  signatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.15)',
  },
  signatureAuthorText: {
    fontSize: 11,
    fontWeight: '700',
  },
  savedAtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  savedAtText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
