import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IntegrationCard } from '@/components/ui';
import { useTheme } from '@/theme';

export function TechnologiesSection() {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={{ marginBottom: spacing[20] }}>
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: spacing[8], ...typography.font.bold }]}
      >
        ARQUITETURA & TECNOLOGIAS
      </Text>

      <IntegrationCard />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 1.2,
    paddingHorizontal: 4,
  },
});
