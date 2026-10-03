import React from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AtmosphereBackground } from './AtmosphereBackground';
import { IconButton } from './IconButton';
import { LiquidGlassView } from './LiquidGlassView';
import { useTheme } from '@/theme';

interface AuthScreenProps {
  title: string;
  onBack?: () => void;
  /** Ação discreta à direita do topo (ex.: Sair). */
  trailing?: React.ReactNode;
  /** `bare` deixa o conteúdo solto, sem o cartão de vidro (quando os filhos já são cartões). */
  bare?: boolean;
  children: React.ReactNode;
}

const MAX_FORM_WIDTH = 420;

// Estrutura comum de Entrar, Cadastro, Nova senha e Vínculo: fundo estático, voltar e formulário em vidro.
export function AuthScreen({ title, onBack, trailing, bare = false, children }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, typography, radii, spacing } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AtmosphereBackground />

      <View style={[styles.header, { paddingTop: insets.top + spacing[12], paddingHorizontal: spacing[16] }]}>
        <View style={styles.side}>
          {onBack ? (
            <IconButton icon="arrow-left" variant="ghost" onPress={onBack} accessibilityLabel="Voltar" />
          ) : null}
        </View>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.textPrimary, ...typography.font.bold }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={[styles.side, styles.sideEnd]}>{trailing}</View>
      </View>

      {/* No iOS nativo o teclado empurra o formulário; no PWA o visualViewport do Safari já cuida disso */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: spacing[20], paddingBottom: Math.max(insets.bottom, spacing[24]) + spacing[16] },
          ]}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {bare ? (
            <View style={[styles.card, { gap: spacing[16] }]}>{children}</View>
          ) : (
            <LiquidGlassView
              variant="card"
              readable
              borderRadius={radii.lg}
              style={[styles.card, { padding: spacing[20], gap: spacing[16] }]}
            >
              {children}
            </LiquidGlassView>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  side: {
    minWidth: 44,
  },
  sideEnd: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    fontSize: 18,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: MAX_FORM_WIDTH,
    alignSelf: 'center',
  },
});
