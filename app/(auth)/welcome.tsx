import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';
import { LiquidGlassView } from '../../components/ui/LiquidGlassView';
import { AnimatedTouchable } from '../../components/AnimatedTouchable';
import { useAppTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);

  const handleLoginPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/login');
  };

  const handleRegisterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/register');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeTokens.background }]}>
      <AtmosphereBackground />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 32,
            paddingBottom: Platform.OS === 'ios' ? insets.bottom + 20 : 36,
          },
        ]}
      >
        <Animated.View 
          entering={FadeInDown.duration(800).springify().damping(20)}
          style={styles.heroContainer}
        >
          <LiquidGlassView variant="hero" style={styles.heroGlass} borderRadius={44}>
            <View style={styles.heroContent}>
              <View style={[styles.pillBadge, { backgroundColor: isDark ? 'rgba(167, 151, 255, 0.12)' : 'rgba(142, 124, 232, 0.12)', borderColor: isDark ? 'rgba(167, 151, 255, 0.25)' : 'rgba(142, 124, 232, 0.22)' }]}>
                <Ionicons name="sparkles" size={13} color={themeTokens.primary} />
                <Text style={[styles.pillBadgeText, { color: themeTokens.primary }]}>
                  UM ESPAÇO SÓ NOSSO
                </Text>
              </View>

              <Image
                source={require('../../assets/favicon.png')}
                style={styles.heroImage}
                resizeMode="contain"
              />

              <View style={styles.heroTypography}>
                <Text style={[styles.brandTitle, { color: themeTokens.textPrimary }]}>nós.</Text>
                <Text style={[styles.brandTagline, { color: themeTokens.primary }]}>
                  O nosso refúgio digital a dois.
                </Text>
              </View>
            </View>
          </LiquidGlassView>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(800).springify().damping(20)}
          style={styles.bottomSection}
        >
          <Text style={[styles.brandDescription, { color: themeTokens.textSecondary }]}>
            Um lugar privado e silencioso para registrar memórias, trocar bilhetes e celebrar a nossa história juntos.
          </Text>

          <View style={styles.featuresRow}>
            <View style={[styles.featurePill, { backgroundColor: themeTokens.glassSurface, borderColor: themeTokens.glassBorder }]}>
              <Ionicons name="lock-closed" size={13} color={themeTokens.primary} />
              <Text style={[styles.featurePillText, { color: themeTokens.textPrimary }]}>100% Privado</Text>
            </View>
            <View style={[styles.featurePill, { backgroundColor: themeTokens.glassSurface, borderColor: themeTokens.glassBorder }]}>
              <Ionicons name="heart" size={13} color={themeTokens.primary} />
              <Text style={[styles.featurePillText, { color: themeTokens.textPrimary }]}>Exclusivo</Text>
            </View>
          </View>

          <View style={styles.actionContainer}>
            <AnimatedTouchable activeOpacity={0.88} onPress={handleLoginPress}>
              <LinearGradient
                colors={[themeTokens.primary, themeTokens.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.35)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 0.8 }}
                  style={styles.buttonGlint}
                  pointerEvents="none"
                />
                <Text style={styles.primaryButtonText}>Entrar na Minha Conta</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </AnimatedTouchable>

            <AnimatedTouchable activeOpacity={0.85} onPress={handleRegisterPress}>
              <LiquidGlassView variant="pill" style={styles.secondaryGlassButton} borderRadius={26}>
                <Text style={[styles.secondaryButtonText, { color: themeTokens.textPrimary }]}>
                  Criar Nosso Espaço
                </Text>
              </LiquidGlassView>
            </AnimatedTouchable>
          </View>
        </Animated.View>
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
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  heroContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  heroGlass: {
    width: '100%',
    aspectRatio: 0.85,
    maxHeight: 460,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    width: '100%',
    paddingVertical: 16,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroImage: {
    width: 130,
    height: 130,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  heroTypography: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 60,
    marginBottom: 8,
  },
  brandTagline: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  brandDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '90%',
    fontWeight: '400',
    marginBottom: 20,
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  featurePillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionContainer: {
    gap: 14,
    width: '100%',
  },
  primaryButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    overflow: 'hidden',
  },
  buttonGlint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  secondaryGlassButton: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 28,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
