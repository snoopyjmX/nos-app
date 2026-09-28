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
} from 'react-native';

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedTouchable } from '../../components/AnimatedTouchable';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';
import { LiquidGlassView } from '../../components/ui/LiquidGlassView';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { useAppTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  couple_id: string;
  created_by: string;
  content: string;
  created_at: string;
}

interface UserProfile {
  name: string;
  avatar_url?: string | null;
  push_token?: string | null;
}

const getFirstName = (name?: string | null): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
};

const formatMessageTime = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);

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

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);



  // Monitora teclado para scroll automático e ajuste de espaçamento
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
        console.warn('Erro ao carregar perfis:', error.message);
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
      console.warn('Erro ao carregar perfis de mensagens:', err);
    }
  }, [coupleId, user]);

  // 2. Carrega as mensagens do casal em ordem cronológica
  const loadMessages = useCallback(async (silent = false) => {
    if (!coupleId) return;

    try {
      if (!silent) setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('id, couple_id, created_by, content, created_at')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        setMessages((prev) => {
          // Preserva mensagens temporárias em envio que ainda não estejam no banco
          const tempOnes = prev.filter((m) => m.id.startsWith('temp-'));
          const fresh = [...data];
          tempOnes.forEach((t) => {
            if (!fresh.some((m) => m.created_by === t.created_by && m.content === t.content)) {
              fresh.push(t);
            }
          });
          return fresh;
        });
      }
    } catch (err: any) {
      console.warn('Erro ao carregar mensagens:', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) return;

    loadMemberProfiles();
    loadMessages();

    // 3. Subscription do Supabase Realtime com DUAL CANAL: Broadcast (instantâneo ~50ms) + Postgres Changes (confirmação no DB)
    const channel = supabase
      .channel(`messages_room_${coupleId}`, {
        config: {
          broadcast: { self: false },
        },
      })
      // Recebe mensagem peer-to-peer via WebSocket instantaneamente sem esperar commit do Postgres
      .on('broadcast', { event: 'new_message' }, (event) => {
        const incoming = event.payload as Message;
        if (!incoming || incoming.created_by === user?.id) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      // Substitui o tempId quando confirmado pelo banco
      .on('broadcast', { event: 'message_confirmed' }, (event) => {
        const { tempId, confirmedMsg } = event.payload || {};
        if (confirmedMsg) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? (confirmedMsg as Message) : m))
          );
        }
      })
      // Postgres Changes: listener padrão para consistência e backup
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
      .subscribe();

    channelRef.current = channel;

    // Fallback de ultra-baixa latência: sincronização silenciosa a cada 2.5s enquanto na tela de mensagens
    const pollInterval = setInterval(() => {
      loadMessages(true);
    }, 2500);

    return () => {
      clearInterval(pollInterval);
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [coupleId, loadMemberProfiles, loadMessages, user?.id]);

  // 4. Envia mensagem instantaneamente com atualização otimista (ZERO DELAY)
  const handleSendMessage = async () => {
    const contentToSend = inputText.trim();
    if (!contentToSend || !user || !coupleId || sending) return;

    // Haptics no botão
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // 1. Limpa o input IMEDIATAMENTE (zero delay para o usuário)
    setInputText('');

    // 2. Cria mensagem otimista e insere no estado local na hora
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMsg: Message = {
      id: tempId,
      couple_id: coupleId,
      created_by: user.id,
      content: contentToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    // Dispara broadcast instantâneo para o parceiro via WebSocket (tempo de entrega ~30-50ms)
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: optimisticMsg,
      });
    }

    // Rola instantaneamente para a nova mensagem
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
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Substitui o tempId pelo registro real retornado do banco
      if (data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? (data as Message) : m))
        );

        // Notifica o parceiro do ID definitivo
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
          }).catch((err) => console.warn('Push error:', err));
        }
      }
    } catch (err: any) {
      console.warn('Erro ao salvar mensagem:', err);
      // Em caso de falha de conexão, remove a mensagem otimista e devolve o texto
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(contentToSend);
      Alert.alert('Erro ao enviar', 'Não foi possível entregar o seu bilhete. Verifique sua conexão.');
    } finally {
      setSending(false);
    }
  };

  const handleGoBack = () => {
    Keyboard.dismiss();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.created_by === user?.id;
    const authorProfile = profileMap.get(item.created_by);

    const avatarUri =
      authorProfile?.avatar_url ||
      (isMe ? user?.user_metadata?.avatar_url || user?.user_metadata?.picture : null);

    const avatar = (
      <View
        style={[
          styles.avatarContainer,
          {
            backgroundColor: isDark
              ? 'rgba(167,151,255,0.15)'
              : 'rgba(142,124,232,0.12)',
            borderColor: isMe ? themeTokens.primary : (isDark ? themeTokens.primaryDark : '#735FD7'),
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
                  ? [themeTokens.orbLavender, themeTokens.orbPink]
                  : ['#EDE9FE', '#DDD6FE']
              }
              style={StyleSheet.absoluteFill}
            />
            <Ionicons
              name="person"
              size={16}
              color={isMe ? '#FFFFFF' : themeTokens.primary}
            />
          </View>
        )}
      </View>
    );

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowPartner]}>
        {!isMe && avatar}

        {isMe ? (
          <LinearGradient
            colors={isDark ? ['#A797FF', '#8B5CF6'] : ['#8E7CE8', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.messageBubble, styles.bubbleMe]}
          >
            <Text style={styles.messageTextMe}>{item.content}</Text>
            <Text style={styles.messageTimeMe}>{formatMessageTime(item.created_at)}</Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.messageBubble,
              styles.bubblePartner,
              {
                backgroundColor: isDark
                  ? themeTokens.glassSurface
                  : 'rgba(255,255,255,0.65)',
                borderColor: isDark
                  ? themeTokens.glassBorder
                  : 'rgba(255,255,255,0.6)',
              },
            ]}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 75 : 100}
              tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.messageTextPartner, { color: themeTokens.textPrimary }]}>
              {item.content}
            </Text>
            <Text style={[styles.messageTimePartner, { color: themeTokens.textMuted }]}>
              {formatMessageTime(item.created_at)}
            </Text>
          </View>
        )}

        {isMe && avatar}
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
                <LiquidGlassView variant="card" style={styles.emptyCard} borderRadius={24}>
                  <View
                    style={[
                      styles.emptyIconBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(167,151,255,0.15)'
                          : 'rgba(142,124,232,0.1)',
                      },
                    ]}
                  >
                    <Ionicons name="mail-open-outline" size={32} color={themeTokens.primary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: themeTokens.textPrimary }]}>
                    Nenhum bilhete ainda
                  </Text>
                  <Text style={[styles.emptySub, { color: themeTokens.textSecondary }]}>
                    Surpreenda seu amor deixando o primeiro recado carinhoso aqui.
                  </Text>
                </LiquidGlassView>
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
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
          )}
        </View>

        {/* Header fixo com Blur e transparência - mensagens passam por trás */}
        <View style={[styles.blurredHeaderContainer, { paddingTop: insets.top }]}>
          <BlurView
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
          <View style={styles.headerContentRow}>
            <AnimatedTouchable
              style={[
                styles.headerBackButton,
                {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.75)',
                  borderTopColor: isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                },
              ]}
              onPress={handleGoBack}
              accessibilityLabel="Voltar"
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 70 : 100}
                tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="arrow-back" size={20} color={isDark ? '#F7F5FF' : '#16151E'} />
            </AnimatedTouchable>

            <View style={styles.headerBrandWrapper}>
              <Text style={[styles.headerBrandTitle, { color: isDark ? '#A797FF' : '#7C3AED' }]}>nós.</Text>
              <Text
                style={[styles.headerCoupleSubtitle, { color: isDark ? '#AAA5B8' : '#7E7699' }]}
                numberOfLines={1}
              >
                Bilhetes carinhosos do casal
              </Text>
            </View>
          </View>
        </View>

        {/* Barra de Input fixa com Blur e transparência na base - igual ao topo */}
        <View
          style={[
            styles.blurredInputContainer,
            {
              paddingBottom: isKeyboardVisible
                ? (Platform.OS === 'ios' ? 10 : 12)
                : (insets.bottom > 0 ? insets.bottom + 84 : 102),
            },
          ]}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 80 : 100}
            tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark ? 'rgba(15, 13, 24, 0.70)' : 'rgba(248, 249, 252, 0.75)',
                borderTopWidth: 1,
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.60)',
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
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.16)'
                    : 'rgba(142, 124, 232, 0.22)',
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

            <AnimatedTouchable
              style={[
                styles.sendButton,
                {
                  backgroundColor: themeTokens.primaryDark,
                  shadowColor: themeTokens.primaryDark,
                },
                (!inputText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || sending}
            >
              <Ionicons name="paper-plane" size={16} color="#FFFFFF" style={{ marginLeft: 1 }} />
            </AnimatedTouchable>
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
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 5,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
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
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  bubblePartner: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
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
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    alignSelf: 'flex-end',
    fontWeight: '500',
  },
  messageTimePartner: {
    fontSize: 10,
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
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    paddingVertical: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.3,
  },
});

