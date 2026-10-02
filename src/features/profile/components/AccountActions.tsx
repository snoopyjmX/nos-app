import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from '@/design/ui/PressableScale';

interface AccountActionsProps {
  onSignOut: () => void;
  isDark: boolean;
  themeTokens: any;
}

export function AccountActions({ onSignOut, isDark, themeTokens }: AccountActionsProps) {
  return (
    <View style={styles.accountActionBlock}>
      <PressableScale
        onPress={onSignOut}
        style={[
          styles.signOutButton,
          {
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
            borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.20)',
          },
        ]}
        accessibilityLabel="Encerrar Sessão"
      >
        <Ionicons name="log-out-outline" size={18} color={isDark ? '#F87171' : '#DC2626'} />
        <Text style={[styles.signOutText, { color: isDark ? '#F87171' : '#DC2626' }]}>
          Encerrar Sessão
        </Text>
      </PressableScale>

      <Text style={[styles.footerNote, { color: themeTokens.textSecondary }]}>
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
    borderRadius: 999,
    paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
  },
});
