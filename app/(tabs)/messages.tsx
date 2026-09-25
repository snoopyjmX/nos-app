import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  couple_id: string;
  created_by: string;
  content: string;
  created_at: string;
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

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  if (isToday) {
    return `${hours}:${minutes}`;
  }

  const day = date.getDate();
  const monthNames = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ];
  const month = monthNames[date.getMonth()];
  return `${day} ${month} • ${hours}:${minutes}`;
};

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { coupleId } = useCouple();

  const [messages, setMessages] = useState<Message[]>([]);
  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Monitora visibilidade do teclado para ajustar margens da barra de entrada
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

  // 1. Carrega os perfis dos integrantes para exibir o nome do autor
  const loadMemberProfiles = useCallback(async () => {
    if (!coupleId) return;

    try {
      const { data: members } = await supabase
        .from('couple_members')
        .select('user_id')
        .eq('couple_id', coupleId);

      const userIds = (members || []).map((m) => m.user_id);
      if (userIds.length === 0) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const map = new Map<string, string>();
      profiles?.forEach((p) => {
        if (p.id && p.display_name) {
          map.set(p.id, getFirstName(p.display_name));
        }
      });
      setProfileMap(map);
    } catch (err) {
      console.warn('Erro ao carregar perfis de mensagens:', err);
    }
  }, [coupleId]);

  // 2. Carrega as mensagens do casal em ordem cronológica
  const loadMessages = useCallback(async () => {
    if (!coupleId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('id, couple_id, created_by, content, created_at')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      setMessages(data || []);
    } catch (err: any) {
      console.warn('Erro ao carregar mensagens:', err.message);
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) return;

    loadMemberProfiles();
    loadMessages();

    // 3. Subscription do Supabase Realtime para mensagens instantâneas
    const channel = supabase
      .channel(`messages_channel_${coupleId}`)
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
            return [...prev, newMsg];
          });
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 150);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, loadMemberProfiles, loadMessages]);

  // 4. Envia mensagem rápida
  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !coupleId || sending) return;

    const contentToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        couple_id: coupleId,
        created_by: user.id,
        content: contentToSend,
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      Alert.alert('Erro ao enviar', 'Não foi possível entregar o seu bilhete. Tente novamente.');
      setInputText(contentToSend);
    } finally {
      setSending(false);
    }
  };

  // Volta para a tela anterior com segurança
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
    const authorName = isMe
      ? 'Você'
      : profileMap.get(item.created_by) || 'Meu Amor';

    return (
      <View
        style={[
          styles.messageCardContainer,
          isMe ? styles.myMessageContainer : styles.partnerMessageContainer,
        ]}
      >
        <View
          style={[
            styles.glassNoteCard,
            isMe ? styles.myGlassNoteCard : styles.partnerGlassNoteCard,
          ]}
        >
          {/* Cabeçalho do bilhete */}
          <View style={styles.noteHeader}>
            <View style={styles.noteAuthorBadge}>
              <Ionicons
                name={isMe ? 'heart' : 'heart-outline'}
                size={12}
                color="#8E7CE8"
              />
              <Text style={styles.noteAuthorText}>{authorName}</Text>
            </View>
            <Text style={styles.noteTimeText}>
              {formatMessageTime(item.created_at)}
            </Text>
          </View>

          {/* Texto do bilhete */}
          <Text style={styles.noteContentText}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Cabeçalho Superior da Aba com Botão de Voltar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={20} color="#16151E" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>nós • recados</Text>
          <Text style={styles.headerSubtitle}>Bilhetes carinhosos do casal</Text>
        </View>
      </View>

      {/* Área de Visualização das Mensagens */}
      <View style={styles.contentFlex}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color="#8E7CE8" size="large" />
          </View>
        ) : messages.length === 0 ? (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.centerContainer}>
              <View style={styles.emptyGlassCard}>
                <View style={styles.emptyIconBadge}>
                  <Ionicons name="mail-open-outline" size={36} color="#8E7CE8" />
                </View>
                <Text style={styles.emptyTitle}>Nenhum bilhete ainda</Text>
                <Text style={styles.emptySubtitle}>
                  Surpreenda seu amor deixando o primeiro recado carinhoso aqui.
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}
      </View>

      {/* Barra de Entrada de Texto em Fluxo Flexível (Sempre Visível) */}
      <View
        style={[
          styles.inputBarWrapper,
          {
            marginBottom: isKeyboardVisible
              ? 10
              : Platform.OS === 'ios'
              ? 88
              : 76,
          },
        ]}
      >
        <View style={styles.inputGlassBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Escreva um recado com carinho..."
            placeholderTextColor="#686578"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="send" size={17} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 124, 232, 0.1)',
    backgroundColor: '#F8F9FC',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitleWrapper: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8E7CE8',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#686578',
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
  emptyGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    width: '100%',
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
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
    fontWeight: '700',
    color: '#16151E',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#686578',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  messageCardContainer: {
    marginVertical: 6,
    width: '100%',
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  partnerMessageContainer: {
    alignItems: 'flex-start',
  },
  glassNoteCard: {
    maxWidth: '82%',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  myGlassNoteCard: {
    backgroundColor: 'rgba(142, 124, 232, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.3)',
    borderBottomRightRadius: 6,
  },
  partnerGlassNoteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomLeftRadius: 6,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  noteAuthorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteAuthorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E7CE8',
  },
  noteTimeText: {
    fontSize: 11,
    color: '#686578',
    opacity: 0.85,
  },
  noteContentText: {
    fontSize: 15,
    color: '#16151E',
    lineHeight: 21,
  },
  inputBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  inputGlassBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.25)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 90,
    fontSize: 15,
    color: '#16151E',
    paddingVertical: 8,
    paddingRight: 8,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8E7CE8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8E7CE8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
