import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { PressableScale } from '@/components/ui';
import { useTheme } from '@/theme';
import { MemoryItem, MemberProfile } from '../types';
import { formatFullDatePTBR, formatSavedAtDateTime } from '../utils/formatting';

interface MemoryCardProps {
  item: MemoryItem;
  index: number;
  user: any;
  profileMap: Map<string, MemberProfile>;
  reducedMotion: boolean;
  onPreview: (item: MemoryItem) => void;
  onDelete: (item: MemoryItem) => void;
}

export function MemoryCard({
  item,
  index,
  user,
  profileMap,
  reducedMotion,
  onPreview,
  onDelete,
}: MemoryCardProps) {
  const { colors, typography, radii, shadows } = useTheme();
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
      >
        <View
          style={[
            styles.memoryCard,
            {
              backgroundColor: colors.surface,
              borderRadius: radii.md,
              ...shadows.soft,
            },
            isHero && styles.heroMemoryCard,
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
                    backgroundColor: colors.primarySoft,
                    borderRadius: radii.pill,
                  },
                ]}
              >
                <Feather name="calendar" size={13} color={colors.primary} />
                <Text style={[styles.datePillText, { color: colors.primary, fontFamily: typography.fontFamily.bold }]}>
                  {formatFullDatePTBR(item.memory_date)}
                </Text>
              </View>

              <View style={styles.signatureBadge}>
                <Feather name="star" size={11} color={colors.accent} />
                <Text style={[styles.signatureAuthorText, { color: colors.primary, fontFamily: typography.fontFamily.regular }]} numberOfLines={1}>
                  Eternizado por {authorName}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.cardTitle,
                { color: colors.textPrimary, fontFamily: typography.fontFamily.bold },
                isHero && styles.heroCardTitle,
              ]}
            >
              {item.title}
            </Text>

            <View style={styles.footerRow}>
              <Text style={[styles.savedAtText, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
                {formatSavedAtDateTime(item.created_at)}
              </Text>
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 20,
    width: '100%',
  },
  memoryCard: {
    overflow: 'hidden',
  },
  heroMemoryCard: {
    // hero card style
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#EAEAEA',
  },
  heroCardImage: {
    height: 280,
  },
  cardContent: {
    padding: 16,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  datePillText: {
    fontSize: 12,
  },
  signatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    marginLeft: 8,
  },
  signatureAuthorText: {
    fontSize: 11,
    flexShrink: 1,
  },
  cardTitle: {
    fontSize: 20,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  heroCardTitle: {
    fontSize: 24,
    letterSpacing: -0.6,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  heroCardDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  savedAtText: {
    fontSize: 11,
  },
  syncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncText: {
    fontSize: 11,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: 11,
  },
});
