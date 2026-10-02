import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme';

export function SecuritySection() {
  const { colors, typography, radii, isDark } = useTheme();
  const [showPresence, setShowPresence] = useState(true);

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.bold }]}>
          PREFERÊNCIAS & SEGURANÇA
        </Text>
      </View>

      <View
        style={[
          styles.securityCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.md,
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
            <Feather name="shield" size={20} color="#22C55E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.securityTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
              Espaço Privado & Seguro
            </Text>
            <Text style={[styles.securitySubtitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
              Apenas você e seu parceiro(a) têm acesso a este espaço. Tudo é guardado com segurança.
            </Text>
          </View>
        </View>

        <View style={[styles.securityDivider, { backgroundColor: colors.border }]} />

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
            <Feather name="lock" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.securityTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
              Privado e Protegido
            </Text>
            <Text style={[styles.securitySubtitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
              Suas fotos, memórias e recados são estritamente confidenciais.
            </Text>
          </View>
        </View>

        <View style={[styles.securityDivider, { backgroundColor: colors.border }]} />

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
            <Feather name="eye" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.securityTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
              Status de Presença
            </Text>
            <Text style={[styles.securitySubtitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
              Mostrar "Online agora" ou "Visto há..." para seu parceiro(a).
            </Text>
          </View>
          <Switch
            value={showPresence}
            onValueChange={setShowPresence}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (showPresence ? colors.primarySoft : '#f4f3f4')}
          />
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
    letterSpacing: 1.2,
  },
  securityCard: {
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
    marginBottom: 2,
  },
  securitySubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  securityDivider: {
    height: 1,
    marginVertical: 12,
  },
});
