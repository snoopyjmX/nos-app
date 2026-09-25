import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useCouple } from '../context/CoupleContext';

export default function IndexScreen() {
  const { session, isLoading: isLoadingAuth } = useAuth();
  const { hasCouple, isLoadingCouple } = useCouple();

  // Enquanto valida a sessão ou o vínculo do casal, exibe splash com visual Liquid Glass
  if (isLoadingAuth || (session && isLoadingCouple)) {
    return (
      <View style={styles.container}>
        <View style={styles.glassCard}>
          <Text style={styles.brandTitle}>nós</Text>
          <Text style={styles.brandSubtitle}>Um espaço só nosso.</Text>
          <ActivityIndicator color="#8E7CE8" size="small" style={styles.spinner} />
        </View>
      </View>
    );
  }

  // 1. Se não houver sessão ativa -> tela de login
  if (!session) {
    return <Redirect href="/(auth)/login" />;
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
    backgroundColor: '#F8F9FC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glassCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: '#8E7CE8',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 15,
    color: '#686578',
    marginTop: 8,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 24,
  },
});