import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useTheme } from '@/theme';

type Tab = 'upcoming' | 'past';

interface FilterTabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  upcomingCount: number;
  pastCount: number;
}

export function FilterTabs({ activeTab, setActiveTab, upcomingCount, pastCount }: FilterTabsProps) {
  const { colors, typography, radii, spacing } = useTheme();

  const tabs: { key: Tab; label: string }[] = [
    { key: 'upcoming', label: `Próximas (${upcomingCount})` },
    { key: 'past', label: `Passadas (${pastCount})` },
  ];

  return (
    <LiquidGlassView
      variant="control"
      borderRadius={radii.pill}
      style={[styles.control, { padding: spacing[4], gap: spacing[4], marginBottom: spacing[20] }]}
      accessibilityRole="tablist"
    >
      {tabs.map((tab) => {
        const selected = activeTab === tab.key;
        return (
          <PressableScale
            key={tab.key}
            style={styles.segment}
            onPress={() => setActiveTab(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
          >
            {selected ? (
              <LiquidGlassView variant="pill" readable borderRadius={radii.pill} style={styles.segmentInner}>
                <Text style={[styles.text, { color: colors.primaryText, ...typography.font.bold }]}>{tab.label}</Text>
              </LiquidGlassView>
            ) : (
              <View style={styles.segmentInner}>
                <Text style={[styles.text, { color: colors.textSecondary, ...typography.font.medium }]}>
                  {tab.label}
                </Text>
              </View>
            )}
          </PressableScale>
        );
      })}
    </LiquidGlassView>
  );
}

const styles = StyleSheet.create({
  control: {
    flexDirection: 'row',
  },
  segment: {
    flex: 1,
  },
  segmentInner: {
    minHeight: 44,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
  },
});
