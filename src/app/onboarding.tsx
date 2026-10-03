import { logger } from '@/lib/core/logger';
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Platform, Share } from 'react-native';
import { showAlert } from '@/lib/core/dialog';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/core/supabase';
import { useAuth } from '@/lib/context/AuthContext';
import { useCouple } from '@/lib/context/CoupleContext';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
import { useTheme } from '@/theme';
import { AnimatedIcon, AuthScreen, Button, GlassButton, PressableScale } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';

type OnboardingStep = 'select' | 'create' | 'join';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { refreshCoupleStatus, clearCouple } = useCouple();

  const [step, setStep] = useState<OnboardingStep>('select');
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const { colors, typography, radii, spacing } = useTheme();
  const { copied, copy } = useCopyToClipboard();

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
      showAlert('Erro ao criar casal', err.message || 'Ocorreu um erro ao criar o casal.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fluxo de Resgate de Convite com Código
  const handleRedeemInvite = async () => {
    const formattedCode = inputCode.trim().toUpperCase().replace(/-/g, "");

    if (!formattedCode) {
      showAlert('Atenção', 'Por favor, digite o código de convite.');
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

      showAlert('Conectados com sucesso!', 'Bem-vindos ao espaço de vocês no NÓS!', [
        {
          text: 'Começar',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch {
      showAlert(
        'Código inválido',
        'Código inválido ou expirado'
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
        message: `Amor, criei o nosso espaço no NÓS! Baixe o aplicativo e utilize o nosso código: ${inviteCode?.replace(/(\w{5})(?=\w)/g, "$1-")}`,
      });
    } catch (err) {
      logger.warn('Erro ao compartilhar convite:', err);
    }
  };

  // 4. Concluir após criar o código e navegar para a Home
  const handleFinishCreate = async () => {
    await refreshCoupleStatus();
    router.replace('/(tabs)');
  };

  const formattedInvite = inviteCode?.replace(/(\w{5})(?=\w)/g, '$1-') ?? '';

  const subtitle =
    step === 'select'
      ? 'Vamos conectar você e o seu amor.'
      : step === 'create'
      ? 'Tudo pronto! Agora chame o seu amor.'
      : 'Insira o código do seu casal.';

  const title = step === 'select' ? 'Vínculo do casal' : step === 'create' ? 'Código do casal' : 'Entrar com código';

  const handleSignOut = async () => {
    clearCouple();
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <AuthScreen
      title={title}
      onBack={step !== 'select' && !loading ? () => setStep('select') : undefined}
      bare={step === 'select'}
      trailing={
        <PressableScale
          onPress={handleSignOut}
          disabled={loading}
          style={styles.signOut}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
        >
          <Feather name="log-out" size={16} color={colors.textSecondary} />
          <Text style={[styles.signOutText, { color: colors.textSecondary, ...typography.font.bold }]}>Sair</Text>
        </PressableScale>
      }
    >
      <Text style={[styles.subtitle, { color: colors.textSecondary, ...typography.font.medium }]}>{subtitle}</Text>

      {step === 'select' && (
        <>
          <ChoiceCard
            icon="heart"
            title="Criar nosso espaço"
            description="Gere um código exclusivo para convidar o seu parceiro(a)."
            loading={loading}
            disabled={loading}
            onPress={handleCreateCouple}
          />
          <ChoiceCard
            icon="key"
            title="Já tenho um código"
            description="Recebeu um convite? Conecte-se ao espaço já criado."
            disabled={loading}
            onPress={() => setStep('join')}
          />
        </>
      )}

      {step === 'create' && inviteCode && (
        <>
          <Text style={[styles.hint, { color: colors.textSecondary, ...typography.font.regular }]}>
            Envie este código para o seu amor entrar no mesmo espaço:
          </Text>

          <LiquidGlassView variant="pill" readable borderRadius={radii.md} style={[styles.codeBox, { paddingHorizontal: spacing[16] }]}>
            <Text
              style={[styles.codeText, { color: colors.textPrimary, ...typography.font.mono }]}
              accessibilityLabel={`Código ${formattedInvite.split('').join(' ')}`}
              selectable
            >
              {formattedInvite}
            </Text>
          </LiquidGlassView>

          <GlassButton
            label={copied ? 'Copiado!' : 'Copiar código'}
            icon={copied ? 'check' : 'copy'}
            onPress={() => copy(formattedInvite)}
            accessibilityLabel={copied ? 'Código copiado' : 'Copiar código do casal'}
          />
          <GlassButton label="Compartilhar convite" icon="share" onPress={handleShareCode} />

          <Button variant="primary" onPress={handleFinishCreate}>
            Acessar o NÓS
          </Button>
        </>
      )}

      {step === 'join' && (
        <>
          <Text style={[styles.hint, { color: colors.textSecondary, ...typography.font.regular }]}>
            Digite ou cole o código que você recebeu do seu amor:
          </Text>

          <View
            style={[
              styles.codeInputBox,
              { backgroundColor: colors.glassSurface, borderColor: colors.border, borderRadius: radii.md },
            ]}
          >
            <TextInput
              style={[
                styles.codeInput,
                { color: colors.textPrimary, ...typography.font.mono },
                Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
              ]}
              placeholder="XXXXX-XXXXX"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              cursorColor={colors.primary}
              autoCapitalize="characters"
              autoCorrect={false}
              accessibilityLabel="Código de convite"
              value={inputCode}
              onChangeText={(text) => {
                const clean = text.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '');
                let formatted = clean;
                if (clean.length > 5) {
                  formatted = clean.slice(0, 5) + '-' + clean.slice(5, 10);
                }
                setInputCode(formatted);
              }}
              maxLength={11}
            />
          </View>

          <Button variant="primary" onPress={handleRedeemInvite} loading={loading}>
            Conectar casal
          </Button>
        </>
      )}
    </AuthScreen>
  );
}

interface ChoiceCardProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function ChoiceCard({ icon, title, description, loading = false, disabled = false, onPress }: ChoiceCardProps) {
  const { colors, typography, radii, spacing } = useTheme();
  const [pulse, setPulse] = useState(0);

  return (
    <PressableScale
      onPress={onPress}
      onPressIn={() => setPulse((value) => value + 1)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      accessibilityState={{ disabled, busy: loading }}
    >
      <LiquidGlassView variant="card" readable borderRadius={radii.lg} style={[styles.choice, { gap: spacing[16], padding: spacing[20] }]}>
        <View style={[styles.choiceIcon, { backgroundColor: colors.primarySoft }]}>
          <AnimatedIcon name={icon} size={24} color={colors.primaryText} pulseKey={pulse} />
        </View>
        <View style={styles.choiceText}>
          <Text style={[styles.choiceTitle, { color: colors.textPrimary, ...typography.font.bold }]}>{title}</Text>
          <Text style={[styles.choiceDescription, { color: colors.textSecondary, ...typography.font.regular }]}>
            {description}
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <Feather name="chevron-right" size={22} color={colors.textSecondary} />
        )}
      </LiquidGlassView>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  signOut: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  signOutText: {
    fontSize: 14,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  choiceIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: {
    flex: 1,
    minWidth: 0,
  },
  choiceTitle: {
    fontSize: 17,
    marginBottom: 2,
  },
  choiceDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  codeBox: {
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 32,
    letterSpacing: 4,
    textAlign: 'center',
  },
  codeInputBox: {
    minHeight: 64,
    borderWidth: 0.8,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  codeInput: {
    fontSize: 26,
    letterSpacing: 4,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
