import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AnimatedIcon, PressableScale } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useTheme } from '@/theme';

interface AccountActionsProps {
  onSignOut: () => void;
}

export function AccountActions({ onSignOut }: AccountActionsProps) {
  const { colors, typography, radii, spacing } = useTheme();
  const router = useRouter();
  const [pulse, setPulse] = React.useState(0);

  return (
    <View style={{ marginTop: spacing[8], marginBottom: spacing[20], gap: spacing[16] }}>
      <PressableScale
        onPress={onSignOut}
        onPressIn={() => setPulse((value) => value + 1)}
        accessibilityRole="button"
        accessibilityLabel="Encerrar sessão"
        accessibilityHint="Sai da sua conta neste aparelho"
      >
        <LiquidGlassView variant="control" readable borderRadius={radii.pill} style={[styles.signOut, { gap: spacing[8] }]}>
          <AnimatedIcon name="log-out" size={18} color={colors.dangerText} pulseKey={pulse} />
          <Text style={[styles.signOutText, { color: colors.dangerText, ...typography.font.bold }]}>Encerrar sessão</Text>
        </LiquidGlassView>
      </PressableScale>

      <View style={[styles.links, { gap: spacing[16] }]}>
        <PressableScale onPress={() => router.push('/terms')} style={styles.link} accessibilityRole="link" accessibilityLabel="Termos de uso">
          <Text style={[styles.linkText, { color: colors.textSecondary, ...typography.font.medium }]}>Termos</Text>
        </PressableScale>
        <PressableScale onPress={() => router.push('/privacy')} style={styles.link} accessibilityRole="link" accessibilityLabel="Política de privacidade">
          <Text style={[styles.linkText, { color: colors.textSecondary, ...typography.font.medium }]}>Privacidade</Text>
        </PressableScale>
      </View>

      <Text style={[styles.footerNote, { color: colors.textSecondary, ...typography.font.regular }]}>
        nós. • Um espaço só nosso
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  signOut: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  signOutText: {
    fontSize: 15,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  link: {
    minHeight: 44,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
  },
});
