import React, { useEffect, useState, useCallback } from 'react';
import { 
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
 } from 'react-native';
import { AnimatedTouchable } from '../../components/AnimatedTouchable';
import { LiquidGlassBackground } from '../../components/LiquidGlassBackground';
import { AppHeader } from '../../components/AppHeader';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { supabase } from '../../lib/supabase';

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
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { coupleId, clearCouple } = useCouple();

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

  // Resolve URL assinada para foto do avatar
  const resolveAvatarUrl = async (pathOrUrl?: string | null): Promise<string | null> => {
    if (!pathOrUrl) return null;
    if (pathOrUrl.startsWith('file:') || pathOrUrl.startsWith('data:')) {
      return pathOrUrl;
    }

    let cleanPath = pathOrUrl.trim();
    if (cleanPath.includes('/avatars/')) {
      cleanPath = cleanPath.split('/avatars/')[1].split('?')[0];
    }

    // Tenta URL assinada válida por 24 horas (caso o bucket seja privado)
    try {
      const { data: signedData } = await supabase.storage
        .from('avatars')
        .createSignedUrl(cleanPath, 60 * 60 * 24);

      if (signedData?.signedUrl) {
        return signedData.signedUrl;
      }
    } catch {
      // Ignora e tenta URL pública
    }

    // Fallback: URL pública
    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(cleanPath);
    return publicData?.publicUrl || pathOrUrl;
  };

  // 1. Carrega todos os dados do casal e membros
  const loadProfileData = useCallback(async () => {
    if (!user || !coupleId) return;

    try {
      setLoading(true);

      // Busca membros do casal
      const { data: members, error: membersError } = await supabase
        .from('couple_members')
        .select('user_id')
        .eq('couple_id', coupleId);

      if (membersError) throw membersError;

      const userIds = (members || []).map((m) => m.user_id);

      // Busca perfis dos membros
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        if (profilesError) console.warn('Erro ao carregar perfis:', profilesError.message);

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
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id, anniversary_date, created_at')
        .eq('id', coupleId)
        .single();

      if (coupleError) console.warn('Erro ao carregar dados do casal:', coupleError.message);

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
    } catch (err: any) {
      console.warn('Erro geral ao carregar dados do perfil:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user, coupleId]);

  useEffect(() => {
    loadProfileData();

    // Sincronização em tempo real para alterações em profiles e couples
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

      // Upload para o bucket avatars
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileBody, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Atualiza o registro em profiles
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
      {/* Background Liquid Glass */}
      <LiquidGlassBackground />

      {/* Cabeçalho Apple Liquid Glass */}
      <View style={{ paddingHorizontal: 20 }}>
        <AppHeader
          sectionTitle="perfil"
          coupleSubtitle="Identidade e configurações do casal"
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8E7CE8"
            colors={['#8E7CE8']}
          />
        }
      >
        {/* 1. Header / Identidade do Casal (Dois Avatares com Anéis e Badge) */}
        <View style={styles.coupleHeroCard}>
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
                  <ActivityIndicator color="#8E7CE8" size="small" />
                ) : myProfile?.displayAvatarUrl ? (
                  <Image
                    source={{ uri: myProfile.displayAvatarUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Ionicons name="person" size={32} color="#8E7CE8" />
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
                  <Ionicons name="person" size={32} color="#735FD7" />
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
            <Text style={styles.syncStatusText}>Conexão Ativa & Sincronizada</Text>
          </View>
        </View>

        {/* 2. Card "Nosso Relacionamento" */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>NOSSO RELACIONAMENTO</Text>
        </View>

        <AnimatedTouchable
          style={styles.relationshipCard}
          onPress={() => setIsDateModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.relationIconCircle}>
            <Ionicons name="calendar" size={24} color="#8E7CE8" />
          </View>

          <View style={styles.relationContent}>
            <Text style={styles.relationLabel}>Data de Início Oficial</Text>
            <Text style={styles.relationDateValue}>
              {formatFullDatePTBR(anniversaryDate)}
            </Text>
            <Text style={styles.relationHint}>Toque para alterar a data comemorativa</Text>
          </View>

          <View style={styles.editPill}>
            <Ionicons name="pencil" size={14} color="#8E7CE8" />
            <Text style={styles.editPillText}>Editar</Text>
          </View>
        </AnimatedTouchable>

        {coupleCode && (
          <View style={styles.codeCard}>
            <View style={styles.codeIconCircle}>
              <Ionicons name="key-outline" size={20} color="#8E7CE8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.codeLabel}>Código de Vínculo do Casal</Text>
              <Text style={styles.codeValue}>{coupleCode}</Text>
            </View>
            <View style={styles.linkedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#38A169" />
              <Text style={styles.linkedBadgeText}>Vinculado</Text>
            </View>
          </View>
        )}

        {/* 3. Seção "Preferências & Segurança" */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PREFERÊNCIAS & SEGURANÇA</Text>
        </View>

        <View style={styles.securityCard}>
          <View style={styles.securityRow}>
            <View style={styles.securityIconBox}>
              <Ionicons name="shield-checkmark" size={22} color="#38A169" />
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
              <Ionicons name="lock-closed" size={22} color="#8E7CE8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.securityTitle}>Armazenamento Criptografado</Text>
              <Text style={styles.securitySubtitle}>
                Buckets de fotos e arquivos privados com acesso controlado por assinaturas temporárias.
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Ação da Conta (Encerrar Sessão) */}
        <AnimatedTouchable
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF5A5F" />
          <Text style={styles.signOutText}>Encerrar Sessão</Text>
        </AnimatedTouchable>

        {/* Versão e Assinatura */}
        <Text style={styles.footerNote}>NÓS • Feito para guardar nossa história</Text>
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
                <Ionicons name="calendar" size={22} color="#8E7CE8" />
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
                <Ionicons name="calendar-outline" size={20} color="#8E7CE8" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 124, 232, 0.1)',
    backgroundColor: '#F8F9FC',
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.25)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16151E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#686578',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },

  // Hero Card do Casal
  coupleHeroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#8E7CE8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
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
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  myAvatarRing: {
    borderColor: '#8E7CE8',
  },
  partnerAvatarRing: {
    borderColor: '#735FD7',
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
    backgroundColor: '#8E7CE8',
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
    backgroundColor: '#38A169',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16151E',
    marginTop: 8,
    textAlign: 'center',
  },
  avatarSubLabel: {
    fontSize: 11,
    color: '#686578',
    marginTop: 1,
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
    backgroundColor: '#8E7CE8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8E7CE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  syncStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 161, 105, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 8,
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38A169',
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#276749',
  },

  // Headers de Seção
  sectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#686578',
    letterSpacing: 0.8,
  },

  // Card do Relacionamento
  relationshipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
    marginBottom: 14,
    gap: 14,
  },
  relationIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relationContent: {
    flex: 1,
  },
  relationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#686578',
    marginBottom: 2,
  },
  relationDateValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16151E',
    marginBottom: 2,
  },
  relationHint: {
    fontSize: 11,
    color: '#8E7CE8',
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  editPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E7CE8',
  },

  // Card Código do Casal
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
    gap: 12,
  },
  codeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 124, 232, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeLabel: {
    fontSize: 11,
    color: '#686578',
    fontWeight: '600',
  },
  codeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16151E',
    letterSpacing: 1,
    marginTop: 1,
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 161, 105, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  linkedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#276749',
  },

  // Card Segurança & Privacidade
  securityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 14,
    elevation: 2,
    marginBottom: 28,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.15)',
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16151E',
    marginBottom: 2,
  },
  securitySubtitle: {
    fontSize: 12,
    color: '#686578',
    lineHeight: 16,
  },
  securityDivider: {
    height: 1,
    backgroundColor: 'rgba(142, 124, 232, 0.08)',
    marginVertical: 14,
  },

  // Botão de Logout
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 90, 95, 0.08)',
    borderRadius: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 95, 0.2)',
    marginBottom: 20,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF5A5F',
  },
  footerNote: {
    fontSize: 12,
    color: '#A09EAD',
    textAlign: 'center',
    marginTop: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'ios' ? 44 : 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
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
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#16151E',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#686578',
    marginTop: 2,
    lineHeight: 16,
  },
  androidDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(142, 124, 232, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.15)',
  },
  androidDateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16151E',
  },
  pickerBox: {
    backgroundColor: 'rgba(142, 124, 232, 0.04)',
    borderRadius: 20,
    padding: 10,
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
    color: '#686578',
  },
  modalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 18,
    backgroundColor: '#8E7CE8',
    shadowColor: '#8E7CE8',
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
});
