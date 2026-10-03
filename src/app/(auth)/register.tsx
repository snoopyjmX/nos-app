import React, { useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { supabase } from '@/lib/core/supabase';
import { useTheme } from '@/theme';
import { AuthScreen, Button, GlassField } from '@/components/ui';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, typography } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);



  const handleTerms = () => router.push('/terms');
  const handlePrivacy = () => router.push('/privacy');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

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
      Alert.alert('Atenção', 'Não foi possível criar a conta. Verifique os dados e tente novamente.');
    } else {
      Alert.alert('Sucesso', 'Conta criada com sucesso!', [
        { text: 'Continuar', onPress: () => router.replace('/') },
      ]);
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
        onChangeText={setName}
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
        value={email}
        onChangeText={setEmail}
      />

      <GlassField
        label="Senha"
        icon="lock"
        placeholder="Mínimo de 6 caracteres"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        value={password}
        onChangeText={setPassword}
      />

      <Text style={[styles.terms, { color: colors.textSecondary, ...typography.font.regular }]}>
        Ao criar sua conta, você concorda com nossos{' '}
        <Text onPress={handleTerms} accessibilityRole="link" style={{ color: colors.primaryText, ...typography.font.bold }}>
          Termos
        </Text>{' '}
        e{' '}
        <Text onPress={handlePrivacy} accessibilityRole="link" style={{ color: colors.primaryText, ...typography.font.bold }}>
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
});
