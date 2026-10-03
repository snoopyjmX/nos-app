import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { PressableScale } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useTheme } from '@/theme';

interface MemoryRowCardProps {
  imageUri?: string | null;
  fallbackIcon: keyof typeof Feather.glyphMap;
  tag?: string;
  title: string;
  meta: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  titleLines?: number;
  onPress: () => void;
}

export function MemoryRowCard({
  imageUri,
  fallbackIcon,
  tag,
  title,
  meta,
  accessibilityLabel,
  accessibilityHint,
  titleLines = 2,
  onPress,
}: MemoryRowCardProps) {
  const { colors, typography, radii } = useTheme();

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <LiquidGlassView variant="card" readable borderRadius={radii.md} style={styles.card}>
        <View style={[styles.thumb, { backgroundColor: colors.primarySoft, borderRadius: radii.md }]}>
          {imageUri ? (
            <ExpoImage
              source={{ uri: imageUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          ) : (
            <Feather name={fallbackIcon} size={22} color={colors.primaryText} />
          )}
        </View>

        <View style={styles.content}>
          {tag ? (
            <Text style={[styles.tag, { color: colors.accentText, ...typography.font.bold }]}>
              {tag}
            </Text>
          ) : null}
          <Text
            style={[styles.title, { color: colors.textPrimary, ...typography.font.bold }]}
            numberOfLines={titleLines}
          >
            {title}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary, ...typography.font.regular }]}>
            {meta}
          </Text>
        </View>

        <Feather name="chevron-right" size={18} color={colors.textSecondary} />
      </LiquidGlassView>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 14,
  },
  thumb: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  tag: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
  },
});
