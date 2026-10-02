import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SecuritySectionProps {
  isDark: boolean;
  themeTokens: any;
}

export function SecuritySection({ isDark, themeTokens }: SecuritySectionProps) {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: themeTokens.textSecondary }]}>
          PREFERÊNCIAS & SEGURANÇA
        </Text>
      </View>

      <View
        style={[
          styles.securityCard,
          {
            backgroundColor: isDark ? themeTokens.surface : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.15)',
          },
        ]}
      >
        <View style={styles.securityRow}>
          <View
            style={[
              styles.securityIconBox,
              {
                backgroundColor: isDark
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(34, 197, 94, 0.10)',
              },
            ]}
          >
            <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.securityTitle, { color: themeTokens.textPrimary }]}>
              Espaço Privado & Seguro
            </Text>
            <Text style={[styles.securitySubtitle, { color: themeTokens.textSecondary }]}>
              Protegido com Row Level Security (RLS) no Supabase. Somente vocês dois têm acesso às fotos, recados e memórias.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={themeTokens.textMuted} />
        </View>

        <View
          style={[
            styles.securityDivider,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(124, 111, 224, 0.10)',
            },
          ]}
        />

        <View style={styles.securityRow}>
          <View
            style={[
              styles.securityIconBox,
              {
                backgroundColor: isDark
                  ? 'rgba(157, 146, 240, 0.15)'
                  : 'rgba(124, 111, 224, 0.10)',
              },
            ]}
          >
            <Ionicons name="lock-closed" size={20} color={themeTokens.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.securityTitle, { color: themeTokens.textPrimary }]}>
              Armazenamento Criptografado
            </Text>
            <Text style={[styles.securitySubtitle, { color: themeTokens.textSecondary }]}>
              Buckets de fotos e arquivos privados com acesso controlado por assinaturas temporárias.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={themeTokens.textMuted} />
        </View>
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
  securityCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    marginBottom: 2,
  },
  securitySubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 17,
  },
  securityDivider: {
    height: 1,
    marginVertical: 12,
  },
});
