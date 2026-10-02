import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { PressableScale } from '@/components/ui/PressableScale';
import { useTheme } from '@/theme';

interface AccountActionsProps {
  onSignOut: () => void;
}

export function AccountActions({ onSignOut }: AccountActionsProps) {
  const { colors, typography, radii, spacing, isDark } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.accountActionBlock}>
      <PressableScale
        onPress={onSignOut}
        style={[
          styles.signOutButton,
          {
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
            borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.20)',
            borderRadius: radii.pill,
            paddingVertical: spacing[12],
          },
        ]}
        accessibilityLabel="Encerrar Sessão"
      >
        <Feather name="log-out" size={18} color={isDark ? '#F87171' : '#DC2626'} />
        <Text style={[styles.signOutText, { color: isDark ? '#F87171' : '#DC2626', fontFamily: typography.fontFamily.bold }]}>
          Encerrar Sessão
        </Text>
      </PressableScale>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
        <PressableScale onPress={() => router.push('/terms')}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: typography.fontFamily.medium, textDecorationLine: 'underline' }}>Termos</Text>
        </PressableScale>
        <PressableScale onPress={() => router.push('/privacy')}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: typography.fontFamily.medium, textDecorationLine: 'underline' }}>Privacidade</Text>
        </PressableScale>
      </View>

      <Text style={[styles.footerNote, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
        nós. • Um espaço só nosso
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  accountActionBlock: {
    marginTop: 8,
    marginBottom: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 14,
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
  },
});
