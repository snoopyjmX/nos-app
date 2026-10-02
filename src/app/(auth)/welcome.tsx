import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AtmosphereBackground } from '@/design/ui/AtmosphereBackground';
import { LiquidGlassView } from '@/design/ui/LiquidGlassView';
import { PressableScale } from '@/design/ui/PressableScale';
import { useAppTheme } from '@/lib/context/ThemeContext';
import { getThemeTokens } from '@/design/tokens/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);

  const handleLoginPress = () => {
    router.push('/(auth)/login');
  };

  const handleRegisterPress = () => {
    router.push('/(auth)/register');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeTokens.background }]}>
      <AtmosphereBackground />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 24 : 16),
            paddingBottom: Platform.OS === 'ios' ? insets.bottom + 16 : 28,
          },
        ]}
      >
        {/* Card Hero de Vidro Jateado (Apple Liquid Glass) */}
        <View style={styles.heroContainer}>
          <LiquidGlassView variant="hero" style={styles.heroGlass} borderRadius={40}>
            {/* Especular superior translúcido */}
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(255, 255, 255, 0.18)', 'rgba(255, 255, 255, 0.02)', 'transparent']
                  : ['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.15)', 'transparent']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.6 }}
              style={styles.cardSpecularTop}
              pointerEvents="none"
            />

            <View style={styles.heroContent}>
              {/* Badge Topo: UM ESPAÇO SÓ NOSSO */}
              <LiquidGlassView
                variant="pill"
                borderRadius={999}
                style={styles.pillBadge}
              >
                <Ionicons name="sparkles" size={12} color={themeTokens.primary} />
                <Text style={[styles.pillBadgeText, { color: themeTokens.primary }]}>
                  UM ESPAÇO SÓ NOSSO
                </Text>
                <Ionicons name="sparkles" size={12} color={themeTokens.primary} />
              </LiquidGlassView>

              {/* Logo Oficial do Usuário */}
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../../../assets/favicon.png')}
                  style={styles.heroLogo}
                  resizeMode="contain"
                />
              </View>

              {/* Tipografia da Marca */}
              <View style={styles.heroTypography}>
                <Text
                  style={[
                    styles.brandTitle,
                    {
                      color: isDark ? '#FFFFFF' : '#16151E',
                    },
                  ]}
                >
                  nós.
                </Text>
                <Text style={[styles.brandTagline, { color: themeTokens.primary }]}>
                  O nosso refúgio digital a dois.
                </Text>
              </View>
            </View>
          </LiquidGlassView>
        </View>

        {/* Seção Inferior com Descrição, Badges e Botões de Ação */}
        <View style={styles.bottomSection}>
          <Text style={[styles.brandDescription, { color: themeTokens.textSecondary }]}>
            Um lugar privado e silencioso para registrar memórias, trocar bilhetes e celebrar a nossa história juntos.
          </Text>

          {/* Badges Fusionados com Vidro Líquido */}
          <View style={styles.fusedBadgesRow}>
            <LiquidGlassView
              variant="pill"
              borderRadius={999}
              style={styles.fusedPillGroup}
            >
              <View style={styles.fusedPillHalf}>
                <Ionicons name="key" size={13} color={themeTokens.primary} />
                <Text style={[styles.fusedPillText, { color: themeTokens.textPrimary }]}>
                  100% Privado
                </Text>
              </View>

              <View
                style={[
                  styles.fusedPillDivider,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.15)'
                      : 'rgba(142, 124, 232, 0.20)',
                  },
                ]}
              />

              <View style={styles.fusedPillHalf}>
                <Ionicons name="infinite" size={15} color={themeTokens.primary} />
                <Text style={[styles.fusedPillText, { color: themeTokens.textPrimary }]}>
                  Exclusivo
                </Text>
              </View>
            </LiquidGlassView>
          </View>

          {/* Botões de Ação */}
          <View style={styles.actionContainer}>
            <PressableScale activeOpacity={0.88} onPress={handleLoginPress} scaleTo={0.97}>
              <LiquidGlassView variant="control" borderRadius={29} style={styles.primaryButtonGlass}>
                <LinearGradient
                  colors={isDark ? ['rgba(142, 124, 232, 0.8)', 'rgba(124, 58, 237, 0.8)'] : ['rgba(142, 124, 232, 0.9)', 'rgba(109, 40, 217, 0.9)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.38)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 0.8 }}
                  style={styles.buttonGlint}
                  pointerEvents="none"
                />

                <Text style={styles.primaryButtonText}>Entrar na Minha Conta</Text>
                <View style={styles.arrowCircle}>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </View>
              </LiquidGlassView>
            </PressableScale>

            <PressableScale activeOpacity={0.85} onPress={handleRegisterPress} scaleTo={0.97}>
              <LiquidGlassView variant="control" borderRadius={27} style={styles.secondaryButtonGlass}>
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: isDark ? '#F7F5FF' : '#16151E' },
                  ]}
                >
                  Criar Nosso Espaço
                </Text>
              </LiquidGlassView>
            </PressableScale>
          </View>
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
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  heroContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: 480,
  },
  heroGlass: {
    width: '100%',
    aspectRatio: 0.86,
    maxHeight: 450,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderWidth: 1.5,
  },
  cardSpecularTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    width: '100%',
    paddingVertical: 10,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  logoWrapper: {
    width: 145,
    height: 145,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  heroLogo: {
    width: '100%',
    height: '100%',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  heroTypography: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -1.8,
    lineHeight: 58,
  },
  brandTagline: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  brandDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '92%',
    fontWeight: '400',
    marginBottom: 18,
  },
  fusedBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  fusedPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fusedPillHalf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fusedPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fusedPillDivider: {
    width: 1,
    height: 14,
    marginHorizontal: 12,
  },
  actionContainer: {
    gap: 12,
    width: '100%',
  },
  primaryButtonGlass: {
    width: '100%',
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  buttonGlint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonGlass: {
    width: '100%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
