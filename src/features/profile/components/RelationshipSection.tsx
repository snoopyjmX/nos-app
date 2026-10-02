import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PressableScale } from '@/components/ui/PressableScale';
import { useTheme } from '@/theme';
import { formatFullDatePTBR } from '../utils/formatting';

interface RelationshipSectionProps {
  anniversaryDate: string | null;
  coupleCode: string | null;
  onOpenDateModal: () => void;
}

export function RelationshipSection({
  anniversaryDate,
  coupleCode,
  onOpenDateModal,
}: RelationshipSectionProps) {
  const { colors, typography, radii, isDark } = useTheme();
  const [copiedCode, setCopiedCode] = useState(false);

  const copyCoupleCode = async () => {
    if (!coupleCode) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(coupleCode);
      }
      setCopiedCode(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      Alert.alert('Código do Casal', coupleCode);
    }
  };

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.bold }]}>
          NOSSO RELACIONAMENTO
        </Text>
      </View>

      <View
        style={[
          styles.relationshipCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.md,
          },
        ]}
      >
        <View
          style={[
            styles.relationIconCircle,
            {
              backgroundColor: isDark
                ? 'rgba(157, 146, 240, 0.15)'
                : 'rgba(124, 111, 224, 0.10)',
            },
          ]}
        >
          <Feather name="calendar" size={22} color={colors.primary} />
        </View>

        <View style={styles.relationContent}>
          <Text style={[styles.relationLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily.medium }]}>
            Data de Início Oficial
          </Text>
          <Text style={[styles.relationDateValue, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
            {formatFullDatePTBR(anniversaryDate)}
          </Text>
        </View>

        <PressableScale
          style={[
            styles.editPill,
            {
              backgroundColor: isDark
                ? 'rgba(157, 146, 240, 0.15)'
                : 'rgba(124, 111, 224, 0.10)',
              borderColor: isDark
                ? 'rgba(157, 146, 240, 0.25)'
                : 'rgba(124, 111, 224, 0.20)',
            },
          ]}
          onPress={onOpenDateModal}
          accessibilityLabel="Editar data oficial"
        >
          <Feather name="edit-2" size={13} color={colors.primary} />
          <Text style={[styles.editPillText, { color: colors.primary, fontFamily: typography.fontFamily.bold }]}>Editar</Text>
        </PressableScale>
      </View>

      {coupleCode && (
        <View
          style={[
            styles.codeCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radii.md,
            },
          ]}
        >
          <View
            style={[
              styles.codeIconCircle,
              {
                backgroundColor: isDark
                  ? 'rgba(157, 146, 240, 0.15)'
                  : 'rgba(124, 111, 224, 0.10)',
              },
            ]}
          >
            <Feather name="key" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={styles.codeHeaderRow}>
              <Text style={[styles.codeLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily.medium }]}>
                Código do Casal
              </Text>
              <View
                style={[
                  styles.linkedBadge,
                  {
                    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.10)',
                  },
                ]}
              >
                <Feather name="check-circle" size={13} color="#22C55E" />
                <Text style={[styles.linkedBadgeText, { color: isDark ? '#4ADE80' : '#15803D', fontFamily: typography.fontFamily.bold }]}>
                  Vinculado
                </Text>
              </View>
            </View>
            <Text style={[styles.codeValue, { color: colors.textPrimary }]}>
              {coupleCode}
            </Text>
          </View>

          <PressableScale
            style={[
              styles.copyPill,
              {
                backgroundColor: copiedCode
                  ? (isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.12)')
                  : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.10)'),
                borderColor: copiedCode
                  ? '#22C55E'
                  : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(124, 111, 224, 0.20)'),
              },
            ]}
            onPress={copyCoupleCode}
            accessibilityLabel="Copiar código de casal"
          >
            <Feather
              name={copiedCode ? "check" : "copy"}
              size={14}
              color={copiedCode ? '#22C55E' : colors.primary}
            />
            <Text
              style={[
                styles.copyPillText,
                { color: copiedCode ? '#22C55E' : colors.primary, fontFamily: typography.fontFamily.bold },
              ]}
            >
              {copiedCode ? 'Copiado!' : 'Copiar'}
            </Text>
          </PressableScale>
        </View>
      )}
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
  relationshipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  relationIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  relationContent: {
    flex: 1,
  },
  relationLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  relationDateValue: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  editPillText: {
    fontSize: 12,
  },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    marginTop: 12,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  codeIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  codeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  codeLabel: {
    fontSize: 11,
  },
  codeValue: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    letterSpacing: 2,
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  linkedBadgeText: {
    fontSize: 11,
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  copyPillText: {
    fontSize: 12,
  },
});
