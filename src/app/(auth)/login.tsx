import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { supabase } from '@/lib/core/supabase';
import { useTheme } from '@/theme';
import { Button, IconButton } from '@/components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark } = useTheme();

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
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'E-mail ou senha incorretos.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Atenção', 'E-mail ou senha incorretos.');
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <IconButton 
          icon="arrow-left" 
          variant="ghost" 
          onPress={() => router.back()} 
          accessibilityLabel="Voltar"
        />
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>Entrar</Text>
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
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily.bold }]}>E-mail</Text>
              <View 
                style={[
                  styles.inputBox, 
                  { 
                    backgroundColor: colors.surface, 
                    borderColor: isEmailFocused ? colors.primary : colors.border 
                  }
                ]} 
              >
                <Feather name="mail" size={20} color={isEmailFocused ? colors.primary : colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.textPrimary, fontFamily: typography.fontFamily.medium },
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                  ]}
                  placeholderTextColor={colors.textSecondary}
                  selectionColor={colors.primary}
                  cursorColor={colors.primary}
                  placeholder="Seu e-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily.bold }]}>Senha</Text>
              <View 
                style={[
                  styles.inputBox, 
                  { 
                    backgroundColor: colors.surface, 
                    borderColor: isPasswordFocused ? colors.primary : colors.border 
                  }
                ]} 
              >
                <Feather name="lock" size={20} color={isPasswordFocused ? colors.primary : colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.textPrimary, fontFamily: typography.fontFamily.medium },
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                  ]}
                  placeholderTextColor={colors.textSecondary}
                  selectionColor={colors.primary}
                  cursorColor={colors.primary}
                  placeholder="Sua senha"
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
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

            <View style={styles.forgotPasswordContainer}>
              <Pressable onPress={handleForgotPassword} accessibilityLabel="Esqueci a senha" style={styles.forgotBtn}>
                {loadingReset ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.forgotText, { color: resetCooldown > 0 ? colors.textSecondary : colors.primary, fontFamily: typography.fontFamily.bold }]}>{resetCooldown > 0 ? `Aguarde ${resetCooldown}s` : 'Esqueci a senha'}</Text>}
              </Pressable>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                onPress={handleLogin}
                loading={loading}
                variant="primary"
              >
                Entrar
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: 20,
  },
  inputWrapper: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  eyeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: -8,
  },
  forgotBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  forgotText: {
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 8,
  },
});