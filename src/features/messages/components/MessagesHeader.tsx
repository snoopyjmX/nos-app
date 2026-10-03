import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar, IconButton } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useTheme } from '@/theme';

interface MessagesHeaderProps {
  topInset: number;
  onGoBack: () => void;
  partnerName: string;
  partnerAvatarUri?: string | null;
}

export function MessagesHeader({
  topInset,
  onGoBack,
  partnerName,
  partnerAvatarUri,
}: MessagesHeaderProps) {
  const { colors, typography, radii, spacing } = useTheme();

  return (
    <View
      style={{ paddingTop: topInset + spacing[8], paddingHorizontal: spacing[16] }}
    >
      <LiquidGlassView
        variant="hero"
        borderRadius={radii.lg}
        style={[styles.card, { gap: spacing[12], paddingHorizontal: spacing[12], paddingVertical: spacing[12] }]}
      >
        <IconButton
          icon="arrow-left"
          variant="secondary"
          onPress={onGoBack}
          accessibilityLabel="Voltar"
        />

        <Avatar url={partnerAvatarUri} name={partnerName} size={44} />

        <View style={styles.identity}>
          <Text
            accessibilityRole="header"
            style={[styles.name, { color: colors.textPrimary, ...typography.font.black }]}
            numberOfLines={1}
          >
            {partnerName}
          </Text>
          <LiquidGlassView variant="pill" readable borderRadius={radii.pill} style={styles.badge}>
            <Text style={[styles.badgeText, { color: colors.textSecondary, ...typography.font.bold }]}>
              Espaço privado
            </Text>
          </LiquidGlassView>
        </View>
      </LiquidGlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  identity: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 20,
    letterSpacing: -0.4,
    alignSelf: 'stretch',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
  },
});
