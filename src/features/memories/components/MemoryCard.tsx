import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { PressableScale } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useTheme } from '@/theme';
import { MemoryItem, MemberProfile } from '../types';
import { formatDayMonthPTBR, formatFullDatePTBR, formatSavedAtDateTime } from '../utils/formatting';

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
  const { colors, typography, radii, shadows, spacing } = useTheme();
  const imageUrl = item.displayThumbUrl || item.displayUrl || item.image_url;
  const authorProfile = item.created_by ? profileMap.get(item.created_by) : undefined;
  const isMe = item.created_by === user?.id;
  const authorName = isMe ? 'Você' : authorProfile?.name || 'Parceiro(a)';
  const isHero = index === 0;

  return (
    <Animated.View
      layout={reducedMotion ? undefined : LinearTransition.duration(250)}
      style={[styles.cardWrapper, { marginBottom: spacing[32] }]}
    >
      <PressableScale
        onPress={() => onPreview(item)}
        onLongPress={() => onDelete(item)}
        accessibilityRole="button"
        accessibilityLabel={`Memória: ${item.title}, ${formatFullDatePTBR(item.memory_date)}`}
        accessibilityHint="Toque para ver em tela cheia. Segure para remover."
      >
        {/* Camada externa: só sombra e raio. A interna recorta a foto. */}
        <View style={[{ borderRadius: radii.lg, backgroundColor: colors.primarySoft }, shadows.soft]}>
          <View style={[styles.photo, { borderRadius: radii.lg }]}>
            <Image
              source={{ uri: imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={Platform.OS === 'web' ? 0 : 150}
              cachePolicy="memory-disk"
              priority="high"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
            <LinearGradient colors={colors.photoScrimTop} style={styles.topScrim} pointerEvents="none" />

            <LiquidGlassView
              variant="pill"
              tintColor={colors.photoBadge}
              borderRadius={radii.pill}
              style={[styles.dateBadge, { gap: spacing[8] }]}
            >
              <Feather name="calendar" size={13} color={colors.white} />
              <Text style={[styles.dateBadgeText, { color: colors.white, ...typography.font.bold }]}>
                {formatDayMonthPTBR(item.memory_date)}
              </Text>
            </LiquidGlassView>
          </View>
        </View>

        {/* Texto corrido sem vidro: legível e completo */}
        <View style={[styles.textBlock, { gap: spacing[8], paddingHorizontal: spacing[4], paddingTop: spacing[16] }]}>
          <View style={styles.metaRow}>
            <Feather name="star" size={12} color={colors.accentText} />
            <Text style={[styles.meta, { color: colors.textSecondary, ...typography.font.medium }]}>
              Eternizado por {authorName}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary, ...typography.font.regular }]}>
              · {formatSavedAtDateTime(item.created_at)}
            </Text>
          </View>

          <Text
            style={[
              styles.title,
              { color: colors.textPrimary, ...typography.font.black },
              isHero && styles.heroTitle,
            ]}
          >
            {item.title}
          </Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    overflow: 'hidden',
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
  },
  dateBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: '85%',
  },
  dateBadgeText: {
    fontSize: 13,
    flexShrink: 1,
  },
  textBlock: {},
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 6,
    rowGap: 2,
  },
  meta: {
    fontSize: 13,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.7,
  },
});
