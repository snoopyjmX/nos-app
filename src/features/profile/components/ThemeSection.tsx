import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LiquidThemeSelector } from '@/design/ui/LiquidThemeSelector';

interface ThemeSectionProps {
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
  isDark: boolean;
  themeTokens: any;
}

export function ThemeSection({ mode, setMode, isDark, themeTokens }: ThemeSectionProps) {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: themeTokens.textSecondary }]}>
          APARÊNCIA & TEMA
        </Text>
      </View>

      <View
        style={[
          styles.themeCard,
          {
            backgroundColor: isDark ? themeTokens.surface : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.15)',
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
            <Ionicons
              name={mode === 'dark' ? 'moon' : 'sunny'}
              size={20}
              color={themeTokens.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.themeCardTitle, { color: themeTokens.textPrimary }]}>
              Tema do Aplicativo
            </Text>
            <Text style={[styles.themeCardDesc, { color: themeTokens.textSecondary }]}>
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
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  themeCard: {
    borderRadius: 20,
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
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
  },
  themeCardDesc: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },
});
