import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from '@/design/ui/PressableScale';

interface ShortcutsRowProps {
  handleOpenMessages: () => void;
  handleOpenMemories: () => void;
  handleOpenDates: () => void;
  shouldAnimateCascade: boolean;
  isDark: boolean;
  themeTokens: any;
}

export function ShortcutsRow({
  handleOpenMessages,
  handleOpenMemories,
  handleOpenDates,
  shouldAnimateCascade,
  isDark,
  themeTokens,
}: ShortcutsRowProps) {
  return (
    <Animated.View
      entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(60) : undefined}
      style={styles.shortcutsRow}
    >
      <PressableScale
        style={[
          styles.shortcutCard,
          {
            backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
          },
        ]}
        onPress={handleOpenMessages}
      >
        <Ionicons name="chatbubble" size={17} color={themeTokens.primary} />
        <Text style={[styles.shortcutText, { color: themeTokens.primary }]}>Recado</Text>
      </PressableScale>

      <PressableScale
        style={[
          styles.shortcutCard,
          {
            backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
          },
        ]}
        onPress={handleOpenMemories}
      >
        <Ionicons name="camera" size={18} color={themeTokens.primary} />
        <Text style={[styles.shortcutText, { color: themeTokens.primary }]}>Memória</Text>
      </PressableScale>

      <PressableScale
        style={[
          styles.shortcutCard,
          {
            backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
          },
        ]}
        onPress={handleOpenDates}
      >
        <Ionicons name="calendar" size={17} color={themeTokens.primary} />
        <Text style={[styles.shortcutText, { color: themeTokens.primary }]}>Datas</Text>
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
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#7C6FE0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  shortcutText: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
  },
});
