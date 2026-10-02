import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { supabase } from '@/lib/core/supabase';
import { useTheme } from '@/theme';
import { Button, IconButton } from '@/components/ui';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);


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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <IconButton 
          icon="arrow-left" 
          variant="ghost" 
          onPress={() => router.back()} 
          accessibilityLabel="Voltar"
        />
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>Criar espaço</Text>
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
              <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily.bold }]}>Como seu parceiro(a) te chama?</Text>
              <View 
                style={[
                  styles.inputBox, 
                  { 
                    backgroundColor: colors.surface, 
                    borderColor: isNameFocused ? colors.primary : colors.border 
                  }
                ]} 
              >
                <Feather name="user" size={20} color={isNameFocused ? colors.primary : colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.textPrimary, fontFamily: typography.fontFamily.medium },
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                  ]}
                  placeholderTextColor={colors.textSecondary}
                  selectionColor={colors.primary}
                  cursorColor={colors.primary}
                  placeholder="Seu nome ou apelido"
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                />
              </View>
            </View>

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
                  placeholder="Mínimo de 6 caracteres"
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
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

            <View style={styles.termsContainer}>
              <Text style={[styles.termsText, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
                Ao criar sua conta, você concorda com nossos{' '}
                <Text onPress={handleTerms} style={{ color: colors.primary, fontFamily: typography.fontFamily.bold }}>
                  Termos
                </Text>{' '}
                e{' '}
                <Text onPress={handlePrivacy} style={{ color: colors.primary, fontFamily: typography.fontFamily.bold }}>
                  Política de Privacidade
                </Text>
                .
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                onPress={handleRegister}
                loading={loading}
                variant="primary"
              >
                Cadastrar
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
  termsContainer: {
    marginTop: -4,
    paddingHorizontal: 4,
  },
  termsText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 8,
  },
});