import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/context/AuthContext';
import { useCouple } from '@/lib/context/CoupleContext';
import { AtmosphereBackground } from '@/components/ui/AtmosphereBackground';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useTheme } from '@/theme';

export default function IndexScreen() {
  const { session, isLoading: isLoadingAuth } = useAuth();
  const { hasCouple, isLoadingCouple } = useCouple();
  const { colors } = useTheme();

  // Enquanto valida a sessão ou o vínculo do casal, exibe splash com visual Liquid Glass
  if (isLoadingAuth || (session && isLoadingCouple)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AtmosphereBackground />
        <LiquidGlassView variant="hero" style={styles.glassCard} borderRadius={30}>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>nós.</Text>
          <Text style={[styles.brandSubtitle, { color: colors.primaryText }]}>Um espaço só nosso.</Text>
          <ActivityIndicator color={colors.primaryText} size="small" style={styles.spinner} accessibilityLabel="Carregando" />
        </LiquidGlassView>
      </View>
    );
  }

  // 1. Se não houver sessão ativa -> tela de boas-vindas
  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // 2. Se houver sessão mas ainda não possui casal -> onboarding
  if (!hasCouple) {
    return <Redirect href="/onboarding" />;
  }

  // 3. Usuário autenticado e com casal vinculado -> rota principal (tabs)
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glassCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 24,
  },
});