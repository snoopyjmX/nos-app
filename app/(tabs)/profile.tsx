import React, { useEffect, useState, useCallback } from 'react';
import { 
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  RefreshControl,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { AnimatedTouchable } from '../../components/AnimatedTouchable';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';
import { LiquidGlassView } from '../../components/ui/LiquidGlassView';
import { AppHeader } from '../../components/AppHeader';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { useAppTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { THEME, getThemeTokens } from '../../constants/theme';
import { useScrollNavbar } from '../../hooks/useScrollNavbar';

interface ProfileData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  displayAvatarUrl?: string | null;
}

const formatFullDatePTBR = (dateString?: string | null): string => {
  if (!dateString) return 'Não definida';
  const clean = dateString.split('T')[0];
  const parts = clean.split('-');

  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Não definida';
  return d.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function ProfileScreen() {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const styles = getStyles(themeTokens, isDark);
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { coupleId, clearCouple } = useCouple();
  const { mode, setMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { onScroll } = useScrollNavbar();

  // Estados de perfis
  const [myProfile, setMyProfile] = useState<ProfileData | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<ProfileData | null>(null);
  const [anniversaryDate, setAnniversaryDate] = useState<string | null>(null);
  const [coupleCode, setCoupleCode] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Estados para Modal de Edição de Aniversário
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [savingDate, setSavingDate] = useState(false);

  // Shimmer pulse animation para skeleton loading
  const shimmerOpacity = useSharedValue(0.4);
  useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withTiming(0.85, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  // Resolve URL assinada para foto do avatar
  const resolveAvatarUrl = async (pathOrUrl?: string | null): Promise<string | null> => {
    if (!pathOrUrl) return null;
    const trimmed = pathOrUrl.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('file:') || trimmed.startsWith('data:')) {
      return trimmed;
    }

    if ((trimmed.startsWith('http://') || trimmed.startsWith('https://')) && !trimmed.includes('/avatars/')) {
      return trimmed;
    }

    let cleanPath = trimmed;
    if (cleanPath.includes('/avatars/')) {
      cleanPath = cleanPath.split('/avatars/')[1].split('?')[0];
    }
    cleanPath = cleanPath.replace(/^\/+/, '');

    try {
      const { data: signedData, error: signError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(cleanPath, 60 * 60 * 24);

      if (!signError && signedData?.signedUrl) {
        return signedData.signedUrl;
      }
    } catch {
      // Ignora e tenta URL pública
    }

    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(cleanPath);
    return publicData?.publicUrl || trimmed;
  };

  // 1. Carrega todos os dados do casal e membros
  const loadProfileData = useCallback(async () => {
    if (!user || !coupleId) return;

    try {
      setLoading(true);

      const { data: members, error: membersError } = await supabase
        .from('couple_members')
        .select('user_id')
        .eq('couple_id', coupleId);

      if (membersError) throw membersError;

      const userIds = (members || []).map((m) => m.user_id);

      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          // Ignora silenciosamente
        }

        const profilesWithUrls: ProfileData[] = await Promise.all(
          (profiles || []).map(async (p) => {
            const displayAvatarUrl = await resolveAvatarUrl(p.avatar_url);
            return {
              ...p,
              displayAvatarUrl,
            };
          })
        );

        // Meu perfil
        const myData = profilesWithUrls.find((p) => p.id === user.id);
        setMyProfile(
          myData || {
            id: user.id,
            display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Você',
            avatar_url: null,
            displayAvatarUrl: null,
          }
        );

        // Perfil do parceiro
        const partnerData = profilesWithUrls.find((p) => p.id !== user.id);
        if (partnerData) {
          setPartnerProfile(partnerData);
        } else {
          setPartnerProfile(null);
        }
      }

      // Busca dados do relacionamento na tabela couples
      const { data: coupleData } = await supabase
        .from('couples')
        .select('id, anniversary_date, created_at')
        .eq('id', coupleId)
        .single();

      if (coupleData) {
        setAnniversaryDate(coupleData.anniversary_date || coupleData.created_at);
        if (coupleData.anniversary_date) {
          const parts = coupleData.anniversary_date.split('-');
          if (parts.length === 3) {
            setTempDate(
              new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
            );
          }
        }
      }

      // Busca código de convite ativo se houver
      const { data: inviteData } = await supabase
        .from('couple_invites')
        .select('code')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (inviteData?.code) {
        setCoupleCode(inviteData.code);
      }
    } catch {
      // Ignora silenciosamente
    } finally {
      setLoading(false);
    }
  }, [user, coupleId]);

  useEffect(() => {
    loadProfileData();

    if (!coupleId) return;

    const channel = supabase
      .channel(`profile_tab_${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
        () => loadProfileData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => loadProfileData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, loadProfileData]);

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  // 2. Upload de novo avatar do usuário
  const handlePickAvatar = async () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para acessar sua galeria de fotos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setUploadingAvatar(true);

      const fileName = `${user.id}/${Date.now()}.jpg`;

      let fileBody: any;
      try {
        const response = await fetch(asset.uri);
        fileBody = await response.blob();
      } catch {
        if (asset.base64) {
          const binary = atob(asset.base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          fileBody = bytes;
        } else {
          throw new Error('Não foi possível processar a imagem selecionada.');
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileBody, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: fileName,
          display_name: myProfile?.display_name || user.user_metadata?.display_name || 'Você',
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        throw updateError;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadProfileData();
      Alert.alert('Avatar atualizado!', 'Sua nova foto já está visível para vocês dois.');
    } catch (err: any) {
      Alert.alert('Erro ao atualizar foto', err.message || 'Tente novamente.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 3. Salvar nova data de aniversário
  const handleSaveAnniversary = async () => {
    if (!coupleId) return;

    setSavingDate(true);
    try {
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, '0');
      const day = String(tempDate.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;

      const { error } = await supabase
        .from('couples')
        .update({ anniversary_date: isoDate })
        .eq('id', coupleId);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAnniversaryDate(isoDate);
      setIsDateModalVisible(false);
      await loadProfileData();

      Alert.alert(
        'Data atualizada!',
        `A data de início do relacionamento foi ajustada para ${day}/${month}/${year}.`
      );
    } catch (err: any) {
      Alert.alert('Erro ao atualizar data', err.message || 'Tente novamente.');
    } finally {
      setSavingDate(false);
    }
  };

  const onDateChange = (_event: DateTimePickerChangeEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false);
    }
    if (selected) {
      setTempDate(selected);
    }
  };

  // 4. Logout seguro
  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Encerrar sessão', 'Tem certeza de que deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Encerrar',
        style: 'destructive',
        onPress: async () => {
          clearCouple();
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const myName = myProfile?.display_name || user?.user_metadata?.display_name || 'Você';
  const partnerName = partnerProfile?.display_name || 'Meu Amor';

  return (
    <View style={styles.container}>
      {/* 1. Fundo Atmosférico Vivo preenchendo 100% da viewport física */}
      <AtmosphereBackground />

      {/* Cabeçalho Apple Liquid Glass com safe area protegida */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top + 8 }]}>
        <AppHeader
          sectionTitle="perfil"
          coupleSubtitle="Configurações e nós dois"
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 130, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeTokens.primary}
            colors={[themeTokens.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.skeletonContainer}>
            <Animated.View style={[styles.skeletonHeroCard, shimmerStyle]} />
            <Animated.View style={[styles.skeletonCard, shimmerStyle]} />
          </View>
        ) : (
          <>
            {/* 1. Header / Identidade do Casal (Dois Avatares com Anéis e Badge) */}
            <Animated.View entering={FadeInDown.springify().damping(15)}>
              <LiquidGlassView variant="hero" style={styles.coupleHeroCard} borderRadius={32}>
                <View style={styles.avatarsRow}>
                  {/* Avatar do Usuário Logado (Com botão de trocar foto) */}
                  <AnimatedTouchable
                    style={styles.avatarWrapper}
                    onPress={handlePickAvatar}
                    disabled={uploadingAvatar}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.avatarRing, styles.myAvatarRing]}>
                      {uploadingAvatar ? (
                        <ActivityIndicator color={themeTokens.primary} size="small" />
                      ) : myProfile?.displayAvatarUrl ? (
                        <Image
                          source={{ uri: myProfile.displayAvatarUrl }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Ionicons name="person" size={32} color={themeTokens.primary} />
                      )}
                    </View>

                    <View style={styles.cameraBadge}>
                      <Ionicons name="camera" size={13} color="#FFFFFF" />
                    </View>
                    <Text style={styles.avatarLabel} numberOfLines={1}>
                      {myName}
                    </Text>
                    <Text style={styles.avatarSubLabel}>Você</Text>
                  </AnimatedTouchable>

                  {/* Conector Central (Coração Pulsante) */}
                  <View style={styles.connectorCenter}>
                    <View style={styles.connectorLine} />
                    <View style={styles.heartCircle}>
                      <Ionicons name="heart" size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.connectorLine} />
                  </View>

                  {/* Avatar do Parceiro/Parceira */}
                  <View style={styles.avatarWrapper}>
                    <View style={[styles.avatarRing, styles.partnerAvatarRing]}>
                      {partnerProfile?.displayAvatarUrl ? (
                        <Image
                          source={{ uri: partnerProfile.displayAvatarUrl }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Ionicons name="person" size={32} color="#7C3AED" />
                      )}
                    </View>

                    <View style={styles.onlineBadge} />
                    <Text style={styles.avatarLabel} numberOfLines={1}>
                      {partnerName}
                    </Text>
                    <Text style={styles.avatarSubLabel}>Parceiro(a)</Text>
                  </View>
                </View>

                {/* Badge de Sincronização Ativa */}
                <View style={styles.syncStatusBadge}>
                  <View style={styles.greenPulseDot} />
                  <Text style={styles.syncStatusText}>Espaço Compartilhado Sincronizado</Text>
                </View>
              </LiquidGlassView>
            </Animated.View>

            {/* 2. Card "Nosso Relacionamento" */}
            <Animated.View entering={FadeInDown.springify().damping(15)}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>NOSSO RELACIONAMENTO</Text>
              </View>

              <AnimatedTouchable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsDateModalVisible(true);
                }}
                activeOpacity={0.88}
              >
                <LiquidGlassView variant="card" style={styles.relationshipCard} borderRadius={24}>
                  <View style={styles.relationIconCircle}>
                    <Ionicons name="calendar" size={22} color={themeTokens.primary} />
                  </View>

                  <View style={styles.relationContent}>
                    <Text style={styles.relationLabel}>Data de Início Oficial</Text>
                    <Text style={styles.relationDateValue}>
                      {formatFullDatePTBR(anniversaryDate)}
                    </Text>
                    <Text style={styles.relationHint}>Toque para alterar a data comemorativa</Text>
                  </View>

                  <View style={styles.editPill}>
                    <Ionicons name="pencil" size={13} color={themeTokens.primary} />
                    <Text style={styles.editPillText}>Editar</Text>
                  </View>
                </LiquidGlassView>
              </AnimatedTouchable>

              {coupleCode && (
                <LiquidGlassView variant="card" style={styles.codeCard} borderRadius={24}>
                  <View style={styles.codeIconCircle}>
                    <Ionicons name="key-outline" size={20} color={themeTokens.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.codeLabel}>Código de Vínculo do Casal</Text>
                    <Text style={styles.codeValue}>{coupleCode}</Text>
                  </View>
                  <View style={styles.linkedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                    <Text style={styles.linkedBadgeText}>Vinculado</Text>
                  </View>
                </LiquidGlassView>
              )}
            </Animated.View>

            {/* 3. Seção "Aparência & Tema" (Dark Mode Control) */}
            <Animated.View entering={FadeInDown.springify().damping(15)}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>APARÊNCIA & TEMA</Text>
              </View>

              <LiquidGlassView variant="card" style={styles.themeCard} borderRadius={24}>
                <View style={styles.themeHeaderRow}>
                  <View style={styles.themeIconCircle}>
                    <Ionicons
                      name={mode === 'dark' ? 'moon' : mode === 'light' ? 'sunny' : 'phone-portrait-outline'}
                      size={20}
                      color={themeTokens.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.themeCardTitle}>Tema do Aplicativo</Text>
                    <Text style={styles.themeCardDesc}>
                      {mode === 'system'
                        ? `Seguindo o sistema (${isDark ? 'Escuro' : 'Claro'})`
                        : mode === 'dark'
                        ? 'Modo Escuro ativado'
                        : 'Modo Claro ativado'}
                    </Text>
                  </View>
                </View>

                {/* Segmented Control Liquid Glass: Sistema, Claro, Escuro */}
                <View style={styles.segmentedControl}>
                  <AnimatedTouchable
                    style={[
                      styles.segmentButton,
                      mode === 'system' && styles.segmentButtonActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMode('system');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="phone-portrait-outline"
                      size={14}
                      color={mode === 'system' ? '#FFFFFF' : themeTokens.textSecondary}
                    />
                    <Text
                      style={[
                        styles.segmentButtonText,
                        mode === 'system' && styles.segmentButtonTextActive,
                      ]}
                    >
                      Sistema
                    </Text>
                  </AnimatedTouchable>

                  <AnimatedTouchable
                    style={[
                      styles.segmentButton,
                      mode === 'light' && styles.segmentButtonActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMode('light');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="sunny-outline"
                      size={14}
                      color={mode === 'light' ? '#FFFFFF' : themeTokens.textSecondary}
                    />
                    <Text
                      style={[
                        styles.segmentButtonText,
                        mode === 'light' && styles.segmentButtonTextActive,
                      ]}
                    >
                      Claro
                    </Text>
                  </AnimatedTouchable>

                  <AnimatedTouchable
                    style={[
                      styles.segmentButton,
                      mode === 'dark' && styles.segmentButtonActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMode('dark');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="moon-outline"
                      size={14}
                      color={mode === 'dark' ? '#FFFFFF' : themeTokens.textSecondary}
                    />
                    <Text
                      style={[
                        styles.segmentButtonText,
                        mode === 'dark' && styles.segmentButtonTextActive,
                      ]}
                    >
                      Escuro
                    </Text>
                  </AnimatedTouchable>
                </View>
              </LiquidGlassView>
            </Animated.View>

            {/* 4. Seção "Preferências & Segurança" */}
            <Animated.View entering={FadeInDown.springify().damping(15)}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>PREFERÊNCIAS & SEGURANÇA</Text>
              </View>

              <LiquidGlassView variant="card" style={styles.securityCard} borderRadius={24}>
                <View style={styles.securityRow}>
                  <View style={styles.securityIconBox}>
                    <Ionicons name="shield-checkmark" size={22} color="#34C759" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.securityTitle}>Espaço Privado & Seguro</Text>
                    <Text style={styles.securitySubtitle}>
                      Protegido com Row Level Security (RLS) no Supabase. Somente vocês dois têm acesso às fotos, recados e memórias.
                    </Text>
                  </View>
                </View>

                <View style={styles.securityDivider} />

                <View style={styles.securityRow}>
                  <View style={styles.securityIconBox}>
                    <Ionicons name="lock-closed" size={22} color={themeTokens.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.securityTitle}>Armazenamento Criptografado</Text>
                    <Text style={styles.securitySubtitle}>
                      Buckets de fotos e arquivos privados com acesso controlado por assinaturas temporárias.
                    </Text>
                  </View>
                </View>
              </LiquidGlassView>
            </Animated.View>

            {/* 4. Ação da Conta (Encerrar Sessão) */}
            <Animated.View entering={FadeInDown.springify().damping(15)}>
              <AnimatedTouchable
                onPress={handleSignOut}
                activeOpacity={0.85}
              >
                <LiquidGlassView variant="pill" style={styles.signOutButton} borderRadius={24}>
                  <Ionicons name="log-out-outline" size={18} color="#FF5A5F" />
                  <Text style={styles.signOutText}>Encerrar Sessão</Text>
                </LiquidGlassView>
              </AnimatedTouchable>

              <Text style={styles.footerNote}>NÓS • Feito para guardar nossa história</Text>
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Modal de Edição da Data de Aniversário */}
      <Modal
        visible={isDateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !savingDate && setIsDateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconBadge}>
                <Ionicons name="calendar" size={22} color={themeTokens.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Início do Relacionamento</Text>
                <Text style={styles.modalSubtitle}>
                  Essa data alimenta o contador da Home e a contagem da nossa jornada.
                </Text>
              </View>
            </View>

            {/* Botão de abrir picker no Android */}
            {Platform.OS === 'android' && (
              <AnimatedTouchable
                style={styles.androidDateButton}
                onPress={() => setShowAndroidPicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={20} color={themeTokens.primary} />
                <Text style={styles.androidDateText}>
                  {tempDate.toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </AnimatedTouchable>
            )}

            {/* Picker nativo no iOS ou quando ativado no Android */}
            {(Platform.OS === 'ios' || showAndroidPicker) && (
              <View style={styles.pickerBox}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onValueChange={onDateChange}
                  textColor="#16151E"
                />
              </View>
            )}

            {/* Botões de Ação do Modal */}
            <View style={styles.modalActionsRow}>
              <AnimatedTouchable
                style={styles.modalCancelBtn}
                onPress={() => setIsDateModalVisible(false)}
                disabled={savingDate}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </AnimatedTouchable>

              <AnimatedTouchable
                style={[styles.modalSaveBtn, savingDate && styles.btnDisabled]}
                onPress={handleSaveAnniversary}
                disabled={savingDate}
              >
                {savingDate ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.modalSaveText}>Salvar Data</Text>
                    <Ionicons name="heart" size={16} color="#FFFFFF" />
                  </>
                )}
              </AnimatedTouchable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (themeTokens: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeTokens.background,
  },
  headerWrapper: {
    paddingHorizontal: 20,
    zIndex: 10,
  },

  // Skeleton Shimmer Loading
  skeletonContainer: {
    paddingTop: 10,
    gap: 20,
  },
  skeletonHeroCard: {
    width: '100%',
    height: 180,
    borderRadius: 32,
    borderWidth: 1,
  },
  skeletonCard: {
    width: '100%',
    height: 100,
    borderRadius: 24,
    borderWidth: 1,
  },

  // Hero Card do Casal Liquid Glass
  coupleHeroCard: {
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
    marginBottom: 24,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  avatarWrapper: {
    alignItems: 'center',
    width: 90,
  },
  avatarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  myAvatarRing: {
    borderColor: themeTokens.primary,
  },
  partnerAvatarRing: {
    borderColor: themeTokens.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    top: 52,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: themeTokens.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  onlineBadge: {
    position: 'absolute',
    top: 54,
    right: 10,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: themeTokens.textPrimary,
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  avatarSubLabel: {
    fontSize: 11,
    color: themeTokens.textSecondary,
    marginTop: 1,
    fontWeight: '500',
  },
  connectorCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginBottom: 20,
  },
  connectorLine: {
    width: 14,
    height: 2,
    backgroundColor: 'rgba(142, 124, 232, 0.3)',
  },
  heartCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: themeTokens.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  syncStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  syncStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },

  // Seções
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: themeTokens.textSecondary,
    letterSpacing: 1.2,
  },

  // Card Relacionamento Liquid Glass
  relationshipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
    marginBottom: 16,
  },
  relationIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  relationContent: {
    flex: 1,
  },
  relationLabel: {
    fontSize: 11,
    color: themeTokens.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  relationDateValue: {
    fontSize: 16,
    fontWeight: '800',
    color: themeTokens.textPrimary,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  relationHint: {
    fontSize: 11,
    color: themeTokens.primary,
    fontWeight: '500',
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(142, 124, 232, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  editPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: themeTokens.primary,
  },

  // Código do Casal
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
    marginBottom: 24,
  },
  codeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  codeLabel: {
    fontSize: 11,
    color: themeTokens.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  codeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: themeTokens.textPrimary,
    letterSpacing: 1.5,
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  linkedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },

  // Card Segurança
  securityCard: {
    borderRadius: 24,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
    marginBottom: 24,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  securityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 124, 232, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: themeTokens.textPrimary,
    marginBottom: 4,
  },
  securitySubtitle: {
    fontSize: 12,
    color: themeTokens.textSecondary,
    lineHeight: 18,
  },
  securityDivider: {
    height: 1,
    backgroundColor: 'rgba(142, 124, 232, 0.1)',
    marginVertical: 14,
  },

  // Botão Sair
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 90, 95, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 95, 0.2)',
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF5A5F',
  },
  footerNote: {
    fontSize: 12,
    color: themeTokens.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 12,
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'ios' ? 44 : 26,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  modalIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: themeTokens.textPrimary,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    color: themeTokens.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  androidDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(142, 124, 232, 0.08)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  androidDateText: {
    fontSize: 15,
    fontWeight: '600',
    color: themeTokens.textPrimary,
  },
  pickerBox: {
    alignItems: 'center',
    marginVertical: 10,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(104, 101, 120, 0.08)',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: themeTokens.textSecondary,
  },
  modalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 18,
    backgroundColor: themeTokens.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  themeCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
  themeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  themeIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: themeTokens.textPrimary,
    letterSpacing: -0.2,
  },
  themeCardDesc: {
    fontSize: 12,
    color: themeTokens.textSecondary,
    marginTop: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(142, 124, 232, 0.08)',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  segmentButtonActive: {
    backgroundColor: themeTokens.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: themeTokens.textSecondary,
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
