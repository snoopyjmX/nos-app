import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

import { supabase } from '@/lib/core/supabase';
import { useTheme } from '@/theme';
import { AuthScreen, Button, GlassField, PressableScale } from '@/components/ui';
import { useToast } from '@/lib/context/ToastContext';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  useEffect(() => {
    if (resetCooldown > 0) {
      const timer = setTimeout(() => setResetCooldown(resetCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resetCooldown]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast({ message: 'Por favor, preencha o e-mail e a senha.', type: 'error' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      showToast({ message: 'E-mail ou senha incorretos. Tente novamente.', type: 'error' });
    } else {
      router.replace('/');
    }
  };

    const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Atenção', 'Digite seu e-mail');
      return;
    }
    if (resetCooldown > 0) return;

    setLoadingReset(true);
    const redirectTo = Platform.OS === 'web' 
      ? `${window.location.origin}/reset-password`
      : Linking.createURL('/reset-password');

    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setLoadingReset(false);
    setResetCooldown(60);
    Alert.alert('Recuperar Senha', 'Se esse e-mail tiver uma conta, enviaremos um link para criar uma nova senha.');
  };

  return (
    <AuthScreen title="Entrar" onBack={() => router.back()}>
      <GlassField
        label="E-mail"
        icon="mail"
        placeholder="Seu e-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />

      <GlassField
        label="Senha"
        icon="lock"
        placeholder="Sua senha"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        value={password}
        onChangeText={setPassword}
      />

      <PressableScale
        onPress={handleForgotPassword}
        style={styles.forgotButton}
        accessibilityRole="button"
        accessibilityLabel="Esqueci a senha"
        disabled={resetCooldown > 0}
      >
        {loadingReset ? (
          <ActivityIndicator size="small" color={colors.primaryText} />
        ) : (
          <Text
            style={[
              styles.forgotText,
              { color: resetCooldown > 0 ? colors.textSecondary : colors.primaryText, ...typography.font.bold },
            ]}
          >
            {resetCooldown > 0 ? `Aguarde ${resetCooldown}s` : 'Esqueci a senha'}
          </Text>
        )}
      </PressableScale>

      <Button onPress={handleLogin} loading={loading} variant="primary">
        Entrar
      </Button>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  forgotButton: {
    alignSelf: 'flex-end',
    minHeight: 44,
    paddingHorizontal: 4,
    justifyContent: 'center',
    marginTop: -8,
  },
  forgotText: {
    fontSize: 14,
  },
});
