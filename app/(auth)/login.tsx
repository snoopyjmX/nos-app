import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../../lib/supabase';
import { useAppTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../constants/theme';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';
import { LiquidGlassView } from '../../components/ui/LiquidGlassView';
import { AnimatedTouchable } from '../../components/AnimatedTouchable';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o e-mail e a senha.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Erro ao entrar', error.message);
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeTokens.background }]}>
      <AtmosphereBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View 
          style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}
        >
                    {/* Header Brand */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/favicon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.brandTitle, { color: themeTokens.primary }]}>nós.</Text>
            <Text style={[styles.brandSubtitle, { color: themeTokens.textSecondary }]}>Um espaço só nosso</Text>
          </View>

          {/* Form Card */}
          <LiquidGlassView variant="hero" style={styles.formCard} borderRadius={32}>
            <Text style={[styles.formTitle, { color: themeTokens.textPrimary }]}>Bem-vindo de volta</Text>

            <LiquidGlassView variant="control" style={styles.inputWrapper} borderRadius={16}>
              <TextInput
                style={[styles.input, { color: themeTokens.textPrimary }]}
                placeholder="E-mail"
                placeholderTextColor={themeTokens.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </LiquidGlassView>

            <LiquidGlassView variant="control" style={styles.inputWrapper} borderRadius={16}>
              <TextInput
                style={[styles.input, { color: themeTokens.textPrimary }]}
                placeholder="Senha"
                placeholderTextColor={themeTokens.textMuted}
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
            </LiquidGlassView>

            <AnimatedTouchable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              scaleTo={0.96}
            >
              <LinearGradient
                colors={isDark ? ['#A797FF', '#8B5CF6'] : ['#8E7CE8', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </AnimatedTouchable>

            <AnimatedTouchable
              style={styles.switchButton}
              onPress={() => router.push('/(auth)/register')}
              scaleTo={0.98}
            >
              <Text style={[styles.switchText, { color: themeTokens.textSecondary }]}>
                Ainda não tem conta? <Text style={[styles.switchHighlight, { color: themeTokens.primary }]}>Criar conta</Text>
              </Text>
            </AnimatedTouchable>
          </LiquidGlassView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  brandSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  formCard: {
    padding: 24,
    width: '100%',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 16,
    borderWidth: 1,
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    overflow: 'hidden',
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchHighlight: {
    fontWeight: '700',
  },
});