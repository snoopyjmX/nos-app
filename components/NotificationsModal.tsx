import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AnimatedTouchable } from './AnimatedTouchable';
import { LiquidGlassView } from './ui/LiquidGlassView';
import { GlassSurface } from './ui/GlassSurface';
import { EmptyState } from './ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useCouple } from '../context/CoupleContext';
import { useAppTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { THEME, getThemeTokens } from '../constants/theme';

export interface NotificationItem {
  id: string;
  type: 'date' | 'memory' | 'message';
  title: string;
  description: string;
  timeAgo: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  targetRoute: string;
}

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const router = useRouter();
  const { user } = useAuth();
  const { coupleId } = useCouple();


  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = useCallback(async () => {
    if (!coupleId || !user) return;

    try {
      setLoading(notifications.length === 0);
      const list: NotificationItem[] = [];

      // 1. Próximas datas comemorativas
      const { data: dates } = await supabase
        .from('special_dates')
        .select('id, title, event_date')
        .eq('couple_id', coupleId)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(3);

      if (dates && dates.length > 0) {
        dates.forEach((d) => {
          const eventDate = new Date(d.event_date);
          const diffMs = eventDate.getTime() - Date.now();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const timeText = diffDays <= 0 ? 'Hoje!' : diffDays === 1 ? 'Amanhã' : `Em ${diffDays} dias`;

          list.push({
            id: `date-${d.id}`,
            type: 'date',
            title: d.title,
            description: `Contagem regressiva para este momento especial. (${timeText})`,
            timeAgo: timeText,
            icon: 'calendar',
            iconColor: '#7C3AED',
            iconBg: isDark ? 'rgba(167, 151, 255, 0.15)' : 'rgba(124, 58, 237, 0.12)',
            targetRoute: '/(tabs)/dates',
          });
        });
      }

      // 2. Última memória adicionada
      const { data: memories } = await supabase
        .from('memories')
        .select('id, title, created_at, created_by')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
        .limit(2);

      if (memories && memories.length > 0) {
        memories.forEach((m) => {
          const isMe = m.created_by === user.id;
          list.push({
            id: `mem-${m.id}`,
            type: 'memory',
            title: isMe ? 'Você eternizou uma memória' : 'Seu amor guardou um momento!',
            description: `"${m.title}" foi adicionado à galeria de vocês.`,
            timeAgo: new Date(m.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
            icon: 'camera',
            iconColor: '#2563EB',
            iconBg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.12)',
            targetRoute: '/(tabs)/memories',
          });
        });
      }

      // 3. Últimos recados carinhosos
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, content, created_at, created_by')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
        .limit(2);

      if (msgs && msgs.length > 0) {
        msgs.forEach((msg) => {
          const isMe = msg.created_by === user.id;
          if (!isMe) {
            list.push({
              id: `msg-${msg.id}`,
              type: 'message',
              title: 'Novo recado do seu amor',
              description: `"${msg.content}"`,
              timeAgo: new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              icon: 'chatbubble-ellipses',
              iconColor: '#EA580C',
              iconBg: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(234, 88, 12, 0.12)',
              targetRoute: '/(tabs)/messages',
            });
          }
        });
      }

      setNotifications(list);
    } catch {
      // Ignora silenciosamente
    } finally {
      setLoading(false);
    }
  }, [coupleId, user, isDark]);

  // Carrega imediatamente ao montar para abrir instantaneamente quando o usuário tocar no sino
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible, loadNotifications]);

  const handleNavigate = (route: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    onClose();
    router.push(route as any);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <GlassSurface
          intensity={Platform.OS === 'ios' ? 70 : 90}
          tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
          isOverlay
          style={StyleSheet.absoluteFill}
        />

        {/* Fundo escuro clicável para fechar o modal ao tocar fora */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <LiquidGlassView variant="hero" style={styles.modalCard} borderRadius={30}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconCircle, { backgroundColor: isDark ? 'rgba(167, 151, 255, 0.15)' : 'rgba(124, 58, 237, 0.12)' }]}>
                <Ionicons name="notifications" size={20} color={isDark ? '#A797FF' : '#7C3AED'} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: isDark ? '#F7F5FF' : '#16151E' }]}>
                  Alertas do Casal
                </Text>
                <Text style={[styles.modalSubtitle, { color: isDark ? '#AAA5B8' : '#7E7699' }]}>
                  Momentos, recados e datas importantes
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              accessibilityLabel="Fechar alertas"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color={isDark ? '#F7F5FF' : '#16151E'} />
            </TouchableOpacity>
          </View>

          {/* Conteúdo de Alertas */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={themeTokens.primary} size="small" />
            </View>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon="sparkles-outline"
              title="Tudo tranquilo por aqui"
              subtitle="Quando surgirem novos momentos ou datas próximas, eles aparecerão aqui."
              compact
            />
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              style={styles.scrollList}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <AnimatedTouchable
                  style={styles.notifItemTouch}
                  onPress={() => handleNavigate(item.targetRoute)}
                  activeOpacity={0.85}
                >
                  <LiquidGlassView variant="card" style={styles.notifItem} borderRadius={20}>
                    <View style={[styles.notifIconCircle, { backgroundColor: item.iconBg }]}>
                      <Ionicons name={item.icon} size={18} color={item.iconColor} />
                    </View>

                    <View style={styles.notifTextContainer}>
                      <View style={styles.notifHeaderRow}>
                        <Text style={[styles.notifItemTitle, { color: isDark ? '#F7F5FF' : '#16151E' }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={[styles.notifTimeAgo, { color: isDark ? '#AAA5B8' : '#8A879A' }]}>
                          {item.timeAgo}
                        </Text>
                      </View>
                      <Text style={[styles.notifItemDesc, { color: isDark ? '#AAA5B8' : '#686578' }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={16} color={isDark ? '#8A859A' : '#A797FF'} />
                  </LiquidGlassView>
                </AnimatedTouchable>
              )}
            />
          )}
        </LiquidGlassView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    marginTop: 12,
  },
  scrollContent: {
    paddingVertical: 4,
    gap: 10,
  },
  loadingBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  notifItemTouch: {
    width: '100%',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  notifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTextContainer: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 6,
  },
  notifTimeAgo: {
    fontSize: 11,
    fontWeight: '500',
  },
  notifItemDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
