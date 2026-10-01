import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { supabase } from '../../lib/supabase';
import { useAppTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../constants/theme';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';
import { LiquidGlassView } from '../../components/ui/LiquidGlassView';
import { PressableScale } from '../../components/ui/PressableScale';

import { useToast } from '../../context/ToastContext';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const theme = getThemeTokens(isDark);
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      showToast({ message: 'Por favor, preencha todos os campos.', type: 'error' });
      return;
    }

    if (password.length < 6) {
      showToast({ message: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' });
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
      showToast({ message: error.message, type: 'error' });
    } else {
      showToast({ message: 'Conta criada com sucesso!', type: 'success' });
      router.replace('/');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AtmosphereBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 24) + 16,
              paddingBottom: Math.max(insets.bottom, 24) + 16,
            },
          ]}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
            <Text style={[styles.brandTitle, { color: isDark ? '#A797FF' : theme.primary }]}>nós.</Text>
            <Text style={[styles.brandSubtitle, { color: isDark ? '#AAA5B8' : theme.textSecondary }]}>
              Crie seu perfil
            </Text>
          </View>

          {/* Form Card */}
          <LiquidGlassView variant="hero" style={styles.formCard} borderRadius={28}>
            <Text style={[styles.formTitle, { color: isDark ? '#F7F5FF' : theme.textPrimary }]}>
              Criar Conta
            </Text>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: isDark ? '#AAA5B8' : theme.textSecondary }]}>Nome</Text>
              <LiquidGlassView 
                variant="control" 
                style={[styles.inputGlass, isNameFocused && { borderColor: theme.primary }]} 
                borderRadius={16}
              >
                <Ionicons name="person-outline" size={20} color={isNameFocused ? theme.primary : (isDark ? '#AAA5B8' : theme.textSecondary)} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    { color: isDark ? '#F7F5FF' : '#16151E' },
                    Platform.OS === 'web' && ({ outlineStyle: 'none', WebkitTextFillColor: isDark ? '#F7F5FF' : '#16151E' } as any),
                  ]}
                  placeholderTextColor={isDark ? 'rgba(247, 245, 255, 0.45)' : 'rgba(22, 21, 30, 0.45)'}
                  selectionColor={isDark ? '#A797FF' : '#7C6FE0'}
                  cursorColor={isDark ? '#A797FF' : '#7C6FE0'}
                  placeholder="Como seu amor te chama?"
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                />
              </LiquidGlassView>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: isDark ? '#AAA5B8' : theme.textSecondary }]}>E-mail</Text>
              <LiquidGlassView 
                variant="control" 
                style={[styles.inputGlass, isEmailFocused && { borderColor: theme.primary }]} 
                borderRadius={16}
              >
                <Ionicons name="mail-outline" size={20} color={isEmailFocused ? theme.primary : (isDark ? '#AAA5B8' : theme.textSecondary)} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    { color: isDark ? '#F7F5FF' : '#16151E' },
                    Platform.OS === 'web' && ({ outlineStyle: 'none', WebkitTextFillColor: isDark ? '#F7F5FF' : '#16151E' } as any),
                  ]}
                  placeholderTextColor={isDark ? 'rgba(247, 245, 255, 0.45)' : 'rgba(22, 21, 30, 0.45)'}
                  selectionColor={isDark ? '#A797FF' : '#7C6FE0'}
                  cursorColor={isDark ? '#A797FF' : '#7C6FE0'}
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                />
              </LiquidGlassView>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: isDark ? '#AAA5B8' : theme.textSecondary }]}>Senha</Text>
              <LiquidGlassView 
                variant="control" 
                style={[styles.inputGlass, isPasswordFocused && { borderColor: theme.primary }]} 
                borderRadius={16}
              >
                <Ionicons name="lock-closed-outline" size={20} color={isPasswordFocused ? theme.primary : (isDark ? '#AAA5B8' : theme.textSecondary)} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    { color: isDark ? '#F7F5FF' : '#16151E' },
                    Platform.OS === 'web' && ({ outlineStyle: 'none', WebkitTextFillColor: isDark ? '#F7F5FF' : '#16151E' } as any),
                  ]}
                  placeholderTextColor={isDark ? 'rgba(247, 245, 255, 0.45)' : 'rgba(22, 21, 30, 0.45)'}
                  selectionColor={isDark ? '#A797FF' : '#7C6FE0'}
                  cursorColor={isDark ? '#A797FF' : '#7C6FE0'}
                  placeholder="Mínimo de 6 caracteres"
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                />
                <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeButton}>
                  <Ionicons name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={isDark ? '#AAA5B8' : theme.textSecondary} />
                </Pressable>
              </LiquidGlassView>
            </View>

            <PressableScale
              style={[styles.buttonContainer, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              scaleTo={0.97}
            >
              <LiquidGlassView variant="control" style={styles.button} borderRadius={16}>
                <LinearGradient
                  colors={isDark ? ['rgba(142, 124, 232, 0.8)', 'rgba(124, 58, 237, 0.8)'] : ['rgba(142, 124, 232, 0.9)', 'rgba(109, 40, 217, 0.9)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Cadastrar</Text>
                )}
              </LiquidGlassView>
            </PressableScale>

            <PressableScale
              style={styles.switchButton}
              onPress={() => router.back()}
              scaleTo={0.98}
            >
              <Text style={[styles.switchText, { color: isDark ? '#AAA5B8' : theme.textSecondary }]}>
                Já tem uma conta?{' '}
                <Text style={[styles.switchHighlight, { color: isDark ? '#A797FF' : theme.primary }]}>
                  Entrar
                </Text>
              </Text>
            </PressableScale>
          </LiquidGlassView>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 12,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  brandSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: -0.2,
  },
  formCard: {
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 16,
    width: '100%',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
    letterSpacing: -0.1,
  },
  inputGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchHighlight: {
    fontWeight: '700',
  },
});