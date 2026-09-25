import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
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
      Alert.alert('Erro no cadastro', error.message);
    } else {
      Alert.alert('Sucesso', 'Conta criada com sucesso!', [
        { text: 'Continuar', onPress: () => router.replace('/') },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brandTitle}>nós</Text>
          <Text style={styles.brandSubtitle}>Crie seu perfil</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Cadastro</Text>

          <TextInput
            style={styles.input}
            placeholder="Seu nome"
            placeholderTextColor="#686578"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#686578"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha (mínimo 6 caracteres)"
            placeholderTextColor="#686578"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Criar Conta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => router.back()}
          >
            <Text style={styles.switchText}>
              Já tem uma conta? <Text style={styles.switchHighlight}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
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
  brandTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#16151E',
    letterSpacing: 4,
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#686578',
    marginTop: 8,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#16151E',
    marginBottom: 20,
  },
  input: {
    height: 52,
    backgroundColor: '#F8F9FC',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#16151E',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.15)',
  },
  button: {
    height: 52,
    backgroundColor: '#8E7CE8',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#686578',
    fontSize: 14,
  },
  switchHighlight: {
    color: '#8E7CE8',
    fontWeight: '600',
  },
});