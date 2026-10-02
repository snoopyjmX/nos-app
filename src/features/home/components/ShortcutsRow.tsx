import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui';
import { useTheme } from '@/theme';

interface ShortcutsRowProps {
  handleOpenMessages: () => void;
  handleOpenMemories: () => void;
  handleOpenDates: () => void;
  shouldAnimateCascade: boolean;
}

export function ShortcutsRow({
  handleOpenMessages,
  handleOpenMemories,
  handleOpenDates,
  shouldAnimateCascade,
}: ShortcutsRowProps) {
  const { colors, typography, radii, shadows } = useTheme();

  return (
    <Animated.View
      entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(60) : undefined}
      style={styles.shortcutsRow}
    >
      <PressableScale
        style={[
          styles.shortcutCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.md,
            ...shadows.soft,
          },
        ]}
        onPress={handleOpenMessages}
      >
        <Feather name="message-circle" size={17} color={colors.primary} />
        <Text style={[styles.shortcutText, { color: colors.primary, fontFamily: typography.fontFamily.bold }]}>Recado</Text>
      </PressableScale>

      <PressableScale
        style={[
          styles.shortcutCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.md,
            ...shadows.soft,
          },
        ]}
        onPress={handleOpenMemories}
      >
        <Feather name="camera" size={18} color={colors.primary} />
        <Text style={[styles.shortcutText, { color: colors.primary, fontFamily: typography.fontFamily.bold }]}>Memória</Text>
      </PressableScale>

      <PressableScale
        style={[
          styles.shortcutCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.md,
            ...shadows.soft,
          },
        ]}
        onPress={handleOpenDates}
      >
        <Feather name="calendar" size={17} color={colors.primary} />
        <Text style={[styles.shortcutText, { color: colors.primary, fontFamily: typography.fontFamily.bold }]}>Datas</Text>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shortcutsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  shortcutCard: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shortcutText: {
    fontSize: 13,
  },
});
