import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedIcon, PressableScale } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useTheme } from '@/theme';

interface ShortcutsRowProps {
  handleOpenMessages: () => void;
  handleOpenMemories: () => void;
  handleOpenDates: () => void;
  shouldAnimateCascade: boolean;
}

interface Shortcut {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}

function ShortcutPill({ shortcut }: { shortcut: Shortcut }) {
  const { colors, typography, radii, spacing } = useTheme();
  const [pulse, setPulse] = useState(0);

  return (
    <PressableScale
      style={styles.item}
      onPress={shortcut.onPress}
      onPressIn={() => setPulse((value) => value + 1)}
      accessibilityRole="button"
      accessibilityLabel={shortcut.accessibilityLabel}
    >
      <LiquidGlassView
        variant="control"
        readable
        borderRadius={radii.pill}
        style={[styles.pill, { gap: spacing[8], paddingHorizontal: spacing[12] }]}
      >
        <AnimatedIcon name={shortcut.icon} size={18} color={colors.primaryText} pulseKey={pulse} />
        <Text style={[styles.label, { color: colors.primaryText, ...typography.font.bold }]} numberOfLines={1}>
          {shortcut.label}
        </Text>
      </LiquidGlassView>
    </PressableScale>
  );
}

export function ShortcutsRow({
  handleOpenMessages,
  handleOpenMemories,
  handleOpenDates,
  shouldAnimateCascade,
}: ShortcutsRowProps) {
  const { spacing } = useTheme();

  const shortcuts: Shortcut[] = [
    {
      key: 'messages',
      icon: 'message-circle',
      label: 'Recado',
      accessibilityLabel: 'Deixar novo recado',
      onPress: handleOpenMessages,
    },
    {
      key: 'memories',
      icon: 'camera',
      label: 'Foto',
      accessibilityLabel: 'Adicionar nova foto ou memória',
      onPress: handleOpenMemories,
    },
    {
      key: 'dates',
      icon: 'calendar',
      label: 'Datas',
      accessibilityLabel: 'Ver ou adicionar datas importantes',
      onPress: handleOpenDates,
    },
  ];

  return (
    <Animated.View
      entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(60) : undefined}
      style={[styles.row, { gap: spacing[8], marginBottom: spacing[16] }]}
    >
      {shortcuts.map((shortcut) => (
        <ShortcutPill key={shortcut.key} shortcut={shortcut} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  item: {
    flex: 1,
  },
  pill: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    flexShrink: 1,
  },
});
