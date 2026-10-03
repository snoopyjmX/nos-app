import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedIcon } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useTheme } from '@/theme';

const ITEMS = [
  {
    key: 'private',
    icon: 'shield' as const,
    title: 'Espaço privado e exclusivo',
    description: 'Apenas você e seu parceiro(a) têm acesso a este espaço.',
  },
  {
    key: 'confidential',
    icon: 'lock' as const,
    title: 'Só de vocês dois',
    description: 'Suas fotos, memórias e recados ficam visíveis somente para o casal.',
  },
];

export function SecuritySection() {
  const { colors, typography, radii, spacing } = useTheme();

  return (
    <View style={{ marginBottom: spacing[20] }}>
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: spacing[8], ...typography.font.bold }]}
      >
        PRIVACIDADE
      </Text>

      <LiquidGlassView variant="card" readable borderRadius={radii.md} style={{ padding: spacing[16], gap: spacing[16] }}>
        {ITEMS.map((item, index) => (
          <View key={item.key}>
            {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.border, marginBottom: spacing[16] }]} /> : null}
            <View style={[styles.row, { gap: spacing[12] }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
                <AnimatedIcon name={item.icon} size={20} color={colors.primaryText} />
              </View>
              <View style={styles.text}>
                <Text style={[styles.title, { color: colors.textPrimary, ...typography.font.bold }]}>{item.title}</Text>
                <Text style={[styles.description, { color: colors.textSecondary, ...typography.font.regular }]}>
                  {item.description}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </LiquidGlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 1.2,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
