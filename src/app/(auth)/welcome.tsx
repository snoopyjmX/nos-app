import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { Button, Chip } from '@/components/ui';
import { useTheme } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 24 : 16),
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
        ]}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <View style={styles.heroContent}>
            {/* Badge Topo: UM ESPAÇO SÓ NOSSO */}
            <Chip 
              label="UM ESPAÇO SÓ NOSSO" 
              icon="heart"
            />

            {/* Logo Oficial Transparente */}
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../../assets/icone-anel-transparente.png')}
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
                    color: colors.textPrimary,
                    fontFamily: typography.fontFamily.black,
                  },
                ]}
              >
                nós.
              </Text>
              <Text 
                style={[
                  styles.brandTagline, 
                  { 
                    color: colors.primary,
                    fontFamily: typography.fontFamily.bold 
                  }
                ]}
              >
                O nosso refúgio digital a dois.
              </Text>
            </View>
          </View>
        </View>

        {/* Seção Inferior com Descrição, Badges e Botões de Ação */}
        <View style={styles.bottomSection}>
          <Text 
            style={[
              styles.brandDescription, 
              { 
                color: colors.textSecondary,
                fontFamily: typography.fontFamily.regular
              }
            ]}
          >
            Um lugar privado e seguro para registrar memórias, trocar bilhetes e celebrar a nossa história juntos.
          </Text>

          {/* Badges Simples */}
          <View style={styles.fusedBadgesRow}>
            <View style={[styles.fusedPillGroup, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <View style={styles.fusedPillHalf}>
                <Feather name="lock" size={13} color={colors.primary} />
                <Text style={[styles.fusedPillText, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
                  Privado e protegido
                </Text>
              </View>

              <View
                style={[
                  styles.fusedPillDivider,
                  { backgroundColor: colors.border },
                ]}
              />

              <View style={styles.fusedPillHalf}>
                <Feather name="star" size={14} color={colors.primary} />
                <Text style={[styles.fusedPillText, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
                  Exclusivo
                </Text>
              </View>
            </View>
          </View>

          
          {/* Botões de Ação */}
          <View style={styles.actionContainer}>
            <Button
              onPress={() => router.push('/(auth)/login')}
              variant="primary"
            >
              Entrar na Minha Conta
            </Button>

            <Button
              onPress={() => router.push('/(auth)/register')}
              variant="ghost"
            >
              Criar Nosso Espaço
            </Button>
          </View>
          
          <View style={{ marginTop: 24, paddingHorizontal: 12 }}>
            <Text style={{ textAlign: 'center', fontSize: 13, color: colors.textSecondary, fontFamily: typography.fontFamily.regular }}>
              Ao continuar, você concorda com nossos{' '}
              <Text onPress={() => router.push('/terms')} style={{ color: colors.primary, fontFamily: typography.fontFamily.bold }}>Termos</Text> e{' '}
              <Text onPress={() => router.push('/privacy')} style={{ color: colors.primary, fontFamily: typography.fontFamily.bold }}>Política de Privacidade</Text>.
            </Text>
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
  },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 24,
  },
  logoWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogo: {
    width: '100%',
    height: '100%',
  },
  heroTypography: {
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 52,
    letterSpacing: -1.8,
  },
  brandTagline: {
    fontSize: 17,
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
    maxWidth: '92%',
    marginBottom: 20,
  },
  fusedBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  fusedPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  fusedPillHalf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fusedPillText: {
    fontSize: 13,
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
});
