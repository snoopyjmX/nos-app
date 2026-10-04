import React, { useRef, useState } from 'react';
import { Text, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

import { supabase } from '@/lib/core/supabase';
import { useTheme } from '@/theme';
import { AuthScreen, Button, GlassField } from '@/components/ui';
import { useToast } from '@/lib/context/ToastContext';

const MIN_PASSWORD = 8;

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleTerms = () => router.push('/terms');
  const handlePrivacy = () => router.push('/privacy');

  const handleRegister = async () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Diga como podemos te chamar.';
    if (!email.trim()) next.email = 'Informe seu e-mail.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Digite um e-mail válido.';
    if (password.length < MIN_PASSWORD) next.password = `A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: name.trim(),
        },
      },
    });
    setLoading(false);

    if (error) {
      showToast({ message: 'Não foi possível criar a conta. Verifique os dados e tente novamente.', type: 'error' });
    } else {
      showToast({ message: 'Conta criada com sucesso!', type: 'success' });
      router.replace('/');
    }
  };

  

  

  return (
    <AuthScreen title="Criar espaço" onBack={() => router.back()}>
      <GlassField
        label="Como seu parceiro(a) te chama?"
        icon="user"
        placeholder="Seu nome ou apelido"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        value={name}
        onChangeText={(v) => { setName(v); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }}
        error={errors.name}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        blurOnSubmit={false}
      />

      <GlassField
        label="E-mail"
        icon="mail"
        placeholder="Seu e-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        ref={emailRef}
        value={email}
        onChangeText={(v) => { setEmail(v); if (errors.email) setErrors((e) => ({ ...e, email: undefined })); }}
        error={errors.email}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        blurOnSubmit={false}
      />

      <GlassField
        label="Senha"
        icon="lock"
        placeholder={`Mínimo de ${MIN_PASSWORD} caracteres`}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        ref={passwordRef}
        value={password}
        onChangeText={(v) => { setPassword(v); if (errors.password) setErrors((e) => ({ ...e, password: undefined })); }}
        error={errors.password}
        returnKeyType="go"
        onSubmitEditing={handleRegister}
      />

      <Text style={[styles.terms, { color: colors.textSecondary, ...typography.font.regular }]}>
        Ao criar sua conta, você concorda com nossos{' '}
        <Text onPress={handleTerms} accessibilityRole="link" style={[styles.link, { color: colors.primaryText, ...typography.font.bold }]}>
          Termos
        </Text>{' '}
        e{' '}
        <Text onPress={handlePrivacy} accessibilityRole="link" style={[styles.link, { color: colors.primaryText, ...typography.font.bold }]}>
          Política de Privacidade
        </Text>
        .
      </Text>

      <Button onPress={handleRegister} loading={loading} variant="primary">
        Cadastrar
      </Button>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  terms: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  link: {
    textDecorationLine: 'underline',
  },
});
