import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/ui';
import { useTheme } from '@/theme';

interface FilterTabsProps {
  activeTab: 'upcoming' | 'past';
  setActiveTab: (tab: 'upcoming' | 'past') => void;
  upcomingCount: number;
  pastCount: number;
}

export function FilterTabs({ activeTab, setActiveTab, upcomingCount, pastCount }: FilterTabsProps) {
  const { colors, typography, radii, shadows } = useTheme();

  return (
    <View style={[styles.segmentedControl, { backgroundColor: colors.primarySoft, borderRadius: radii.md }]}>
      <PressableScale
        style={[
          styles.segmentButton,
          { borderRadius: radii.md - 4 },
          activeTab === 'upcoming' && [
            { backgroundColor: colors.surface },
            shadows.soft,
          ],
        ]}
        onPress={() => setActiveTab('upcoming')}
      >
        <Text
          style={[
            styles.segmentText,
            { color: colors.textSecondary, fontFamily: typography.fontFamily.bold },
            activeTab === 'upcoming' && { color: colors.primary },
          ]}
        >
          Próximas ({upcomingCount})
        </Text>
      </PressableScale>
      <PressableScale
        style={[
          styles.segmentButton,
          { borderRadius: radii.md - 4 },
          activeTab === 'past' && [
            { backgroundColor: colors.surface },
            shadows.soft,
          ],
        ]}
        onPress={() => setActiveTab('past')}
      >
        <Text
          style={[
            styles.segmentText,
            { color: colors.textSecondary, fontFamily: typography.fontFamily.bold },
            activeTab === 'past' && { color: colors.primary },
          ]}
        >
          Histórico ({pastCount})
        </Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  segmentedControl: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 14,
  },
});
