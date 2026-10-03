import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

import { supabase } from '@/lib/core/supabase';
import { useTheme } from '@/theme';
import { AuthScreen, Button, GlassField } from '@/components/ui';
import { showAlert } from '@/lib/core/dialog';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  const params = useLocalSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const confirmRef = useRef<TextInput>(null);

  // Trata os deep links / query params no mount
  useEffect(() => {
    const handleUrl = async (urlStr: string | null) => {
      if (!urlStr) return;
      try {
        const url = new URL(urlStr.replace('#', '?'));
        
        // Padrão PKCE (traz code=...)
        const code = url.searchParams.get('code') || params.code;
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(String(code));
          if (error) setIsError(true);
        } else {
          // Padrão Implicit (traz access_token e refresh_token)
          const access_token = url.searchParams.get('access_token') || params.access_token;
          const refresh_token = url.searchParams.get('refresh_token') || params.refresh_token;
          
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token: String(access_token),
              refresh_token: String(refresh_token),
            });
            if (error) setIsError(true);
          }
        }
      } catch {
        // Ignora erros de parsing
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', (e) => handleUrl(e.url));
    return () => sub.remove();
  }, [params]);

  // Se erro no token (link expirado/inválido)
  if (isError) {
    return (
      <AuthScreen title="Link inválido" onBack={() => router.replace('/(auth)/login')}>
        <Feather name="x-circle" size={40} color={colors.dangerText} style={styles.errorIcon} />
        <Text style={[styles.errorMsg, { color: colors.textSecondary, ...typography.font.regular }]}>
          Esse link expirou. Peça um novo.
        </Text>
        <Button variant="primary" onPress={() => router.replace('/(auth)/login')}>
          Voltar ao login
        </Button>
      </AuthScreen>
    );
  }

  const handleSave = async () => {
    const next: typeof errors = {};
    if (password.length < 8) next.password = 'A senha deve ter no mínimo 8 caracteres.';
    if (password !== confirmPassword) next.confirm = 'As senhas não coincidem.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      setLoading(false);
      showAlert('Atenção', 'Não foi possível alterar a senha. Tente novamente.');
      return;
    }

    // Sucesso
    await supabase.auth.signOut({ scope: 'others' });
    setLoading(false);
    
    showAlert('Sucesso', 'Senha alterada com sucesso.', [
      { text: 'Entrar no app', onPress: () => router.replace('/') }
    ]);
  };

  return (
    <AuthScreen title="Nova senha" onBack={() => router.replace('/(auth)/login')}>
      <Text style={[styles.instruction, { color: colors.textSecondary, ...typography.font.regular }]}>
        Crie uma nova senha segura com no mínimo 8 caracteres.
      </Text>

      <GlassField
        label="Nova senha"
        icon="lock"
        placeholder="Nova senha"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        value={password}
        onChangeText={(v) => { setPassword(v); if (errors.password) setErrors((e) => ({ ...e, password: undefined })); }}
        error={errors.password}
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        blurOnSubmit={false}
      />

      <GlassField
        label="Confirmar senha"
        icon="check-circle"
        placeholder="Confirme a nova senha"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        ref={confirmRef}
        value={confirmPassword}
        onChangeText={(v) => { setConfirmPassword(v); if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined })); }}
        error={errors.confirm}
        returnKeyType="go"
        onSubmitEditing={handleSave}
      />

      <Button onPress={handleSave} loading={loading} variant="primary">
        Salvar nova senha
      </Button>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  instruction: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorIcon: {
    alignSelf: 'center',
  },
  errorMsg: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
