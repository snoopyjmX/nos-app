import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AnimatedTouchable } from '../../components/AnimatedTouchable';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';
import { LiquidGlassView } from '../../components/ui/LiquidGlassView';
import { AppHeader } from '../../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { supabase } from '../../lib/supabase';
import { THEME } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../constants/theme';

interface MemoryItem {
  id: string;
  couple_id: string;
  title: string;
  memory_date: string;
  image_url: string;
  displayUrl?: string;
  created_at: string;
  created_by?: string;
}

interface MemberProfile {
  name: string;
  push_token?: string | null;
}

const getFirstName = (name?: string | null): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
};

const formatFullDatePTBR = (dateString?: string | null): string => {
  if (!dateString) return '';
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

  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
};

const formatSavedAtDateTime = (dateString?: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
};

export default function MemoriesScreen() {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const styles = getStyles(themeTokens, isDark);
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const insets = useSafeAreaInsets();

  // Animação e estado para esconder o botão flutuante ao scrollar
  const lastOffsetY = useRef(0);
  const fabTranslateY = useSharedValue(0);
  const fabOpacity = useSharedValue(1);
  const [isFabVisible, setIsFabVisible] = useState(true);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;

    // Se estiver no topo da tela, o botão sempre aparece
    if (currentOffsetY <= 15) {
      if (!isFabVisible) setIsFabVisible(true);
      fabTranslateY.value = withTiming(0, { duration: 180 });
      fabOpacity.value = withTiming(1, { duration: 180 });
      lastOffsetY.current = currentOffsetY;
      return;
    }

    const diff = currentOffsetY - lastOffsetY.current;

    // Ao scrollar para baixo (mais de 8px): esconde o botão para dar visão livre às fotos
    if (diff > 8) {
      if (isFabVisible) setIsFabVisible(false);
      fabTranslateY.value = withTiming(90, { duration: 180 });
      fabOpacity.value = withTiming(0, { duration: 180 });
      lastOffsetY.current = currentOffsetY;
    } else if (diff < -8) {
      // Ao scrollar para cima: reaparece o botão suavemente
      if (!isFabVisible) setIsFabVisible(true);
      fabTranslateY.value = withTiming(0, { duration: 180 });
      fabOpacity.value = withTiming(1, { duration: 180 });
      lastOffsetY.current = currentOffsetY;
    }
  };

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: fabTranslateY.value }],
    opacity: fabOpacity.value,
  }));

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileMap, setProfileMap] = useState<Map<string, MemberProfile>>(new Map());

  // Estados para Adicionar Memória
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryDate, setMemoryDate] = useState<Date>(new Date());
  const [uploading, setUploading] = useState(false);

  // Seletor de data dentro do modal
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Modal para visualização ampliada
  const [previewMemory, setPreviewMemory] = useState<MemoryItem | null>(null);

  // Carrega os perfis dos membros para saber o nome do autor e o push_token para notificações
  const loadMemberProfiles = useCallback(async () => {
    if (!coupleId) return;

    try {
      const { data: members } = await supabase
        .from('couple_members')
        .select('user_id')
        .eq('couple_id', coupleId);

      const userIds = new Set<string>();
      if (user?.id) userIds.add(user.id);
      (members || []).forEach((m) => {
        if (m.user_id) userIds.add(m.user_id);
      });

      if (userIds.size === 0) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, push_token')
        .in('id', Array.from(userIds));

      const map = new Map<string, MemberProfile>();
      if (profiles && profiles.length > 0) {
        profiles.forEach((p) => {
          map.set(p.id, {
            name: getFirstName(p.display_name) || (p.id === user?.id ? 'Você' : 'Amor'),
            push_token: (p as any).push_token || null,
          });
        });
      }
      setProfileMap(map);
    } catch (err) {
      console.warn('Erro ao carregar perfis para memórias:', err);
    }
  }, [coupleId, user?.id]);

  // 1. Carrega todas as memórias do casal
  const loadMemories = useCallback(async (silent = false) => {
    if (!coupleId) return;

    try {
      if (!silent) setLoading(true);
      const { data, error } = await supabase
        .from('memories')
        .select('id, couple_id, title, memory_date, image_url, created_at, created_by')
        .eq('couple_id', coupleId)
        .order('memory_date', { ascending: false });

      if (error) {
        throw error;
      }

      const rawList = data || [];

      // Gera uma URL assinada válida por 24 horas para cada memória
      const memoriesWithSignedUrls: MemoryItem[] = await Promise.all(
        rawList.map(async (item) => {
          if (!item.image_url) {
            return { ...item, displayUrl: '' };
          }

          let cleanPath = item.image_url.trim();
          if (
            cleanPath.startsWith('file:') ||
            cleanPath.startsWith('data:') ||
            cleanPath.startsWith('http://') ||
            cleanPath.startsWith('https://')
          ) {
            return { ...item, displayUrl: cleanPath };
          }

          if (cleanPath.includes('/memories/')) {
            cleanPath = cleanPath.split('/memories/')[1].split('?')[0];
          }
          cleanPath = cleanPath.replace(/^\/+/, '');

          try {
            const { data: signedData, error: signError } = await supabase.storage
              .from('memories')
              .createSignedUrl(cleanPath, 60 * 60 * 24);

            if (signedData?.signedUrl) {
              return {
                ...item,
                displayUrl: signedData.signedUrl,
              };
            }

            const { data: publicData } = supabase.storage
              .from('memories')
              .getPublicUrl(cleanPath);

            return {
              ...item,
              displayUrl: publicData?.publicUrl || item.image_url,
            };
          } catch {
            const { data: publicData } = supabase.storage
              .from('memories')
              .getPublicUrl(cleanPath);
            return { ...item, displayUrl: publicData?.publicUrl || item.image_url };
          }
        })
      );

      setMemories((prevList) => {
        const optimisticItems = prevList.filter(
          (p) => p.id.startsWith('local-') && !memoriesWithSignedUrls.some((n) => n.image_url === p.image_url)
        );
        const mergedList = memoriesWithSignedUrls.map((newItem) => {
          const localMatch = prevList.find(
            (p) => (p.image_url === newItem.image_url || (p.title === newItem.title && p.memory_date === newItem.memory_date)) &&
                   p.displayUrl &&
                   (p.displayUrl.startsWith('file:') || p.displayUrl.startsWith('data:'))
          );
          if (localMatch && (!newItem.displayUrl || !newItem.displayUrl.startsWith('http'))) {
            return { ...newItem, displayUrl: localMatch.displayUrl };
          }
          return newItem;
        });
        return [...optimisticItems, ...mergedList];
      });
    } catch {
      // Falha silenciosa
    } finally {
      if (!silent) setLoading(false);
    }
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) return;

    loadMemberProfiles();
    loadMemories();

    // Sincronização em tempo real para novas memórias
    const channel = supabase
      .channel(`memories_tab_${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memories',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          loadMemories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, loadMemberProfiles, loadMemories]);

  // Pull-to-Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadMemories(), loadMemberProfiles()]);
    setRefreshing(false);
  };

  // 2. Abre a galeria de imagens
  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de acesso às suas fotos para guardar os momentos especiais de vocês.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImageUri(asset.uri);
        setSelectedImageBase64(asset.base64 || null);
        setMemoryTitle('');
        setMemoryDate(new Date());
        setIsAddModalVisible(true);
      }
    } catch (err: any) {
      Alert.alert('Erro ao selecionar foto', err.message || 'Tente novamente.');
    }
  };

  // 3. Salva a memória no Supabase Storage e na tabela
  const handleSaveMemory = async () => {
    if (!memoryTitle.trim()) {
      Alert.alert('Atenção', 'Por favor, dê um título carinhoso para esta memória.');
      return;
    }

    if (!selectedImageUri || !coupleId || !user?.id) return;

    setUploading(true);

    try {
      const fileName = `${coupleId}/${Date.now()}.jpg`;

      let fileBody: any;
      try {
        const response = await fetch(selectedImageUri);
        fileBody = await response.blob();
      } catch {
        if (selectedImageBase64) {
          const binary = atob(selectedImageBase64);
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
        .from('memories')
        .upload(fileName, fileBody, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const year = memoryDate.getFullYear();
      const month = String(memoryDate.getMonth() + 1).padStart(2, '0');
      const day = String(memoryDate.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;

      const { error: insertError } = await supabase.from('memories').insert({
        couple_id: coupleId,
        created_by: user.id,
        title: memoryTitle.trim(),
        memory_date: isoDate,
        image_url: fileName,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Dispara push notification para o parceiro em segundo plano
      const partnerId = Array.from(profileMap.keys()).find((id) => id !== user.id);
      if (partnerId) {
        const partnerProfile = profileMap.get(partnerId);
        if (partnerProfile?.push_token) {
          const currentUserName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Seu amor';
          fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: partnerProfile.push_token,
              sound: 'default',
              title: 'nós.',
              body: `${currentUserName} eternizou um novo momento: "${memoryTitle.trim()}" ✨`,
              data: { url: '/memories' },
            }),
          }).catch((err) => console.warn('Push error on memory save:', err));
        }
      }

      // Adiciona memória imediatamente na lista com a foto já visível em alta qualidade
      const localSavedUri = selectedImageUri;
      const optimisticMemory: MemoryItem = {
        id: `local-${Date.now()}`,
        couple_id: coupleId,
        created_by: user.id,
        title: memoryTitle.trim(),
        memory_date: isoDate,
        image_url: fileName,
        displayUrl: localSavedUri,
        created_at: new Date().toISOString(),
      };
      setMemories((prev) => [optimisticMemory, ...prev]);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAddModalVisible(false);
      setSelectedImageUri(null);
      setSelectedImageBase64(null);
      setMemoryTitle('');

      await loadMemories(true);
    } catch (err: any) {
      Alert.alert('Erro ao guardar memória', err.message || 'Ocorreu um erro no upload.');
    } finally {
      setUploading(false);
    }
  };

  const onDateChange = (_event: DateTimePickerChangeEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selected) {
      setMemoryDate(selected);
    }
  };

  const renderMemoryCard = ({ item, index }: { item: MemoryItem; index: number }) => {
    const imageUrl = item.displayUrl || item.image_url;
    const authorProfile = item.created_by ? profileMap.get(item.created_by) : undefined;
    const isMe = item.created_by === user?.id;
    const authorName = isMe
      ? 'Você'
      : authorProfile?.name || 'Parceiro(a)';

    return (
      <View>
        <AnimatedTouchable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPreviewMemory(item);
          }}
          activeOpacity={0.92}
        >
          <LiquidGlassView variant="card" style={styles.memoryCard} borderRadius={26}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.cardImage}
              resizeMode="cover"
            />

            <View style={styles.cardContent}>
              <View style={styles.cardMetaRow}>
                <View style={styles.datePill}>
                  <Ionicons name="calendar-outline" size={13} color={themeTokens.primary} />
                  <Text style={styles.datePillText}>
                    {formatFullDatePTBR(item.memory_date)}
                  </Text>
                </View>

                <View style={styles.signatureBadge}>
                  <Ionicons name="sparkles" size={11} color="#7C3AED" />
                  <Text style={styles.signatureAuthorText} numberOfLines={1}>
                    Eternizado por {authorName}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>

              {item.created_at ? (
                <View style={styles.savedAtRow}>
                  <Ionicons name="time-outline" size={12} color="#8A879A" />
                  <Text style={styles.savedAtText}>
                    Salvo em {formatSavedAtDateTime(item.created_at)}
                  </Text>
                </View>
              ) : null}
            </View>
          </LiquidGlassView>
        </AnimatedTouchable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Fundo Atmosférico Vivo preenchendo 100% da viewport física */}
      <AtmosphereBackground />

      {/* Cabeçalho Apple Liquid Glass com safe area protegida */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top + 8 }]}>
        <AppHeader
          sectionTitle="memórias"
          coupleSubtitle="Nossos momentos eternizados"
        />
      </View>

      {/* Conteúdo Principal */}
      {loading ? (
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
        </View>
      ) : memories.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeTokens.primary}
              colors={[themeTokens.primary]}
            />
          }
        >
          <LiquidGlassView variant="card" style={styles.emptyGlassCard} borderRadius={28}>
            <View style={styles.emptyIconBadge}>
              <Ionicons name="images-outline" size={40} color={themeTokens.primary} />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma memória guardada ainda</Text>
            <Text style={styles.emptySubtitle}>
              Toque no botão abaixo para adicionar a primeira foto e eternizar o momento.
            </Text>
          </LiquidGlassView>
        </ScrollView>
      ) : (
        <FlatList
          data={memories}
          keyExtractor={(item) => item.id}
          renderItem={renderMemoryCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: 150 }]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeTokens.primary}
              colors={[themeTokens.primary]}
            />
          }
        />
      )}

      {/* Botão Flutuante Liquid Glass de Adicionar Memória */}
      <Animated.View
        pointerEvents={isFabVisible ? 'auto' : 'none'}
        style={[
          styles.floatingButtonWrapper,
          {
            bottom: Platform.OS === 'ios'
              ? (insets.bottom > 0 ? insets.bottom + 76 : 88)
              : 96,
          },
          fabAnimatedStyle,
        ]}
      >
        <AnimatedTouchable
          onPress={handlePickImage}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[themeTokens.primary, themeTokens.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.floatingButtonGradient}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.40)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.7 }}
              style={styles.fabGlint}
              pointerEvents="none"
            />
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.floatingButtonText}>Adicionar Memória</Text>
          </LinearGradient>
        </AnimatedTouchable>
      </Animated.View>

      {/* Modal para Adicionar Memória */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !uploading && setIsAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Nova Memória</Text>
            <Text style={styles.modalSubtitle}>
              Guarde este momento com um título e a data em que aconteceu.
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ alignItems: 'center' }}
            >
              {selectedImageUri && (
                <Image
                  source={{ uri: selectedImageUri }}
                  style={styles.modalImagePreview}
                />
              )}

              {/* Campo de Título */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Título da Memória</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Nosso primeiro piquenique..."
                  placeholderTextColor="#8A879A"
                  value={memoryTitle}
                  onChangeText={setMemoryTitle}
                  maxLength={100}
                />
              </View>

              {/* Botão de Escolha de Data */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Quando aconteceu?</Text>
                <AnimatedTouchable
                  style={styles.dateSelectorButton}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={18} color={themeTokens.primary} />
                  <Text style={styles.dateSelectorText}>
                    {formatFullDatePTBR(memoryDate.toISOString())}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#8A879A" />
                </AnimatedTouchable>
              </View>

              {/* DatePicker */}
              {(showDatePicker || Platform.OS === 'ios') && (
                <View style={styles.pickerBox}>
                  <DateTimePicker
                    value={memoryDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onValueChange={onDateChange}
                    textColor={themeTokens.textPrimary}
                  />
                  {Platform.OS === 'ios' && (
                    <AnimatedTouchable
                      style={styles.pickerDoneBtn}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.pickerDoneBtnText}>Concluir Data</Text>
                    </AnimatedTouchable>
                  )}
                </View>
              )}

              {/* Ações do Modal */}
              <View style={styles.modalActionsRow}>
                <AnimatedTouchable
                  style={styles.modalCancelButton}
                  onPress={() => setIsAddModalVisible(false)}
                  disabled={uploading}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </AnimatedTouchable>

                <AnimatedTouchable
                  style={[styles.modalSaveButton, uploading && styles.buttonDisabled]}
                  onPress={handleSaveMemory}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.modalSaveText}>Guardar</Text>
                      <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                    </>
                  )}
                </AnimatedTouchable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Visualização Ampliada da Foto com Blur Real */}
      <Modal
        visible={!!previewMemory}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewMemory(null)}
      >
        <View style={styles.previewOverlay}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

          <AnimatedTouchable
            style={styles.previewCloseButton}
            onPress={() => setPreviewMemory(null)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </AnimatedTouchable>

          {previewMemory && (
            <View style={styles.previewCard}>
              <Image
                source={{ uri: previewMemory.displayUrl || previewMemory.image_url }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>{previewMemory.title}</Text>
                <View style={styles.previewMetaPills}>
                  <View style={styles.previewPill}>
                    <Ionicons name="calendar-outline" size={13} color="#FFFFFF" />
                    <Text style={styles.previewDate}>
                      {formatFullDatePTBR(previewMemory.memory_date)}
                    </Text>
                  </View>
                  <View style={styles.previewPill}>
                    <Ionicons name="sparkles" size={12} color="#DDD6FE" />
                    <Text style={styles.previewSignature}>
                      Eternizado por {previewMemory.created_by === user?.id ? 'Você' : (profileMap.get(previewMemory.created_by || '')?.name || 'Parceiro(a)')}
                    </Text>
                  </View>
                </View>
                {previewMemory.created_at ? (
                  <Text style={styles.previewSavedAt}>
                    Salvo em {formatSavedAtDateTime(previewMemory.created_at)}
                  </Text>
                ) : null}
              </View>
            </View>
          )}
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

  // Skeleton Loading Shimmer
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 20,
  },
  skeletonCard: {
    width: '100%',
    height: 320,
    borderRadius: 28,
    borderWidth: 1,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(142, 124, 232, 0.08)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(142, 124, 232, 0.15)',
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  emptyGlassCard: {
    borderRadius: 32,
    padding: 36,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    width: '100%',
  },
  emptyIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 26,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.25)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themeTokens.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: themeTokens.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  memoryCard: {
    borderRadius: 28,
    padding: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: themeTokens.glassBorder,
    backgroundColor: themeTokens.glassSurface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: 250,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 124, 232, 0.08)',
  },
  cardContent: {
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 4,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(142, 124, 232, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.18)',
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: themeTokens.primary,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: themeTokens.textPrimary,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  floatingButtonWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 30,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  floatingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fabGlint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    borderRadius: 999,
  },
  floatingButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: isDark ? '#1C1A2E' : '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 20,
    maxHeight: '90%',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: themeTokens.glassBorder,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: themeTokens.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: themeTokens.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    marginBottom: 16,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: themeTokens.textPrimary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInput: {
    height: 52,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(142, 124, 232, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    color: themeTokens.textPrimary,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(142, 124, 232, 0.22)',
  },
  dateSelectorButton: {
    height: 52,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(142, 124, 232, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(142, 124, 232, 0.22)',
  },
  dateSelectorText: {
    fontSize: 15,
    fontWeight: '600',
    color: themeTokens.textPrimary,
  },
  pickerBox: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
  pickerDoneBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: themeTokens.primary,
  },
  pickerDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 18,
    marginBottom: 12,
  },
  modalCancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(104, 101, 120, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: themeTokens.textSecondary,
  },
  modalSaveButton: {
    flex: 2,
    height: 52,
    borderRadius: 999,
    backgroundColor: themeTokens.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  previewOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: themeTokens.glassBorder,
  },
  previewCard: {
    width: '90%',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 420,
    borderRadius: 24,
  },
  previewInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  previewDate: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  signatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.15)',
  },
  signatureAuthorText: {
    fontSize: 11,
    fontWeight: '700',
    color: themeTokens.primary,
  },
  savedAtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  savedAtText: {
    fontSize: 11,
    fontWeight: '500',
    color: themeTokens.textSecondary,
  },
  previewMetaPills: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  previewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  previewSignature: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DDD6FE',
  },
  previewSavedAt: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
});
