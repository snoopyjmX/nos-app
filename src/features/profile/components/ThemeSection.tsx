import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { LiquidThemeSelector } from '@/design/ui/LiquidThemeSelector';

interface ThemeSectionProps {
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
}

export function ThemeSection({ mode, setMode }: ThemeSectionProps) {
  const { colors, typography, radii, isDark } = useTheme();

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.bold }]}>
          APARÊNCIA & TEMA
        </Text>
      </View>

      <View
        style={[
          styles.themeCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.md,
          },
        ]}
      >
        <View style={styles.themeHeaderRow}>
          <View
            style={[
              styles.themeIconCircle,
              {
                backgroundColor: isDark
                  ? 'rgba(157, 146, 240, 0.15)'
                  : 'rgba(124, 111, 224, 0.10)',
              },
            ]}
          >
            <Feather
              name={mode === 'dark' ? 'moon' : 'sun'}
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.themeCardTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
              Tema do Aplicativo
            </Text>
            <Text style={[styles.themeCardDesc, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
              {mode === 'dark' ? 'Modo Escuro (roxo-noite)' : 'Modo Claro'}
            </Text>
          </View>
        </View>

        <LiquidThemeSelector currentMode={mode} onChangeMode={setMode} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
  },
  themeCard: {
    padding: 16,
    borderWidth: 1,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  themeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  themeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCardTitle: {
    fontSize: 15,
  },
  themeCardDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
