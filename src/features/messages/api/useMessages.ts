import { useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/core/supabase';
import { logger } from '@/lib/core/logger';
import { Message, UserProfile } from '../types';
import { getFirstName } from '../utils/stringFormatting';

export function useMessages(coupleId: string | null, user: any) {
  const [messages, setMessages] = useState<Message[]>([]);
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

  const initialMessageIdsRef = useRef<Set<string>>(new Set());

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [sending, setSending] = useState(false);

  const channelRef = useRef<any>(null);
  const latestCreatedAtRef = useRef<string | null>(null);
  const isSyncingRef = useRef(false);
  const isPrependRef = useRef(false);
  const isInitialLoadDoneRef = useRef(false);
  const previousScrollHeightRef = useRef(0);
  const previousScrollYRef = useRef(0);

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
      // Ignora erro
    }

    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(cleanPath);
    return publicData?.publicUrl || trimmed;
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, user]);

  const loadInitialMessages = useCallback(async (flatListRef: React.RefObject<any>) => {
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

  const syncMissedMessages = useCallback(async (flatListRef: React.RefObject<any>) => {
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

  const initRealtime = useCallback((flatListRef: React.RefObject<any>) => {
    if (!coupleId) return () => {};

    loadMemberProfiles();
    loadInitialMessages(flatListRef);

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
          syncMissedMessages(flatListRef);
        }
      });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [coupleId, loadInitialMessages, loadMemberProfiles, syncMissedMessages, user?.id]);

  const handleSendMessage = async (flatListRef: React.RefObject<any>) => {
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
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(contentToSend);
      Alert.alert('Erro ao enviar', 'Não foi possível entregar o seu bilhete. Verifique sua conexão.');
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    profileMap,
    loading,
    loadingOlder,
    hasMoreOlder,
    sending,
    inputText,
    setInputText,
    initRealtime,
    loadOlderMessages,
    syncMissedMessages,
    handleSendMessage,
    isInitialLoadDoneRef,
    initialMessageIdsRef,
    isPrependRef,
    previousScrollYRef,
    previousScrollHeightRef,
  };
}
