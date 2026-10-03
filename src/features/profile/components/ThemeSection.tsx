import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedIcon } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { LiquidThemeSelector } from '@/components/ui/LiquidThemeSelector';
import { useTheme } from '@/theme';

interface ThemeSectionProps {
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
}

export function ThemeSection({ mode, setMode }: ThemeSectionProps) {
  const { colors, typography, radii, spacing } = useTheme();

  return (
    <View style={{ marginBottom: spacing[20] }}>
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: spacing[8], ...typography.font.bold }]}
      >
        APARÊNCIA
      </Text>

      <LiquidGlassView variant="card" readable borderRadius={radii.md} style={{ padding: spacing[16], gap: spacing[16] }}>
        <View style={[styles.headerRow, { gap: spacing[12] }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
            <AnimatedIcon
              name={mode === 'dark' ? 'moon' : 'sun'}
              size={20}
              color={colors.primaryText}
              active={mode === 'dark'}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.textPrimary, ...typography.font.bold }]}>Tema do aplicativo</Text>
            <Text style={[styles.description, { color: colors.textSecondary, ...typography.font.regular }]}>
              {mode === 'dark' ? 'Modo Escuro (roxo-noite)' : 'Modo Claro'}
            </Text>
          </View>
        </View>

        <LiquidThemeSelector currentMode={mode} onChangeMode={setMode} />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
});
