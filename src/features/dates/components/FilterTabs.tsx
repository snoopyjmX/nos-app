import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/design/ui/PressableScale';
import { useAppTheme } from '@/lib/context/ThemeContext';
import { getThemeTokens } from '@/design/tokens/theme';

interface FilterTabsProps {
  activeTab: 'upcoming' | 'past';
  setActiveTab: (tab: 'upcoming' | 'past') => void;
  upcomingCount: number;
  pastCount: number;
}

export function FilterTabs({ activeTab, setActiveTab, upcomingCount, pastCount }: FilterTabsProps) {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const styles = useMemo(() => getStyles(themeTokens, isDark), [themeTokens, isDark]);

  return (
    <View style={styles.segmentedControl}>
      <PressableScale
        style={[styles.segmentButton, activeTab === 'upcoming' && styles.segmentButtonActive]}
        onPress={() => setActiveTab('upcoming')}
      >
        <Text
          style={[
            styles.segmentText,
            activeTab === 'upcoming' && styles.segmentTextActive,
          ]}
        >
          Próximas ({upcomingCount})
        </Text>
      </PressableScale>
      <PressableScale
        style={[styles.segmentButton, activeTab === 'past' && styles.segmentButtonActive]}
        onPress={() => setActiveTab('past')}
      >
        <Text
          style={[styles.segmentText, activeTab === 'past' && styles.segmentTextActive]}
        >
          Histórico ({pastCount})
        </Text>
      </PressableScale>
    </View>
  );
}

const getStyles = (themeTokens: any, isDark: boolean) => StyleSheet.create({
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 111, 224, 0.08)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentButtonActive: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#FFFFFF',
    shadowColor: themeTokens.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    color: themeTokens.textSecondary,
  },
  segmentTextActive: {
    color: themeTokens.primary,
  },
});
