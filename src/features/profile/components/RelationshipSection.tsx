import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AnimatedIcon, PressableScale } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
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
  const { colors, typography, radii, spacing } = useTheme();
  const { copied: copiedCode, copy } = useCopyToClipboard();
  const [editPulse, setEditPulse] = useState(0);

  return (
    <View style={{ marginBottom: spacing[20] }}>
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: spacing[8], ...typography.font.bold }]}
      >
        NOSSO RELACIONAMENTO
      </Text>

      <LiquidGlassView variant="card" readable borderRadius={radii.md} style={[styles.card, { padding: spacing[16], gap: spacing[16] }]}>
        <View style={[styles.row, { gap: spacing[12] }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
            <Feather name="calendar" size={22} color={colors.primaryText} />
          </View>
          <View style={styles.rowContent}>
            <Text style={[styles.label, { color: colors.textSecondary, ...typography.font.medium }]}>
              Data de início da história
            </Text>
            <Text style={[styles.dateValue, { color: colors.textPrimary, ...typography.font.bold }]}>
              {formatFullDatePTBR(anniversaryDate)}
            </Text>
          </View>
        </View>

        <PressableScale
          onPress={onOpenDateModal}
          onPressIn={() => setEditPulse((value) => value + 1)}
          accessibilityRole="button"
          accessibilityLabel="Alterar data de início da história"
          style={styles.alignStart}
        >
          <LiquidGlassView variant="pill" readable borderRadius={radii.pill} style={[styles.pill, { gap: spacing[8] }]}>
            <AnimatedIcon name="edit-2" size={14} color={colors.primaryText} pulseKey={editPulse} />
            <Text style={[styles.pillText, { color: colors.primaryText, ...typography.font.bold }]}>Alterar data</Text>
          </LiquidGlassView>
        </PressableScale>

        {coupleCode ? (
          <View style={{ gap: spacing[8] }}>
            <View style={[styles.codeHeader, { gap: spacing[8] }]}>
              <Text style={[styles.label, { color: colors.textSecondary, ...typography.font.medium }]}>
                Código de vínculo do casal
              </Text>
              <View style={styles.linked}>
                <Feather name="check-circle" size={13} color={colors.success} />
                <Text style={[styles.linkedText, { color: colors.textPrimary, ...typography.font.bold }]}>Vinculado</Text>
              </View>
            </View>

            <PressableScale
              onPress={() => copy(coupleCode)}
              accessibilityRole="button"
              accessibilityLabel={copiedCode ? 'Código copiado' : `Código do casal ${coupleCode.split('').join(' ')}. Toque para copiar`}
              accessibilityLiveRegion="polite"
            >
              <LiquidGlassView variant="pill" readable borderRadius={radii.pill} style={[styles.codeCapsule, { gap: spacing[12], paddingHorizontal: spacing[16] }]}>
                <Text style={[styles.code, { color: colors.textPrimary, ...typography.font.mono }]} selectable={false}>
                  {coupleCode}
                </Text>
                <View style={styles.copyState}>
                  <Feather name={copiedCode ? 'check' : 'copy'} size={14} color={copiedCode ? colors.success : colors.primaryText} />
                  <Text style={[styles.copyText, { color: copiedCode ? colors.textPrimary : colors.primaryText, ...typography.font.bold }]}>
                    {copiedCode ? 'Copiado!' : 'Copiar'}
                  </Text>
                </View>
              </LiquidGlassView>
            </PressableScale>
          </View>
        ) : null}
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
  card: {},
  row: {
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
  rowContent: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
  },
  dateValue: {
    fontSize: 17,
    marginTop: 2,
  },
  alignStart: {
    alignSelf: 'flex-start',
  },
  pill: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  pillText: {
    fontSize: 13,
  },
  codeHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  linked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkedText: {
    fontSize: 12,
  },
  codeCapsule: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  code: {
    fontSize: 18,
    letterSpacing: 3,
  },
  copyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyText: {
    fontSize: 13,
  },
});
