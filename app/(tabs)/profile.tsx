import React, { useEffect, useState, useCallback } from 'react';
import { 
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';
import { PressableScale } from '../../components/ui/PressableScale';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';
import { GlassSurface } from '../../components/ui/GlassSurface';
import { AppHeader } from '../../components/AppHeader';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { LiquidThemeSelector } from '../../components/ui/LiquidThemeSelector';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { useAppTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { getThemeTokens } from '../../constants/theme';
import { useTabBarHeight } from '../../hooks/useTabBarHeight';

interface ProfileData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  displayAvatarUrl?: string | null;
}

const getFirstName = (fullName?: string | null): string => {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) {
    const compoundFirst = ['maria', 'joao', 'joão', 'ana', 'pedro', 'vitor', 'victor', 'luiz', 'luís', 'luis'];
    if (compoundFirst.includes(parts[0].toLowerCase())) {
      return `${parts[0]} ${parts[1]}`;
    }
  }
  return parts[0];
};

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
  const { paddingBottom: tabBarPaddingBottom } = useTabBarHeight();

  // Estados de perfis
  const [myProfile, setMyProfile] = useState<ProfileData | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<ProfileData | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [anniversaryDate, setAnniversaryDate] = useState<string | null>(null);
  const [coupleCode, setCoupleCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Animação de pulso lento no coração do casal (1 -> 1.06), pausada fora de foco
  const pathname = usePathname();
  const isFocused = pathname.includes('/profile');
  const reducedMotion = useReducedMotion();
  const heartScale = useSharedValue(1);

  useEffect(() => {
    if (!isFocused || reducedMotion) {
      cancelAnimation(heartScale);
      heartScale.value = 1;
      return;
    }

    heartScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(heartScale);
    };
  }, [isFocused, reducedMotion]);

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Estados para Modal de Edição de Aniversário
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [savingDate, setSavingDate] = useState(false);


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
  const loadProfileData = useCallback(async (silent = false) => {
    if (!user || !coupleId) return;

    try {
      if (!silent) setLoading(true);

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
          setPartnerId(partnerData.id);
        } else {
          setPartnerProfile(null);
          setPartnerId(null);
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
      if (!silent) setLoading(false);
    }
  }, [user, coupleId]);

  // Atualização pontual do perfil no estado via payload de Realtime
  const handleProfileUpdate = useCallback(
    async (newProfile: { id: string; display_name?: string | null; avatar_url?: string | null }) => {
      const displayAvatarUrl = await resolveAvatarUrl(newProfile.avatar_url);
      const updatedData: Partial<ProfileData> = {
        id: newProfile.id,
        display_name: newProfile.display_name || '',
        avatar_url: newProfile.avatar_url || null,
        displayAvatarUrl,
      };

      if (newProfile.id === user?.id) {
        setMyProfile((prev) => (prev ? { ...prev, ...updatedData } : null));
      } else if (newProfile.id === partnerId) {
        setPartnerProfile((prev) => (prev ? { ...prev, ...updatedData } : null));
      }
    },
    [user?.id, partnerId]
  );

  useEffect(() => {
    loadProfileData();

    if (!coupleId || !user?.id) return;

    const channel = supabase.channel(`profile_tab_${coupleId}`);

    // Atualização do relacionamento
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
      (payload: any) => {
        if (payload?.new) {
          if (payload.new.anniversary_date) {
            setAnniversaryDate(payload.new.anniversary_date);
            const parts = payload.new.anniversary_date.split('-');
            if (parts.length === 3) {
              setTempDate(
                new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
              );
            }
          }
        }
      }
    );

    // Filtro pontual pelo id do próprio usuário
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
      (payload: any) => {
        if (payload?.new) {
          handleProfileUpdate(payload.new);
        }
      }
    );

    // Filtro pontual pelo id do parceiro (se conhecido)
    if (partnerId) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${partnerId}` },
        (payload: any) => {
          if (payload?.new) {
            handleProfileUpdate(payload.new);
          }
        }
      );
    }

    // Recarrega se parceiro entrar ou sair de couple_members
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'couple_members', filter: `couple_id=eq.${coupleId}` },
      () => {
        loadProfileData(true);
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, user?.id, partnerId, handleProfileUpdate, loadProfileData]);

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  // 2. Upload de novo avatar do usuário
  const handlePickAvatar = async () => {
    if (!user || uploadingAvatar) return;
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
        quality: 0.9,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setUploadingAvatar(true);

      // Redimensiona o avatar para 512x512 em JPEG qualidade 0.8
      const manipulated = await manipulateAsync(
        asset.uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      const response = await fetch(manipulated.uri);
      const fileBody = await response.blob();

      const fileName = `${user.id}/${Date.now()}.jpg`;

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
      Alert.alert('Não conseguimos salvar sua foto agora', 'Tenta de novo? ' + (err.message || ''));
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

  const handleOpenDateModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (anniversaryDate) {
      setTempDate(new Date(anniversaryDate));
    }
    setIsDateModalVisible(true);
  };

  const copyCoupleCode = async () => {
    if (!coupleCode) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(coupleCode);
      }
      setCopiedCode(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      Alert.alert('Código do Casal', coupleCode);
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
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const doSignOut = async () => {
      clearCouple();
      await signOut();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza de que deseja sair da sua conta?')) {
        doSignOut();
      }
    } else {
      Alert.alert('Encerrar sessão', 'Tem certeza de que deseja sair da sua conta?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Encerrar', style: 'destructive', onPress: doSignOut },
      ]);
    }
  };

  const myName = myProfile?.display_name || user?.user_metadata?.display_name || 'Você';
  const partnerName = partnerProfile?.display_name || 'Meu Amor';

  return (
    <View style={styles.container}>
      {/* 1. Fundo Atmosférico Vivo preenchendo 100% da viewport física */}
      <AtmosphereBackground />

      {/* Cabeçalho Fixo com Blur e Transparência */}
      <View style={[styles.blurredHeaderContainer, { paddingTop: insets.top }]}>
        <GlassSurface
          intensity={Platform.OS === 'ios' ? 80 : 100}
          tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? 'rgba(15, 13, 24, 0.65)' : 'rgba(248, 249, 252, 0.70)',
              borderBottomWidth: 1,
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.60)',
            },
          ]}
        />
        <View style={styles.headerInnerRow}>
          <AppHeader
            sectionTitle="perfil"
            coupleSubtitle="Configurações e nós dois"
            containerStyle={{ marginBottom: 0, paddingTop: 6, paddingBottom: 6 }}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + (Platform.OS === 'ios' ? 98 : 92),
          paddingBottom: tabBarPaddingBottom,
          paddingHorizontal: 20,
        }}
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
            <View style={styles.skeletonHeroCard} />
            <View style={styles.skeletonCard} />
          </View>
        ) : (
          <>
            {/* 1. Header / Identidade do Casal (Dois Avatares com Anéis e Badge) */}
            <View style={styles.heroCardContainer}>
              <View
                style={[
                  styles.coupleHeroCard,
                  {
                    backgroundColor: isDark ? themeTokens.surface : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.15)',
                  },
                ]}
              >
                <View style={styles.avatarsRow}>
                  {/* Avatar do Usuário Logado */}
                  <PressableScale
                    style={styles.avatarWrapper}
                    onPress={handlePickAvatar}
                    disabled={uploadingAvatar}
                    accessibilityLabel="Alterar minha foto de perfil"
                  >
                    <View style={styles.avatarGradientRingWrapper}>
                      <LinearGradient
                        colors={['#7C6FE0', '#F58FA8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarGradientRing}
                      >
                        <View style={[styles.avatarInnerContainer, { backgroundColor: isDark ? '#15122A' : '#FFFFFF' }]}>
                          {uploadingAvatar ? (
                            <ActivityIndicator color={themeTokens.primary} size="small" />
                          ) : myProfile?.displayAvatarUrl ? (
                            <Image
                              source={{ uri: myProfile.displayAvatarUrl }}
                              style={styles.avatarImage}
                              contentFit="cover"
                              cachePolicy="memory-disk"
                            />
                          ) : (
                            <Ionicons name="person" size={32} color={themeTokens.primary} />
                          )}
                        </View>
                      </LinearGradient>
                      <View style={[styles.cameraBadge, { backgroundColor: themeTokens.primary }]}>
                        <Ionicons name="camera" size={12} color="#FFFFFF" />
                      </View>
                    </View>

                    <Text style={[styles.avatarLabel, { color: themeTokens.textPrimary }]} numberOfLines={2}>
                      {getFirstName(myName)}
                    </Text>
                    <Text style={[styles.avatarSubLabel, { color: themeTokens.textSecondary }]}>Você</Text>
                  </PressableScale>

                  {/* Conector Central (Coração com Gradiente e Pulso Lento) */}
                  <View style={styles.connectorCenter}>
                    <View style={[styles.connectorLine, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(124, 111, 224, 0.2)' }]} />
                    <Animated.View style={[styles.heartCircleContainer, animatedHeartStyle]}>
                      <LinearGradient
                        colors={['#7C6FE0', '#F58FA8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heartCircle}
                      >
                        <Ionicons name="heart" size={16} color="#FFFFFF" />
                      </LinearGradient>
                    </Animated.View>
                    <View style={[styles.connectorLine, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(124, 111, 224, 0.2)' }]} />
                  </View>

                  {/* Avatar do Parceiro/Parceira */}
                  <View style={styles.avatarWrapper}>
                    <View style={styles.avatarGradientRingWrapper}>
                      <LinearGradient
                        colors={['#F58FA8', '#7C6FE0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarGradientRing}
                      >
                        <View style={[styles.avatarInnerContainer, { backgroundColor: isDark ? '#15122A' : '#FFFFFF' }]}>
                          {partnerProfile?.displayAvatarUrl ? (
                            <Image
                              source={{ uri: partnerProfile.displayAvatarUrl }}
                              style={styles.avatarImage}
                              contentFit="cover"
                              cachePolicy="memory-disk"
                            />
                          ) : (
                            <Ionicons name="person" size={32} color={themeTokens.primary} />
                          )}
                        </View>
                      </LinearGradient>
                    </View>

                    <Text style={[styles.avatarLabel, { color: themeTokens.textPrimary }]} numberOfLines={2}>
                      {getFirstName(partnerName)}
                    </Text>
                    <Text style={[styles.avatarSubLabel, { color: themeTokens.textSecondary }]}>Parceiro(a)</Text>
                  </View>
                </View>

                {/* Badge de Sincronização Ativa */}
                <View
                  style={[
                    styles.syncStatusBadge,
                    {
                      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.10)',
                      borderColor: isDark ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.20)',
                    },
                  ]}
                >
                  <View style={styles.greenPulseDot} />
                  <Text style={[styles.syncStatusText, { color: isDark ? '#4ADE80' : '#15803D' }]}>
                    Espaço Compartilhado Sincronizado
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. Seção "Nosso Relacionamento" */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: themeTokens.textSecondary }]}>
                  NOSSO RELACIONAMENTO
                </Text>
              </View>

              <View
                style={[
                  styles.relationshipCard,
                  {
                    backgroundColor: isDark ? themeTokens.surface : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.15)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.relationIconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(157, 146, 240, 0.15)'
                        : 'rgba(124, 111, 224, 0.10)',
                    },
                  ]}
                >
                  <Ionicons name="calendar" size={22} color={themeTokens.primary} />
                </View>

                <View style={styles.relationContent}>
                  <Text style={[styles.relationLabel, { color: themeTokens.textSecondary }]}>
                    Data de Início Oficial
                  </Text>
                  <Text style={[styles.relationDateValue, { color: themeTokens.textPrimary }]}>
                    {formatFullDatePTBR(anniversaryDate)}
                  </Text>
                </View>

                <PressableScale
                  style={[
                    styles.editPill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(157, 146, 240, 0.15)'
                        : 'rgba(124, 111, 224, 0.10)',
                      borderColor: isDark
                        ? 'rgba(157, 146, 240, 0.25)'
                        : 'rgba(124, 111, 224, 0.20)',
                    },
                  ]}
                  onPress={handleOpenDateModal}
                  accessibilityLabel="Editar data oficial"
                >
                  <Ionicons name="pencil" size={13} color={themeTokens.primary} />
                  <Text style={[styles.editPillText, { color: themeTokens.primary }]}>Editar</Text>
                </PressableScale>
              </View>

              {coupleCode && (
                <View
                  style={[
                    styles.codeCard,
                    {
                      backgroundColor: isDark ? themeTokens.surface : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.15)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.codeIconCircle,
                      {
                        backgroundColor: isDark
                          ? 'rgba(157, 146, 240, 0.15)'
                          : 'rgba(124, 111, 224, 0.10)',
                      },
                    ]}
                  >
                    <Ionicons name="key-outline" size={20} color={themeTokens.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.codeHeaderRow}>
                      <Text style={[styles.codeLabel, { color: themeTokens.textSecondary }]}>
                        Código de Vínculo do Casal
                      </Text>
                      <View
                        style={[
                          styles.linkedBadge,
                          {
                            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.10)',
                          },
                        ]}
                      >
                        <Ionicons name="checkmark-circle" size={13} color="#22C55E" />
                        <Text style={[styles.linkedBadgeText, { color: isDark ? '#4ADE80' : '#15803D' }]}>
                          Vinculado
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.codeValue, { color: themeTokens.textPrimary }]}>
                      {coupleCode}
                    </Text>
                  </View>

                  <PressableScale
                    style={[
                      styles.copyPill,
                      {
                        backgroundColor: copiedCode
                          ? (isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.12)')
                          : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.10)'),
                        borderColor: copiedCode
                          ? '#22C55E'
                          : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(124, 111, 224, 0.20)'),
                      },
                    ]}
                    onPress={copyCoupleCode}
                    accessibilityLabel="Copiar código de casal"
                  >
                    <Ionicons
                      name={copiedCode ? "checkmark" : "copy-outline"}
                      size={14}
                      color={copiedCode ? '#22C55E' : themeTokens.primary}
                    />
                    <Text
                      style={[
                        styles.copyPillText,
                        { color: copiedCode ? '#22C55E' : themeTokens.primary },
                      ]}
                    >
                      {copiedCode ? 'Copiado!' : 'Copiar'}
                    </Text>
                  </PressableScale>
                </View>
              )}
            </View>

            {/* 3. Seção "Aparência & Tema" */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: themeTokens.textSecondary }]}>
                  APARÊNCIA & TEMA
                </Text>
              </View>

              <View
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: isDark ? themeTokens.surface : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.15)',
                  },
                ]}
              >
                <View style={styles.themeHeaderRow}>
                  <View
                    style={[
                      styles.themeIconCircle,
                      {
                        backgroundColor: isDark
                          ? 'rgba(157, 146, 240, 0.15)'
                          : 'rgba(124, 111, 224, 0.10)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={mode === 'dark' ? 'moon' : 'sunny'}
                      size={20}
                      color={themeTokens.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.themeCardTitle, { color: themeTokens.textPrimary }]}>
                      Tema do Aplicativo
                    </Text>
                    <Text style={[styles.themeCardDesc, { color: themeTokens.textSecondary }]}>
                      {mode === 'dark' ? 'Modo Escuro (roxo-noite)' : 'Modo Claro'}
                    </Text>
                  </View>
                </View>

                <LiquidThemeSelector currentMode={mode} onChangeMode={setMode} />
              </View>
            </View>

            {/* 4. Seção "Preferências & Segurança" */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: themeTokens.textSecondary }]}>
                  PREFERÊNCIAS & SEGURANÇA
                </Text>
              </View>

              <View
                style={[
                  styles.securityCard,
                  {
                    backgroundColor: isDark ? themeTokens.surface : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.15)',
                  },
                ]}
              >
                <View style={styles.securityRow}>
                  <View
                    style={[
                      styles.securityIconBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'rgba(34, 197, 94, 0.10)',
                      },
                    ]}
                  >
                    <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.securityTitle, { color: themeTokens.textPrimary }]}>
                      Espaço Privado & Seguro
                    </Text>
                    <Text style={[styles.securitySubtitle, { color: themeTokens.textSecondary }]}>
                      Protegido com Row Level Security (RLS) no Supabase. Somente vocês dois têm acesso às fotos, recados e memórias.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={themeTokens.textMuted} />
                </View>

                <View
                  style={[
                    styles.securityDivider,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(124, 111, 224, 0.10)',
                    },
                  ]}
                />

                <View style={styles.securityRow}>
                  <View
                    style={[
                      styles.securityIconBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(157, 146, 240, 0.15)'
                          : 'rgba(124, 111, 224, 0.10)',
                      },
                    ]}
                  >
                    <Ionicons name="lock-closed" size={20} color={themeTokens.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.securityTitle, { color: themeTokens.textPrimary }]}>
                      Armazenamento Criptografado
                    </Text>
                    <Text style={[styles.securitySubtitle, { color: themeTokens.textSecondary }]}>
                      Buckets de fotos e arquivos privados com acesso controlado por assinaturas temporárias.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={themeTokens.textMuted} />
                </View>
              </View>
            </View>

            {/* 5. Ação da Conta (Encerrar Sessão) */}
            <View style={styles.accountActionBlock}>
              <PressableScale
                onPress={handleSignOut}
                style={[
                  styles.signOutButton,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.20)',
                  },
                ]}
                accessibilityLabel="Encerrar Sessão"
              >
                <Ionicons name="log-out-outline" size={18} color={isDark ? '#F87171' : '#DC2626'} />
                <Text style={[styles.signOutText, { color: isDark ? '#F87171' : '#DC2626' }]}>
                  Encerrar Sessão
                </Text>
              </PressableScale>

              <Text style={[styles.footerNote, { color: themeTokens.textSecondary }]}>
                nós. • Um espaço só nosso
              </Text>
            </View>
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
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.15)',
              },
            ]}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalHeaderRow}>
              <View
                style={[
                  styles.modalIconBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(157, 146, 240, 0.15)'
                      : 'rgba(124, 111, 224, 0.12)',
                  },
                ]}
              >
                <Ionicons name="calendar" size={22} color={themeTokens.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: themeTokens.textPrimary }]}>
                  Início do Relacionamento
                </Text>
                <Text style={[styles.modalSubtitle, { color: themeTokens.textSecondary }]}>
                  Essa data alimenta o contador da tela Início e a contagem da jornada de vocês.
                </Text>
              </View>
            </View>

            {/* Botão de abrir picker no Android */}
            {Platform.OS === 'android' && (
              <PressableScale
                style={styles.androidDateButton}
                onPress={() => setShowAndroidPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={themeTokens.primary} />
                <Text style={[styles.androidDateText, { color: themeTokens.textPrimary }]}>
                  {tempDate.toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </PressableScale>
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
                  textColor={themeTokens.textPrimary}
                />
              </View>
            )}

            {/* Botões de Ação do Modal */}
            <View style={styles.modalActionsRow}>
              <PressableScale
                style={[
                  styles.modalCancelBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(104, 101, 120, 0.08)',
                  },
                ]}
                onPress={() => setIsDateModalVisible(false)}
                disabled={savingDate}
                accessibilityLabel="Cancelar edição de data"
              >
                <Text style={[styles.modalCancelText, { color: themeTokens.textSecondary }]}>
                  Cancelar
                </Text>
              </PressableScale>

              <PressableScale
                style={[
                  styles.modalSaveBtn,
                  savingDate && styles.btnDisabled,
                ]}
                onPress={handleSaveAnniversary}
                disabled={savingDate}
                accessibilityLabel="Salvar data comemorativa"
              >
                <LinearGradient
                  colors={['#7C6FE0', '#F58FA8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                {savingDate ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.modalSaveText}>Salvar Data</Text>
                    <Ionicons name="heart" size={16} color="#FFFFFF" />
                  </>
                )}
              </PressableScale>
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
  blurredHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    overflow: 'hidden',
  },
  headerInnerRow: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },

  // Skeleton Shimmer Loading
  skeletonContainer: {
    paddingTop: 10,
    gap: 18,
  },
  skeletonHeroCard: {
    width: '100%',
    height: 180,
    borderRadius: 28,
    borderWidth: 1,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 111, 224, 0.08)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(124, 111, 224, 0.15)',
  },
  skeletonCard: {
    width: '100%',
    height: 90,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 111, 224, 0.08)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(124, 111, 224, 0.15)',
  },

  // Hero Card do Casal
  heroCardContainer: {
    marginBottom: 20,
  },
  coupleHeroCard: {
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
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
    minWidth: 96,
    maxWidth: 120,
    paddingHorizontal: 4,
  },
  avatarGradientRingWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGradientRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 37,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 2,
  },
  avatarLabel: {
    fontSize: 15,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  avatarSubLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
    marginTop: 2,
  },
  connectorCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  connectorLine: {
    width: 14,
    height: 2,
  },
  heartCircleContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heartCircle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22C55E',
  },
  syncStatusText: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
  },

  // Seções e Cards
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    letterSpacing: 1.2,
  },

  // Card Relacionamento
  relationshipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  relationIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  relationContent: {
    flex: 1,
  },
  relationLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
    marginBottom: 2,
  },
  relationDateValue: {
    fontSize: 16,
    fontFamily: 'Fraunces_700Bold',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  editPillText: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
  },

  // Código do Casal
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginTop: 12,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  codeIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  codeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  codeLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
  },
  codeValue: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    letterSpacing: 2,
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  linkedBadgeText: {
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  copyPillText: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
  },

  // Card Aparência & Tema
  themeCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  themeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  themeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCardTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
  },
  themeCardDesc: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },

  // Card Segurança
  securityCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    marginBottom: 2,
  },
  securitySubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 17,
  },
  securityDivider: {
    height: 1,
    marginVertical: 12,
  },

  // Botão Sair da Conta
  accountActionBlock: {
    marginTop: 8,
    marginBottom: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
  },

  // Modal de Data
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 44 : 26,
    borderWidth: 1,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
    lineHeight: 16,
  },
  androidDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  androidDateText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
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
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    overflow: 'hidden',
  },
  modalSaveText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
