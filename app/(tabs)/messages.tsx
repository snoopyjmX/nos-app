import { logger } from '../../lib/logger';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  AppState,
  AppStateStatus,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { ZoomIn, FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AnimatedTouchable } from '../../components/AnimatedTouchable';
import { PressableScale } from '../../components/ui/PressableScale';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';
import { LiquidGlassView } from '../../components/ui/LiquidGlassView';
import { GlassSurface } from '../../components/ui/GlassSurface';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { useAppTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useTabBarHeight } from '../../hooks/useTabBarHeight';

interface Message {
  id: string;
  couple_id: string;
  created_by: string;
  content: string;
  created_at: string;
  sending?: boolean;
}

interface UserProfile {
  name: string;
  avatar_url?: string | null;
  push_token?: string | null;
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

const formatMessageTime = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const isSameDay = (date1Str?: string, date2Str?: string): boolean => {
  if (!date1Str || !date2Str) return false;
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const formatDaySeparator = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';

  const day = date.getDate();
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const monthName = months[date.getMonth()];
  if (date.getFullYear() === now.getFullYear()) {
    return `${day} de ${monthName}`;
  }
  return `${day} de ${monthName} de ${date.getFullYear()}`;
};

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);

  const { tabBarHeight } = useTabBarHeight();
  const [messages, setMessages] = useState<Message[]>([]);
  // Inicializa o mapa com os dados imediatos do usuário logado para evitar flashes
  const [profileMap, setProfileMap] = useState<Map<string, UserProfile>>(() => {
    const initialMap = new Map<string, UserProfile>();
    if (user) {
      initialMap.set(user.id, {
        name: getFirstName(user.user_metadata?.display_name || user.email?.split('@')[0]) || 'Você',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      });
    }
    return initialMap;
  });

  const PAGE_SIZE = 30;

  const reducedMotion = useReducedMotion();
  const initialMessageIdsRef = useRef<Set<string>>(new Set());

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [sending, setSending] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [visualKeyboardHeight, setVisualKeyboardHeight] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);
  const latestCreatedAtRef = useRef<string | null>(null);
  const isSyncingRef = useRef(false);
  const previousScrollHeightRef = useRef(0);
  const previousScrollYRef = useRef(0);
  const isPrependRef = useRef(false);
  const isInitialLoadDoneRef = useRef(false);

  // Monitora teclado nativo
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Monitora visualViewport no iOS Safari / Web PWA
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const vv = window.visualViewport;
    const handleViewportChange = () => {
      if (!vv) return;
      const offset = Math.max(0, window.innerHeight - vv.height);
      setVisualKeyboardHeight(offset);
      if (offset > 120) {
        setIsKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        setIsKeyboardVisible(false);
      }
    };

    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);

    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Resolve URL assinada ou pública para o avatar com tolerância a caminhos do Supabase Storage
  const resolveAvatarUrl = async (pathOrUrl?: string | null): Promise<string | null> => {
    if (!pathOrUrl) return null;
    const trimmed = pathOrUrl.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('file:') || trimmed.startsWith('data:')) {
      return trimmed;
    }

    // Se já é uma URL externa completa (Google OAuth, CDNs externos, etc.)
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
      // Ignora erro e tenta URL pública
    }

    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(cleanPath);
    return publicData?.publicUrl || trimmed;
  };

  // 1. Carrega os perfis dos integrantes para exibir a foto real do autor
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

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, push_token')
        .in('id', Array.from(userIds));

      if (error) {
        logger.warn('Erro ao carregar perfis:', error.message);
      }

      const map = new Map<string, UserProfile>(profileMap);

      if (profiles && profiles.length > 0) {
        await Promise.all(
          profiles.map(async (p) => {
            const currentUser = user;
            let finalAvatarUrl: string | null = null;
            if (p.avatar_url) {
              finalAvatarUrl = await resolveAvatarUrl(p.avatar_url);
            } else if (currentUser && p.id === currentUser.id && (currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture)) {
              finalAvatarUrl = currentUser.user_metadata.avatar_url || currentUser.user_metadata.picture || null;
            }

            if (p.id) {
              map.set(p.id, {
                name: getFirstName(p.display_name),
                avatar_url: finalAvatarUrl,
                push_token: (p as any).push_token || null,
              });
            }
          })
        );
      }

      setProfileMap(map);
    } catch (err) {
      logger.warn('Erro ao carregar perfis de mensagens:', err);
    }
  }, [coupleId, user]);

  // 2. Carrega inicialmente apenas as últimas 30 mensagens (order created_at desc + limit 30, invertidas para ordem cronológica)
  const loadInitialMessages = useCallback(async () => {
    if (!coupleId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('id, couple_id, created_by, content, created_at')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) throw error;

      if (data) {
        setHasMoreOlder(data.length >= PAGE_SIZE);

        const chronologic = [...data].reverse();
        chronologic.forEach((m) => initialMessageIdsRef.current.add(m.id));

        if (chronologic.length > 0) {
          latestCreatedAtRef.current = chronologic[chronologic.length - 1].created_at;
        }

        setMessages((prev) => {
          const tempOnes = prev.filter((m) => m.id.startsWith('temp-'));
          const fresh = [...chronologic];
          tempOnes.forEach((t) => {
            if (!fresh.some((m) => m.created_by === t.created_by && m.content === t.content)) {
              fresh.push(t);
            }
          });
          return fresh;
        });

        isInitialLoadDoneRef.current = false;
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
          isInitialLoadDoneRef.current = true;
        }, 120);
      }
    } catch (err: any) {
      logger.warn('Erro ao carregar mensagens iniciais:', err.message);
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

  // 3. Paginação reversa por cursor: ao rolar para o topo, busca mais 30 anteriores à mensagem mais antiga
  const loadOlderMessages = useCallback(async () => {
    if (!coupleId || loadingOlder || !hasMoreOlder || loading) return;

    const oldestMessage = messages.find((m) => !m.id.startsWith('temp-'));
    if (!oldestMessage) return;

    try {
      setLoadingOlder(true);
      isPrependRef.current = true;

      const { data, error } = await supabase
        .from('messages')
        .select('id, couple_id, created_by, content, created_at')
        .eq('couple_id', coupleId)
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) throw error;

      if (data) {
        if (data.length < PAGE_SIZE) {
          setHasMoreOlder(false);
        }

        if (data.length > 0) {
          const chronologicOlder = [...data].reverse();
          chronologicOlder.forEach((m) => initialMessageIdsRef.current.add(m.id));

          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newOlder = chronologicOlder.filter((m) => !existingIds.has(m.id));
            if (newOlder.length === 0) return prev;
            return [...newOlder, ...prev];
          });
        } else {
          isPrependRef.current = false;
        }
      }
    } catch (err: any) {
      logger.warn('Erro ao carregar mensagens anteriores:', err.message);
      isPrependRef.current = false;
    } finally {
      setLoadingOlder(false);
    }
  }, [coupleId, hasMoreOlder, loading, loadingOlder, messages]);

  // 4. Sincronização pós-suspensão (segundo plano / reconexão): busca apenas criadas após a última conhecida
  const syncMissedMessages = useCallback(async () => {
    if (!coupleId || isSyncingRef.current) return;
    const latestKnown = latestCreatedAtRef.current;
    if (!latestKnown) return;

    try {
      isSyncingRef.current = true;
      const { data, error } = await supabase
        .from('messages')
        .select('id, couple_id, created_by, content, created_at')
        .eq('couple_id', coupleId)
        .gt('created_at', latestKnown)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newItems = data.filter((m) => !existingIds.has(m.id));
          if (newItems.length === 0) return prev;

          latestCreatedAtRef.current = newItems[newItems.length - 1].created_at;

          let next = [...prev];
          newItems.forEach((freshMsg) => {
            const tempIndex = next.findIndex(
              (m) =>
                m.id.startsWith('temp-') &&
                m.created_by === freshMsg.created_by &&
                m.content === freshMsg.content
            );
            if (tempIndex !== -1) {
              next[tempIndex] = freshMsg;
            } else {
              next.push(freshMsg);
            }
          });
          return next;
        });

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 80);
      }
    } catch (err) {
      logger.warn('Erro ao sincronizar mensagens recentes:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, [coupleId]);

  // Monitora retorno ao foco para cobrir suspensão de WebSockets no iOS Safari PWA
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        syncMissedMessages();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    let handleVisibilityChange: (() => void) | null = null;
    let handleWindowFocus: (() => void) | null = null;

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          syncMissedMessages();
        }
      };
      handleWindowFocus = () => {
        syncMissedMessages();
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleWindowFocus);
    }

    return () => {
      appStateSub.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        if (handleVisibilityChange) {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
        if (handleWindowFocus) {
          window.removeEventListener('focus', handleWindowFocus);
        }
      }
    };
  }, [syncMissedMessages]);

  // 5. Subscription Realtime: inserções incrementais no estado com deduplicação (sem refazer consulta global)
  useEffect(() => {
    if (!coupleId) return;

    loadMemberProfiles();
    loadInitialMessages();

    const channel = supabase
      .channel(`messages_room_${coupleId}`, {
        config: {
          broadcast: { self: false },
        },
      })
      .on('broadcast', { event: 'new_message' }, (event) => {
        const incoming = event.payload as Message;
        if (!incoming || incoming.created_by === user?.id) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (incoming.created_at) {
          if (!latestCreatedAtRef.current || incoming.created_at > latestCreatedAtRef.current) {
            latestCreatedAtRef.current = incoming.created_at;
          }
        }

        setMessages((prev) => {
          if (
            prev.some(
              (m) =>
                m.id === incoming.id ||
                (m.created_by === incoming.created_by &&
                  m.content === incoming.content &&
                  Math.abs(new Date(m.created_at).getTime() - new Date(incoming.created_at).getTime()) < 6000)
            )
          ) {
            return prev;
          }
          return [...prev, incoming];
        });

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);
      })
      .on('broadcast', { event: 'message_confirmed' }, (event) => {
        const { tempId, confirmedMsg } = event.payload || {};
        if (confirmedMsg) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? (confirmedMsg as Message) : m))
          );
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (!newMsg || !newMsg.id) return;

          if (newMsg.created_at) {
            if (!latestCreatedAtRef.current || newMsg.created_at > latestCreatedAtRef.current) {
              latestCreatedAtRef.current = newMsg.created_at;
            }
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            if (newMsg.created_by === user?.id) {
              const tempIndex = prev.findIndex(
                (m) =>
                  m.id.startsWith('temp-') &&
                  m.created_by === newMsg.created_by &&
                  m.content === newMsg.content
              );
              if (tempIndex !== -1) {
                const next = [...prev];
                next[tempIndex] = newMsg;
                return next;
              }
            }

            return [...prev, newMsg];
          });

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 80);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          loadMemberProfiles();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          syncMissedMessages();
        }
      });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [coupleId, loadInitialMessages, loadMemberProfiles, syncMissedMessages, user?.id]);

  // 6. Envia mensagem instantaneamente com atualização otimista (ZERO DELAY)
  const handleSendMessage = async () => {
    const contentToSend = inputText.trim();
    if (!contentToSend || !user || !coupleId || sending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setInputText('');

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMsg: Message = {
      id: tempId,
      couple_id: coupleId,
      created_by: user.id,
      content: contentToSend,
      created_at: new Date().toISOString(),
      sending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: optimisticMsg,
      });
    }

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 40);

    setSending(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          couple_id: coupleId,
          created_by: user.id,
          content: contentToSend,
        })
        .select('id, couple_id, created_by, content, created_at')
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        if (!latestCreatedAtRef.current || data.created_at > latestCreatedAtRef.current) {
          latestCreatedAtRef.current = data.created_at;
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...(data as Message), sending: false } : m))
        );

        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'message_confirmed',
            payload: { tempId, confirmedMsg: data },
          });
        }
      }

      // 3. Dispara push notification para o parceiro em segundo plano
      const currentUserProfile = profileMap.get(user.id);
      const partnerId = Array.from(profileMap.keys()).find((id) => id !== user.id);
      if (partnerId) {
        const partnerProfile = profileMap.get(partnerId);
        if (partnerProfile?.push_token) {
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
              body: `Tem um novo recado carinhoso de ${currentUserProfile?.name || 'seu amor'} ❤️`,
              data: { url: '/messages' },
            }),
          }).catch((err) => logger.warn('Push error:', err));
        }
      }
    } catch (err: any) {
      logger.warn('Erro ao salvar mensagem:', err);
      // Em caso de falha de conexão, remove a mensagem otimista e devolve o texto
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(contentToSend);
      Alert.alert('Erro ao enviar', 'Não foi possível entregar o seu bilhete. Verifique sua conexão.');
    } finally {
      setSending(false);
    }
  };

  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset } = event.nativeEvent;
      previousScrollYRef.current = contentOffset.y;
      if (
        contentOffset.y <= 50 &&
        hasMoreOlder &&
        !loadingOlder &&
        !loading &&
        isInitialLoadDoneRef.current
      ) {
        loadOlderMessages();
      }
    },
    [hasMoreOlder, loading, loadingOlder, loadOlderMessages]
  );

  const handleContentSizeChange = useCallback(
    (_newWidth: number, newHeight: number) => {
      if (isPrependRef.current) {
        const deltaY = newHeight - previousScrollHeightRef.current;
        if (deltaY > 0) {
          flatListRef.current?.scrollToOffset({
            offset: previousScrollYRef.current + deltaY,
            animated: false,
          });
        }
        isPrependRef.current = false;
      }
      previousScrollHeightRef.current = newHeight;
    },
    []
  );

  const handleGoBack = () => {
    Keyboard.dismiss();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const renderMessageItem = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.created_by === user?.id;
    const authorProfile = profileMap.get(item.created_by);
    const isSending = item.sending || item.id.startsWith('temp-');

    // Day separator check
    const prevItem = index > 0 ? messages[index - 1] : null;
    const showDaySeparator = !prevItem || !isSameDay(prevItem.created_at, item.created_at);
    const dayLabel = showDaySeparator ? formatDaySeparator(item.created_at) : '';

    // Grouping check
    const nextItem = index < messages.length - 1 ? messages[index + 1] : null;
    const isLastInGroup =
      !nextItem ||
      nextItem.created_by !== item.created_by ||
      !isSameDay(item.created_at, nextItem.created_at);

    const avatarUri =
      authorProfile?.avatar_url ||
      (isMe ? user?.user_metadata?.avatar_url || user?.user_metadata?.picture : null);

    const avatar = (
      <View
        style={[
          styles.avatarContainer,
          {
            backgroundColor: isDark
              ? 'rgba(157, 146, 240, 0.15)'
              : 'rgba(124, 111, 224, 0.12)',
            borderColor: isMe
              ? themeTokens.primary
              : isDark
              ? 'rgba(157, 146, 240, 0.4)'
              : 'rgba(124, 111, 224, 0.35)',
          },
        ]}
      >
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <LinearGradient
              colors={
                isMe
                  ? [themeTokens.primary, themeTokens.primaryDark]
                  : isDark
                  ? ['#9D92F0', '#F7A6BB']
                  : ['#EFECFC', '#FDEEF2']
              }
              style={StyleSheet.absoluteFill}
            />
            <Ionicons
              name="person"
              size={14}
              color={isMe ? '#FFFFFF' : themeTokens.primary}
            />
          </View>
        )}
      </View>
    );

    const isNew = isInitialLoadDoneRef.current && !initialMessageIdsRef.current.has(item.id);
    const balloonEntering = isNew
      ? (reducedMotion ? FadeIn.duration(150) : ZoomIn.duration(220))
      : undefined;

    return (
      <View>
        {showDaySeparator && (
          <View style={styles.daySeparatorContainer}>
            <View
              style={[
                styles.daySeparatorChip,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(124, 111, 224, 0.08)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(124, 111, 224, 0.15)',
                },
              ]}
            >
              <Text
                style={[
                  styles.daySeparatorText,
                  { color: themeTokens.textSecondary, fontFamily: 'Nunito_600SemiBold' },
                ]}
              >
                {dayLabel}
              </Text>
            </View>
          </View>
        )}

        <View
          style={[
            styles.messageRow,
            isMe ? styles.messageRowMe : styles.messageRowPartner,
            { marginBottom: isLastInGroup ? 12 : 3 },
          ]}
        >
          {!isMe && (isLastInGroup ? avatar : <View style={styles.avatarSpacer} />)}

          {isMe ? (
            <Animated.View
              entering={balloonEntering}
              style={[
                styles.messageBubble,
                styles.bubbleMe,
                !isLastInGroup && { borderBottomRightRadius: 20 },
                isSending && styles.bubbleSending,
              ]}
            >
              <LinearGradient
                colors={isDark ? ['#9D92F0', '#7C6FE0'] : ['#7C6FE0', '#6358D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.messageTextMe}>{item.content}</Text>
              <Text style={styles.messageTimeMe}>
                {isSending ? 'enviando...' : formatMessageTime(item.created_at)}
              </Text>
            </Animated.View>
          ) : (
            <Animated.View
              entering={balloonEntering}
              style={[
                styles.messageBubble,
                styles.bubblePartner,
                !isLastInGroup && { borderBottomLeftRadius: 20 },
                {
                  backgroundColor: isDark ? themeTokens.surface : '#FFFFFF',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(124, 111, 224, 0.15)',
                },
              ]}
            >
              <Text style={[styles.messageTextPartner, { color: themeTokens.textPrimary }]}>
                {item.content}
              </Text>
              <Text style={[styles.messageTimePartner, { color: themeTokens.textSecondary }]}>
                {formatMessageTime(item.created_at)}
              </Text>
            </Animated.View>
          )}

          {isMe && (isLastInGroup ? avatar : <View style={styles.avatarSpacer} />)}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeTokens.background }]}>
      <AtmosphereBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.keyboardAvoid}
      >
        {/* Messages Area */}
        <View style={styles.contentFlex}>
          {loading ? (
            <View style={[styles.skeletonChat, { paddingTop: insets.top + (Platform.OS === 'ios' ? 70 : 66) }]}>
              {[
                { align: 'left' as const, w: '65%' },
                { align: 'right' as const, w: '60%' },
                { align: 'left' as const, w: '55%' },
                { align: 'right' as const, w: '70%' },
              ].map((s, i) => (
                <View
                  key={i}
                  style={[
                    s.align === 'left' ? styles.skeletonLeft : styles.skeletonRight,
                    {
                      width: s.w as any,
                      backgroundColor:
                        s.align === 'right'
                          ? isDark
                            ? 'rgba(167,151,255,0.15)'
                            : 'rgba(142,124,232,0.2)'
                          : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(255,255,255,0.55)',
                      borderColor: isDark
                        ? themeTokens.glassBorder
                        : 'rgba(255,255,255,0.7)',
                    },
                  ]}
                />
              ))}
            </View>
          ) : messages.length === 0 ? (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={[styles.centerContainer, { paddingTop: insets.top + 80 }]}>
                <View
                  style={[
                    styles.emptyCard,
                    {
                      backgroundColor: isDark ? themeTokens.surface : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.15)',
                    },
                  ]}
                >
                  <EmptyState
                    icon="mail-open-outline"
                    title="Nenhum bilhete ainda"
                    subtitle="Surpreenda seu amor deixando o primeiro recado carinhoso aqui. Cada mensagem fica guardada com carinho."
                    compact
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessageItem}
              contentContainerStyle={[
                styles.listContent,
                {
                  paddingTop: insets.top + (Platform.OS === 'ios' ? 70 : 66),
                  paddingBottom: 16,
                },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onContentSizeChange={handleContentSizeChange}
              maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
              ListHeaderComponent={
                loadingOlder ? (
                  <View style={styles.loadingOlderContainer}>
                    <ActivityIndicator size="small" color={themeTokens.primary} />
                  </View>
                ) : null
              }
            />
          )}
        </View>

        {/* Header fixo com GlassSurface - mensagens passam por trás */}
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
                backgroundColor: isDark ? 'rgba(21, 18, 42, 0.72)' : 'rgba(248, 246, 254, 0.75)',
                borderBottomWidth: 1,
                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
              },
            ]}
          />
          <View style={styles.headerContentRow}>
            <PressableScale
              style={[
                styles.headerBackButton,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.08)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(124, 111, 224, 0.15)',
                },
              ]}
              onPress={handleGoBack}
              accessibilityLabel="Voltar"
            >
              <Ionicons name="arrow-back" size={20} color={themeTokens.textPrimary} />
            </PressableScale>

            <View style={styles.headerBrandWrapper}>
              <Text style={[styles.headerBrandTitle, { color: themeTokens.primary }]}>nós.</Text>
              <Text
                style={[styles.headerCoupleSubtitle, { color: themeTokens.textSecondary }]}
                numberOfLines={2}
              >
                Bilhetes carinhosos do casal
              </Text>
            </View>
          </View>
        </View>

        {/* Barra de Input fixa com GlassSurface na base */}
        <View
          style={[
            styles.blurredInputContainer,
            {
              paddingBottom: isKeyboardVisible
                ? (Platform.OS === 'ios' ? 10 : 12)
                : tabBarHeight + 10,
              marginBottom: Platform.OS === 'web' ? visualKeyboardHeight : 0,
            },
          ]}
        >
          <GlassSurface
            intensity={Platform.OS === 'ios' ? 80 : 100}
            tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark ? 'rgba(21, 18, 42, 0.75)' : 'rgba(248, 246, 254, 0.80)',
                borderTopWidth: 1,
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
              },
            ]}
          />
          <View style={styles.inputInnerRow}>
            <View
              style={[
                styles.textInputPill,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : '#FFFFFF',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.14)'
                    : 'rgba(124, 111, 224, 0.20)',
                },
              ]}
            >
              <TextInput
                style={[styles.textInput, { color: themeTokens.textPrimary }]}
                placeholder="Escreva um recado com carinho..."
                placeholderTextColor={themeTokens.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
                textAlignVertical="center"
              />
            </View>

            <PressableScale
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || sending}
              accessibilityLabel="Enviar bilhete"
            >
              <LinearGradient
                colors={
                  !inputText.trim() || sending
                    ? [isDark ? '#2A2545' : '#EFECFC', isDark ? '#2A2545' : '#EFECFC']
                    : ['#7C6FE0', '#F58FA8']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons
                name="paper-plane"
                size={16}
                color={!inputText.trim() || sending ? (isDark ? '#5B5675' : '#AAA5B8') : '#FFFFFF'}
                style={{ marginLeft: 2 }}
              />
            </PressableScale>
          </View>
        </View>
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
  blurredHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    overflow: 'hidden',
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 12,
    gap: 12,
  },
  headerBackButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  headerBrandWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  headerBrandTitle: {
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  headerCoupleSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  contentFlex: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  /* ── Skeleton ── */
  skeletonChat: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 14,
  },
  skeletonLeft: {
    height: 48,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  skeletonRight: {
    height: 48,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
    borderWidth: 1,
  },

  /* ── Empty State ── */
  emptyCard: {
    padding: 28,
    alignItems: 'center',
    width: '100%',
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },

  /* ── Messages List ── */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  daySeparatorContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  daySeparatorChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  daySeparatorText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowPartner: {
    justifyContent: 'flex-start',
  },

  /* ── Avatars ── */
  avatarContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  avatarSpacer: {
    width: 30,
    marginHorizontal: 6,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Bubbles ── */
  messageBubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleMe: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 6,
    overflow: 'hidden',
    shadowColor: '#7C6FE0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  bubblePartner: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  messageTextMe: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 21,
    fontWeight: '500',
  },
  messageTextPartner: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  messageTimeMe: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    alignSelf: 'flex-end',
    fontWeight: '500',
  },
  messageTimePartner: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontWeight: '500',
  },

  /* ── Input Bar com Blur ── */
  blurredInputContainer: {
    zIndex: 20,
    overflow: 'hidden',
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  textInputPill: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    paddingVertical: 8,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C6FE0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingOlderContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleSending: {
    opacity: 0.75,
  },
});

