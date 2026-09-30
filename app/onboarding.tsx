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
  ScrollView,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCouple } from '../context/CoupleContext';

type OnboardingStep = 'select' | 'create' | 'join';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { refreshCoupleStatus, clearCouple } = useCouple();

  const [step, setStep] = useState<OnboardingStep>('select');
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');

  // 1. Fluxo de Criação de Casal + Geração de Código de Convite
  const handleCreateCouple = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Chama RPC create_couple
      const { data: createData, error: createError } = await supabase.rpc('create_couple');

      if (createError) {
        throw new Error(createError.message);
      }

      // O retorno da RPC pode ser o uuid do couple_id diretamente ou um objeto
      let coupleId = typeof createData === 'string' ? createData : createData?.id ?? createData?.couple_id;

      // Fallback: se não veio na resposta do RPC, busca em couple_members
      if (!coupleId) {
        const { data: memberData } = await supabase
          .from('couple_members')
          .select('couple_id')
          .eq('user_id', user.id)
          .maybeSingle();

        coupleId = memberData?.couple_id;
      }

      if (!coupleId) {
        throw new Error('Não foi possível identificar o casal criado.');
      }

      // Chama RPC create_couple_invite para obter o código único
      const { data: inviteData, error: inviteError } = await supabase.rpc('create_couple_invite', {
        p_couple_id: coupleId,
      });

      if (inviteError) {
        throw new Error(inviteError.message);
      }

      const generatedCode = typeof inviteData === 'string' ? inviteData : (inviteData?.code ?? String(inviteData));
      setInviteCode(generatedCode);
      setStep('create');

      // Atualiza o estado global no CoupleContext
      await refreshCoupleStatus();
    } catch (err: any) {
      Alert.alert('Erro ao criar casal', err.message || 'Ocorreu um erro ao criar o casal.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fluxo de Resgate de Convite com Código
  const handleRedeemInvite = async () => {
    const formattedCode = inputCode.trim().toUpperCase();

    if (!formattedCode) {
      Alert.alert('Atenção', 'Por favor, digite o código de convite.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.rpc('redeem_couple_invite', {
        p_code: formattedCode,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Atualiza o estado global de casal
      await refreshCoupleStatus();

      Alert.alert('Conectados com sucesso!', 'Bem-vindos ao espaço de vocês no NÓS!', [
        {
          text: 'Começar',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        'Código inválido',
        'Não foi possível vincular este código. Verifique se digitou corretamente ou se o convite já foi utilizado.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 3. Compartilhar código de convite via Share nativo
  const handleShareCode = async () => {
    if (!inviteCode) return;

    try {
      await Share.share({
        message: `Amor, criei o nosso espaço no NÓS! Baixe o aplicativo e utilize o nosso código: ${inviteCode}`,
      });
    } catch (err) {
      console.warn('Erro ao compartilhar convite:', err);
    }
  };

  // 4. Concluir após criar o código e navegar para a Home
  const handleFinishCreate = async () => {
    await refreshCoupleStatus();
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Barra superior de ações */}
        <View style={styles.topBar}>
          {step !== 'select' ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setStep('select')}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={22} color="#16151E" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={async () => {
              clearCouple();
              await signOut();
              router.replace('/(auth)/login');
            }}
            disabled={loading}
          >
            <Ionicons name="log-out-outline" size={18} color="#686578" />
            <Text style={styles.signOutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Cabeçalho de Boas-Vindas */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="infinite" size={32} color="#8E7CE8" />
          </View>
          <Text style={styles.brandTitle}>nós</Text>
          <Text style={styles.headerSubtitle}>
            {step === 'select' && 'Vamos conectar você e o seu amor.'}
            {step === 'create' && 'Tudo pronto! Agora chame o seu amor.'}
            {step === 'join' && 'Insira o código do seu casal.'}
          </Text>
        </View>

        {/* ETAPA 1: SELEÇÃO DE OPÇÃO */}
        {step === 'select' && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.glassCardButton}
              onPress={handleCreateCouple}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.cardIconWrapper}>
                <Ionicons name="sparkles-outline" size={28} color="#8E7CE8" />
              </View>
              <View style={styles.cardTextWrapper}>
                <Text style={styles.cardTitle}>Criar nosso espaço</Text>
                <Text style={styles.cardDescription}>
                  Gere um código exclusivo para convidar o seu parceiro(a).
                </Text>
              </View>
              {loading ? (
                <ActivityIndicator color="#8E7CE8" />
              ) : (
                <Ionicons name="chevron-forward" size={22} color="#8E7CE8" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.glassCardButton}
              onPress={() => setStep('join')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.cardIconWrapper}>
                <Ionicons name="key-outline" size={28} color="#8E7CE8" />
              </View>
              <View style={styles.cardTextWrapper}>
                <Text style={styles.cardTitle}>Já tenho um código</Text>
                <Text style={styles.cardDescription}>
                  Recebeu um convite? Conecte-se instantaneamente ao espaço já criado.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#8E7CE8" />
            </TouchableOpacity>
          </View>
        )}

        {/* ETAPA 2: CÓDIGO GERADO */}
        {step === 'create' && inviteCode && (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Código do Casal</Text>
            <Text style={styles.sectionSubtitle}>
              Envie este código para o seu amor entrar no mesmo espaço:
            </Text>

            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{inviteCode}</Text>
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleShareCode}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={20} color="#8E7CE8" />
              <Text style={styles.secondaryButtonText}>Compartilhar convite</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleFinishCreate}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Acessar o NÓS</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* ETAPA 3: INSERIR CÓDIGO */}
        {step === 'join' && (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Conectar ao Espaço</Text>
            <Text style={styles.sectionSubtitle}>
              Digite ou cole o código que você recebeu do seu amor:
            </Text>

            <TextInput
              style={styles.inputCode}
              placeholder="CÓDIGO DE CONVITE"
              placeholderTextColor="#686578"
              autoCapitalize="characters"
              autoCorrect={false}
              value={inputCode}
              onChangeText={setInputCode}
            />

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleRedeemInvite}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Conectar Casal</Text>
                  <Ionicons name="heart" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    gap: 6,
  },
  signOutText: {
    fontSize: 13,
    color: '#686578',
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.25)',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#8E7CE8',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#686578',
    marginTop: 8,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 18,
  },
  glassCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  cardIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTextWrapper: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#16151E',
  },
  cardDescription: {
    fontSize: 13,
    color: '#686578',
    marginTop: 4,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16151E',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#686578',
    marginBottom: 20,
    lineHeight: 20,
  },
  codeBox: {
    backgroundColor: 'rgba(142, 124, 232, 0.1)',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(142, 124, 232, 0.3)',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  codeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#8E7CE8',
    letterSpacing: 4,
  },
  inputCode: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#16151E',
    textAlign: 'center',
    letterSpacing: 3,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.25)',
    marginBottom: 20,
  },
  primaryButton: {
    height: 54,
    backgroundColor: '#8E7CE8',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#8E7CE8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 52,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#8E7CE8',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
