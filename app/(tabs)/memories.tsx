import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  View,
  Text,
  StyleSheet,
  FlatList,
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
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  LinearTransition,
  useReducedMotion,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AnimatedTouchable } from '../../components/AnimatedTouchable';
import { PressableScale } from '../../components/ui/PressableScale';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';
import { LiquidGlassView } from '../../components/ui/LiquidGlassView';
import { GlassSurface } from '../../components/ui/GlassSurface';
import { EmptyState } from '../../components/ui/EmptyState';
import { AppHeader } from '../../components/AppHeader';
import { useToast } from '../../context/ToastContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { supabase } from '../../lib/supabase';
import { THEME } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../constants/theme';
import { useTabBarHeight } from '../../hooks/useTabBarHeight';

interface MemoryItem {
  id: string;
  couple_id: string;
  title: string;
  memory_date: string;
  image_url: string;
  thumb_path?: string | null;
  displayUrl?: string;
  displayThumbUrl?: string;
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
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];

  const firstLower = parts[0].toLowerCase();
  // Nomes compostos comuns no Brasil que devem ser preservados juntos (ex: Maria Luiza, João Pedro)
  const compoundFirst = ['maria', 'joao', 'joão', 'ana', 'pedro', 'vitor', 'victor', 'luiz', 'luís', 'luis'];
  if (compoundFirst.includes(firstLower) && parts.length > 1) {
    return `${parts[0]} ${parts[1]}`;
  }

  return parts[0];
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

const PAGE_SIZE = 20;

interface CacheEntry {
  url: string;
  expiresAt: number;
}

// Cache em memória para URLs assinadas (evita re-assinar a cada render e persiste entre trocas de aba)
const signedUrlCache = new Map<string, CacheEntry>();

const sanitizeStoragePath = (pathString?: string | null): string => {
  if (!pathString) return '';
  let cleanPath = pathString.trim();
  if (
    cleanPath.startsWith('file:') ||
    cleanPath.startsWith('data:') ||
    cleanPath.startsWith('blob:')
  ) {
    return cleanPath;
  }
  if (cleanPath.includes('/memories/')) {
    cleanPath = cleanPath.split('/memories/')[1].split('?')[0];
  }
  return cleanPath.replace(/^\/+/, '');
};

const isSignableStoragePath = (path: string): boolean => {
  if (!path) return false;
  if (
    path.startsWith('file:') ||
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return false;
  }
  return true;
};

// Batch signing: 1 única chamada createSignedUrls (plural) por página com expiração razoável (1h) e fallback individual
const resolveBatchMemoryUrls = async (items: MemoryItem[]): Promise<MemoryItem[]> => {
  const now = Date.now();
  const pathsToSignSet = new Set<string>();

  for (const item of items) {
    const mainPath = sanitizeStoragePath(item.image_url);
    const thumbPath = sanitizeStoragePath(item.thumb_path || item.image_url);

    if (isSignableStoragePath(mainPath)) {
      const cached = signedUrlCache.get(mainPath);
      if (!cached || cached.expiresAt <= now + 60000) {
        pathsToSignSet.add(mainPath);
      }
    }

    if (isSignableStoragePath(thumbPath)) {
      const cached = signedUrlCache.get(thumbPath);
      if (!cached || cached.expiresAt <= now + 60000) {
        pathsToSignSet.add(thumbPath);
      }
    }
  }

  const pathsToSign = Array.from(pathsToSignSet);

  if (pathsToSign.length > 0) {
    try {
      const { data: signedData, error: signError } = await supabase.storage
        .from('memories')
        .createSignedUrls(pathsToSign, 3600);

      if (!signError && signedData) {
        const expiresAt = Date.now() + 3500 * 1000;
        signedData.forEach((result) => {
          if (result.path && result.signedUrl) {
            signedUrlCache.set(result.path, { url: result.signedUrl, expiresAt });
          }
        });
      }
    } catch {
      // Ignora falha no lote
    }
  }

  // Resolve para cada item garantindo fallback se o lote não tiver assinado
  return Promise.all(
    items.map(async (item) => {
      const mainPath = sanitizeStoragePath(item.image_url);
      const thumbPath = sanitizeStoragePath(item.thumb_path || item.image_url);

      let displayUrl = mainPath;
      if (isSignableStoragePath(mainPath)) {
        const cached = signedUrlCache.get(mainPath);
        if (cached?.url) {
          displayUrl = cached.url;
        } else {
          try {
            const { data } = await supabase.storage.from('memories').createSignedUrl(mainPath, 3600);
            if (data?.signedUrl) {
              signedUrlCache.set(mainPath, { url: data.signedUrl, expiresAt: Date.now() + 3500 * 1000 });
              displayUrl = data.signedUrl;
            }
          } catch {
            displayUrl = item.image_url;
          }
        }
      }

      let displayThumbUrl = thumbPath;
      if (isSignableStoragePath(thumbPath)) {
        const cached = signedUrlCache.get(thumbPath);
        if (cached?.url) {
          displayThumbUrl = cached.url;
        } else if (thumbPath === mainPath && displayUrl) {
          displayThumbUrl = displayUrl;
        } else {
          try {
            const { data } = await supabase.storage.from('memories').createSignedUrl(thumbPath, 3600);
            if (data?.signedUrl) {
              signedUrlCache.set(thumbPath, { url: data.signedUrl, expiresAt: Date.now() + 3500 * 1000 });
              displayThumbUrl = data.signedUrl;
            }
          } catch {
            displayThumbUrl = displayUrl;
          }
        }
      }

      return {
        ...item,
        displayUrl: displayUrl || item.image_url,
        displayThumbUrl: displayThumbUrl || displayUrl || item.image_url,
      };
    })
  );
};

