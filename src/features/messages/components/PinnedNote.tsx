import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BorderBeam, PressableScale } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useTheme } from '@/theme';

interface PinnedNoteProps {
  label: string;
  /** Sem conteúdo, mostra o estado vazio. */
  content?: string;
  meta?: string;
}

export function PinnedNote({ label, content, meta }: PinnedNoteProps) {
  const { colors, typography, radii, spacing } = useTheme();

  const [expanded, setExpanded] = useState(false);

  return (
    <PressableScale
      onPress={() => setExpanded((value) => !value)}
      accessibilityRole="button"
      accessibilityLabel={meta ? `${label}, ${meta}` : label}
      accessibilityHint={expanded ? 'Toque para recolher o bilhete' : 'Toque para ler o bilhete'}
      accessibilityState={{ expanded }}
    >
      <LiquidGlassView
        variant="card"
        readable
        borderRadius={radii.md}
        style={[styles.card, { gap: spacing[12], padding: spacing[12] }]}
      >
        <View style={[styles.icon, { backgroundColor: colors.accentGlass }]}>
          <Feather name="feather" size={16} color={colors.accentText} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.label, { color: colors.accentText, ...typography.font.bold }]}>
            {label.toUpperCase()}
          </Text>
          {expanded ? (
            content ? (
              <>
                <Text
                  style={[styles.content, { color: colors.textPrimary, ...typography.font.regular }]}
                  numberOfLines={3}
                >
                  {content}
                </Text>
                <Text style={[styles.meta, { color: colors.textMuted, ...typography.font.regular }]}>
                  {meta}
                </Text>
              </>
            ) : (
              <Text style={[styles.content, { color: colors.textSecondary, ...typography.font.regular }]}>
                Nenhum bilhete deixado ainda. Deixe um recado especial.
              </Text>
            )
          ) : null}
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        <BorderBeam radius={radii.md} color={colors.accentText} />
      </LiquidGlassView>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  content: {
    fontSize: 15,
    lineHeight: 21,
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
});
