import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Button, GlassButton } from '@/components/ui';
import { AtmosphereBackground } from '@/components/ui/AtmosphereBackground';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useTheme } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, radii, spacing } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AtmosphereBackground />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing[24],
            paddingBottom: Math.max(insets.bottom, spacing[24]) + spacing[16],
            paddingHorizontal: spacing[24],
          },
        ]}
      >
        <View style={[styles.hero, { gap: spacing[24] }]}>
          <LiquidGlassView variant="pill" readable borderRadius={radii.pill} style={[styles.chip, { gap: spacing[8] }]}>
            <Feather name="heart" size={14} color={colors.accentText} />
            <Text style={[styles.chipText, { color: colors.textSecondary, ...typography.font.bold }]}>
              UM ESPAÇO SÓ NOSSO
            </Text>
          </LiquidGlassView>

          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Logotipo do nós., um símbolo de infinito em vidro lilás"
          />

          <View style={styles.brand}>
            <Text
              accessibilityRole="header"
              style={[styles.brandTitle, { color: colors.textPrimary, ...typography.font.black }]}
            >
              nós.
            </Text>
            <Text style={[styles.tagline, { color: colors.primaryText, ...typography.font.bold }]}>
              O nosso refúgio digital a dois.
            </Text>
          </View>
        </View>

        <View style={[styles.bottom, { gap: spacing[16] }]}>
          <Text style={[styles.description, { color: colors.textSecondary, ...typography.font.regular }]}>
            Um lugar privado para registrar memórias, trocar recados e celebrar a nossa história juntos.
          </Text>

          <View style={[styles.actions, { gap: spacing[12] }]}>
            <Button onPress={() => router.push('/(auth)/register')} variant="primary">
              Começar nossa história
            </Button>
            <GlassButton label="Já tenho uma conta" onPress={() => router.push('/(auth)/login')} />
          </View>

          <Text style={[styles.legal, { color: colors.textSecondary, ...typography.font.regular }]}>
            Ao continuar, você concorda com nossos{' '}
            <Text
              onPress={() => router.push('/terms')}
              accessibilityRole="link"
              style={{ color: colors.primaryText, textDecorationLine: 'underline', ...typography.font.bold }}
            >
              Termos
            </Text>{' '}
            e{' '}
            <Text
              onPress={() => router.push('/privacy')}
              accessibilityRole="link"
              style={{ color: colors.primaryText, textDecorationLine: 'underline', ...typography.font.bold }}
            >
              Política de Privacidade
            </Text>
            .
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 12,
    letterSpacing: 1,
  },
  logo: {
    width: 144,
    height: 144,
  },
  brand: {
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 17,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  bottom: {
    width: '100%',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
  },
  legal: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
