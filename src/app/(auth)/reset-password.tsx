import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

import { supabase } from '@/lib/core/supabase';
import { useTheme } from '@/theme';
import { Button, IconButton } from '@/components/ui';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography } = useTheme();
  const params = useLocalSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isError, setIsError] = useState(false);
  
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
      } catch (err) {
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorCenter}>
          <Feather name="x-circle" size={48} color={colors.danger} style={{ marginBottom: 16 }} />
          <Text style={[styles.errorTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
            Link inválido
          </Text>
          <Text style={[styles.errorMsg, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
            Esse link expirou. Peça um novo.
          </Text>
          <View style={{ marginTop: 24, width: '100%', maxWidth: 300 }}>
            <Button variant="primary" onPress={() => router.replace('/(auth)/login')}>
              Voltar ao Login
            </Button>
          </View>
        </View>
      </View>
    );
  }

  const handleSave = async () => {
    if (password.length < 8) {
      Alert.alert('Atenção', 'A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      setLoading(false);
      Alert.alert('Atenção', 'Não foi possível alterar a senha. Tente novamente.');
      return;
    }

    // Sucesso
    await supabase.auth.signOut({ scope: 'others' });
    setLoading(false);
    
    Alert.alert('Sucesso', 'Senha alterada com sucesso.', [
      { text: 'Entrar no app', onPress: () => router.replace('/') }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <IconButton 
          icon="arrow-left" 
          variant="ghost" 
          onPress={() => router.replace('/(auth)/login')} 
          accessibilityLabel="Voltar"
        />
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>Nova Senha</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 16 },
          ]}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={[styles.instructionText, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
              Crie uma nova senha segura com no mínimo 8 caracteres.
            </Text>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily.bold }]}>Nova Senha</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Feather name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fontFamily.medium }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                  placeholderTextColor={colors.textSecondary}
                  selectionColor={colors.primary}
                  cursorColor={colors.primary}
                  placeholder="Nova senha"
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable 
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)} 
                  style={styles.eyeButton}
                  accessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <Feather name={isPasswordVisible ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily.bold }]}>Confirmar Senha</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Feather name="check-circle" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, fontFamily: typography.fontFamily.medium }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                  placeholderTextColor={colors.textSecondary}
                  selectionColor={colors.primary}
                  cursorColor={colors.primary}
                  placeholder="Confirme a nova senha"
                  secureTextEntry={!isConfirmVisible}
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Pressable 
                  onPress={() => setIsConfirmVisible(!isConfirmVisible)} 
                  style={styles.eyeButton}
                  accessibilityLabel={isConfirmVisible ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <Feather name={isConfirmVisible ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                onPress={handleSave}
                loading={loading}
                variant="primary"
              >
                Salvar Senha
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 18 },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  formCard: { width: '100%', maxWidth: 420, alignSelf: 'center', gap: 20 },
  instructionText: { fontSize: 15, marginBottom: 10, textAlign: 'center' },
  inputWrapper: { width: '100%' },
  inputLabel: { fontSize: 14, marginBottom: 8, marginLeft: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1.5 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: '100%', fontSize: 16 },
  eyeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  buttonContainer: { marginTop: 16 },
  errorCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorTitle: { fontSize: 22, marginBottom: 8 },
  errorMsg: { fontSize: 16, textAlign: 'center' }
});