export default function MemoriesScreen() {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const styles = getStyles(themeTokens, isDark);
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const insets = useSafeAreaInsets();
  const { tabBarHeight } = useTabBarHeight();
  const reducedMotion = useReducedMotion();
  const { showToast } = useToast();
  const pendingDeleteRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    return () => {
      pendingDeleteRef.current.forEach((timer) => clearTimeout(timer));
      pendingDeleteRef.current.clear();
    };
  }, []);
  const [profileMap, setProfileMap] = useState<Map<string, MemberProfile>>(new Map());

  // Estados para Adicionar Memória
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
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

  // 1. Carrega primeira página (20 itens) com assinatura batch e cache
  const loadMemories = useCallback(async (silent = false) => {
    if (!coupleId) return;

    try {
      if (!silent) setLoading(true);

      let { data, error } = await supabase
        .from('memories')
        .select('id, couple_id, title, memory_date, image_url, thumb_path, created_at, created_by')
        .eq('couple_id', coupleId)
        .order('memory_date', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGE_SIZE);

      if (error && (error.code === '42703' || error.message?.includes('thumb_path'))) {
        const fallback = await supabase
          .from('memories')
          .select('id, couple_id, title, memory_date, image_url, created_at, created_by')
          .eq('couple_id', coupleId)
          .order('memory_date', { ascending: false })
          .order('id', { ascending: false })
          .limit(PAGE_SIZE);
        data = (fallback.data as any) || null;
        error = fallback.error;
      }

      if (error) {
        throw error;
      }

      const rawList = data || [];
      setHasMore(rawList.length === PAGE_SIZE);

      const resolvedList = await resolveBatchMemoryUrls(rawList);

      setMemories((prevList) => {
        const optimisticItems = prevList.filter(
          (p) => p.id.startsWith('local-') && !resolvedList.some((n) => n.image_url === p.image_url)
        );
        const mergedList = resolvedList.map((newItem) => {
          const localMatch = prevList.find(
            (p) => (p.image_url === newItem.image_url || (p.title === newItem.title && p.memory_date === newItem.memory_date)) &&
                   p.displayUrl &&
                   (p.displayUrl.startsWith('file:') || p.displayUrl.startsWith('data:') || p.displayUrl.startsWith('blob:'))
          );
          if (localMatch && (!newItem.displayUrl || !newItem.displayUrl.startsWith('http'))) {
            return {
              ...newItem,
              displayUrl: localMatch.displayUrl,
              displayThumbUrl: localMatch.displayThumbUrl || localMatch.displayUrl,
            };
          }
          return newItem;
        });
        return [...optimisticItems, ...mergedList];
      });
    } catch (err) {
      console.warn('Erro ao carregar memórias:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [coupleId]);

  // 2. Carrega mais memórias por cursor (memory_date + id) ao aproximar-se do fim da lista
  const loadMoreMemories = useCallback(async () => {
    if (!coupleId || loading || loadingMore || !hasMore) return;

    const lastPersisted = [...memories].reverse().find((m) => !m.id.startsWith('local-'));
    if (!lastPersisted) return;

    try {
      setLoadingMore(true);

      const lastDate = lastPersisted.memory_date;
      const lastId = lastPersisted.id;

      let { data, error } = await supabase
        .from('memories')
        .select('id, couple_id, title, memory_date, image_url, thumb_path, created_at, created_by')
        .eq('couple_id', coupleId)
        .or(`memory_date.lt.${lastDate},and(memory_date.eq.${lastDate},id.lt.${lastId})`)
        .order('memory_date', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGE_SIZE);

      if (error && (error.code === '42703' || error.message?.includes('thumb_path'))) {
        const fallback = await supabase
          .from('memories')
          .select('id, couple_id, title, memory_date, image_url, created_at, created_by')
          .eq('couple_id', coupleId)
          .or(`memory_date.lt.${lastDate},and(memory_date.eq.${lastDate},id.lt.${lastId})`)
          .order('memory_date', { ascending: false })
          .order('id', { ascending: false })
          .limit(PAGE_SIZE);
        data = (fallback.data as any) || null;
        error = fallback.error;
      }

      if (error) {
        throw error;
      }

      const rawList = data || [];
      if (rawList.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (rawList.length > 0) {
        const resolvedList = await resolveBatchMemoryUrls(rawList);

        setMemories((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueNew = resolvedList.filter((m) => !existingIds.has(m.id));
          return [...prev, ...uniqueNew];
        });
      }
    } catch {
      // Falha silenciosa
    } finally {
      setLoadingMore(false);
    }
  }, [coupleId, loading, loadingMore, hasMore, memories]);

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
          loadMemories(true);
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
    setHasMore(true);
    await Promise.all([loadMemories(true), loadMemberProfiles()]);
    setRefreshing(false);
  };

  // Exclusão de memória com confirmação e timer de 5s para Desfazer
  const handleDeleteMemory = useCallback(
    (item: MemoryItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        'Remover memória',
        `Tem certeza que deseja excluir "${item.title}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: () => {
              setPreviewMemory(null);
              const removedItem = item;
              // Remoção otimista com LinearTransition na lista
              setMemories((prev) => prev.filter((m) => m.id !== item.id));

              // Timer de 5s para confirmação no banco de dados
              const timer = setTimeout(async () => {
                pendingDeleteRef.current.delete(item.id);
                try {
                  const { error } = await supabase
                    .from('memories')
                    .delete()
                    .eq('id', item.id);

                  if (error) throw error;
                } catch (err: any) {
                  showToast({
                    message: 'Não conseguimos remover agora. Tente de novo?',
                    type: 'error',
                  });
                  loadMemories(true);
                }
              }, 5000);

              pendingDeleteRef.current.set(item.id, timer);

              // Exibe toast afetuoso com botão "Desfazer"
              showToast({
                message: `"${item.title}" removida`,
                actionLabel: 'Desfazer',
                duration: 5000,
                onAction: () => {
                  const activeTimer = pendingDeleteRef.current.get(item.id);
                  if (activeTimer) {
                    clearTimeout(activeTimer);
                    pendingDeleteRef.current.delete(item.id);
                  }
                  setMemories((prev) => [removedItem, ...prev]);
                },
              });
            },
          },
        ]
      );
    },
    [showToast, loadMemories]
  );

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
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImageUri(asset.uri);
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
    if (uploading) return;

    if (!memoryTitle.trim()) {
      Alert.alert('Atenção', 'Por favor, dê um título carinhoso para esta memória.');
      return;
    }

    if (!selectedImageUri || !coupleId || !user?.id) return;

    setUploading(true);

    try {
      const timestamp = Date.now();
      const fileName = `${coupleId}/${timestamp}.jpg`;
      const thumbFileName = `${coupleId}/${timestamp}_thumb.jpg`;

      // 1. Redimensiona imagem principal para largura máxima de 1080px (preserva proporção)
      const mainManipulated = await manipulateAsync(
        selectedImageUri,
        [{ resize: { width: 1080 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      // 2. Gera thumbnail de ~400px de largura para carregar com leveza na listagem
      const thumbManipulated = await manipulateAsync(
        selectedImageUri,
        [{ resize: { width: 400 } }],
        { compress: 0.75, format: SaveFormat.JPEG }
      );

      // 3. Converte URIs manipulados em Blob nativo sem passar por strings base64
      const [mainRes, thumbRes] = await Promise.all([
        fetch(mainManipulated.uri),
        fetch(thumbManipulated.uri),
      ]);
      const [mainBlob, thumbBlob] = await Promise.all([
        mainRes.blob(),
        thumbRes.blob(),
      ]);

      // 4. Envia imagem principal e thumbnail ao Storage
      const { error: mainUploadError } = await supabase.storage
        .from('memories')
        .upload(fileName, mainBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (mainUploadError) {
        throw new Error(mainUploadError.message);
      }

      const { error: thumbUploadError } = await supabase.storage
        .from('memories')
        .upload(thumbFileName, thumbBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      const finalThumbPath = thumbUploadError ? null : thumbFileName;

      const year = memoryDate.getFullYear();
      const month = String(memoryDate.getMonth() + 1).padStart(2, '0');
      const day = String(memoryDate.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;

      let { error: insertError } = await supabase.from('memories').insert({
        couple_id: coupleId,
        created_by: user.id,
        title: memoryTitle.trim(),
        memory_date: isoDate,
        image_url: fileName,
        thumb_path: finalThumbPath,
      });

      if (insertError && (insertError.code === '42703' || insertError.message?.includes('thumb_path'))) {
        const retry = await supabase.from('memories').insert({
          couple_id: coupleId,
          created_by: user.id,
          title: memoryTitle.trim(),
          memory_date: isoDate,
          image_url: fileName,
        });
        insertError = retry.error;
      }

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
      const optimisticMemory: MemoryItem = {
        id: `local-${timestamp}`,
        couple_id: coupleId,
        created_by: user.id,
        title: memoryTitle.trim(),
        memory_date: isoDate,
        image_url: fileName,
        thumb_path: finalThumbPath,
        displayUrl: mainManipulated.uri,
        displayThumbUrl: thumbManipulated.uri,
        created_at: new Date().toISOString(),
      };
      setMemories((prev) => [optimisticMemory, ...prev]);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAddModalVisible(false);
      setSelectedImageUri(null);
      setMemoryTitle('');

      await loadMemories(true);
    } catch (err: any) {
      Alert.alert('Não conseguimos salvar agora', err.message || 'Tenta de novo?');
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
    const imageUrl = item.displayThumbUrl || item.displayUrl || item.image_url;
    const authorProfile = item.created_by ? profileMap.get(item.created_by) : undefined;
    const isMe = item.created_by === user?.id;
    const authorName = isMe
      ? 'Você'
      : authorProfile?.name || 'Parceiro(a)';
    const isHero = index === 0;

    return (
      <Animated.View
        layout={reducedMotion ? undefined : LinearTransition.duration(250)}
        style={styles.cardWrapper}
      >
        <PressableScale
          onPress={() => setPreviewMemory(item)}
          onLongPress={() => handleDeleteMemory(item)}
          activeOpacity={0.94}
        >
          <View style={[styles.memoryCard, isHero && styles.heroMemoryCard]}>
            <Image
              source={{ uri: imageUrl }}
              style={[styles.cardImage, isHero && styles.heroCardImage]}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              recyclingKey={item.id}
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
                  <Ionicons name="sparkles" size={11} color={themeTokens.accent} />
                  <Text style={styles.signatureAuthorText} numberOfLines={1}>
                    Eternizado por {authorName}
                  </Text>
                </View>
              </View>

              <Text style={[styles.cardTitle, isHero && styles.heroCardTitle]} numberOfLines={2}>
                {item.title}
              </Text>

              {item.created_at ? (
                <View style={styles.savedAtRow}>
                  <Ionicons name="time-outline" size={12} color={themeTokens.textSecondary} />
                  <Text style={styles.savedAtText}>
                    Salvo em {formatSavedAtDateTime(item.created_at)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </PressableScale>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Fundo Atmosférico Vivo preenchendo 100% da viewport física */}
      <AtmosphereBackground />

      {/* Conteúdo Principal */}
      {loading ? (
        <View style={[styles.skeletonContainer, { paddingTop: insets.top + (Platform.OS === 'ios' ? 70 : 66) }]}>
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
        </View>
      ) : memories.length === 0 ? (
        <ScrollView
          contentContainerStyle={[styles.centerContainer, { paddingTop: insets.top + 80 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeTokens.primary}
              colors={[themeTokens.primary]}
            />
          }
        >
          <View style={styles.emptyCard}>
            <EmptyState
              icon="images-outline"
              title="Ainda não temos memórias por aqui"
              subtitle="Que tal criar a primeira e eternizar um momento especial de vocês?"
              actionLabel="Criar primeira memória"
              onAction={handlePickImage}
            />
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={memories}
          keyExtractor={(item) => item.id}
          renderItem={renderMemoryCard}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingTop: insets.top + (Platform.OS === 'ios' ? 70 : 66),
              paddingBottom: tabBarHeight + 90,
            },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onEndReached={loadMoreMemories}
          onEndReachedThreshold={0.5}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={themeTokens.primary} />
              </View>
            ) : null
          }
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
            sectionTitle="nós."
            coupleSubtitle="Nossos momentos eternizados"
            containerStyle={{ marginBottom: 0, paddingTop: 6, paddingBottom: 6 }}
          />
        </View>
      </View>

      {/* Botão Flutuante de Adicionar Memória */}
      <View
        style={[
          styles.floatingButtonWrapper,
          {
            bottom: tabBarHeight + 16,
          },
        ]}
      >
        <PressableScale
          onPress={handlePickImage}
          activeOpacity={0.88}
          accessibilityLabel="Adicionar nova memória"
        >
          <LinearGradient
            colors={['#7C6FE0', '#F58FA8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.floatingButtonGradient}
          >
            <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
            <Text style={styles.floatingButtonText}>Adicionar Memória</Text>
          </LinearGradient>
        </PressableScale>
      </View>

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
                  contentFit="cover"
                  transition={200}
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

      {/* Modal de Visualização Ampliada da Foto */}
      <Modal
        visible={!!previewMemory}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewMemory(null)}
      >
        <View style={styles.previewOverlay}>
          {/* Fundo escuro com opacidade que fecha ao toque em qualquer lugar fora */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setPreviewMemory(null)}
          />

          <View style={styles.previewTopActionsRow} pointerEvents="box-none">
            {previewMemory && (
              <TouchableOpacity
                style={[styles.previewActionCircle, { marginRight: 12 }]}
                onPress={() => handleDeleteMemory(previewMemory)}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                accessibilityLabel="Remover memória"
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color="#F58FA8" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.previewActionCircle}
              onPress={() => setPreviewMemory(null)}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              accessibilityLabel="Fechar visualização"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {previewMemory && (
            <View style={styles.previewCard}>
              <Image
                source={{ uri: previewMemory.displayUrl || previewMemory.image_url }}
                style={styles.previewImage}
                contentFit="contain"
                transition={200}
                cachePolicy="memory-disk"
                placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.88)']}
                style={styles.previewInfo}
              >
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
              </LinearGradient>
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
  emptyCard: {
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeTokens.glassBorder,
    backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
    shadowColor: themeTokens.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    width: '100%',
  },
  emptyIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.25)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
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
  emptyAddButton: {
    marginTop: 20,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: themeTokens.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyAddButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  emptyAddButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  cardWrapper: {
    marginBottom: 20,
  },
  memoryCard: {
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: themeTokens.glassBorder,
    backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
    shadowColor: themeTokens.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  heroMemoryCard: {
    borderRadius: 28,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(124, 111, 224, 0.20)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 124, 232, 0.08)',
  },
  heroCardImage: {
    height: 290,
    borderRadius: 22,
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
    backgroundColor: isDark ? 'rgba(142, 124, 232, 0.16)' : 'rgba(142, 124, 232, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(142, 124, 232, 0.28)' : 'rgba(142, 124, 232, 0.18)',
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
  heroCardTitle: {
    fontSize: 21,
    lineHeight: 28,
  },
  floatingButtonWrapper: {
    position: 'absolute',
    right: 20,
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
    paddingVertical: 13,
    paddingHorizontal: 20,
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
    backgroundColor: 'rgba(10, 8, 22, 0.94)',
  },
  previewTopActionsRow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
  },
  previewActionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
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
