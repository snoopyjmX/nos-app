import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { AnimatedTouchable } from '../../components/AnimatedTouchable';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';
import { LiquidGlassView } from '../../components/ui/LiquidGlassView';
import { AppHeader } from '../../components/AppHeader';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { supabase } from '../../lib/supabase';
import { THEME } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface RecentMemory {
  id: string;
  title: string;
  memory_date: string;
  image_url: string | null;
  displayUrl?: string | null;
}

interface LatestMessage {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  isMe: boolean;
  authorName: string;
  authorAvatarUrl: string | null;
}

interface NextMilestone {
  id: string;
  title: string;
  category: string;
  event_date: string;
  daysRemaining: number;
}

interface AccumulatedTime {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  breakdownMonths: number;
  breakdownDays: number;
  breakdownHours: number;
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

// Calcula os totais acumulados absolutos de toda a história e o detalhamento em meses, dias e horas
const calculateAccumulatedTime = (startDateString?: string | null): AccumulatedTime => {
  if (!startDateString) {
    return {
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      breakdownMonths: 0,
      breakdownDays: 0,
      breakdownHours: 0,
    };
  }

  const cleanDateStr = startDateString.split('T')[0];
  const parts = cleanDateStr.split('-');

  let start: Date;
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    start = new Date(year, month, day, 0, 0, 0, 0);
  } else {
    start = new Date(startDateString);
  }

  const now = new Date();
  if (isNaN(start.getTime()) || start > now) {
    return {
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      breakdownMonths: 0,
      breakdownDays: 0,
      breakdownHours: 0,
    };
  }

  const diffMs = now.getTime() - start.getTime();

  // 1. Total absoluto de minutos
  const minutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  // 2. Total absoluto de horas (integer limpo)
  const hours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  // 3. Total absoluto de dias (integer limpo)
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  // 4. Total absoluto de meses de calendário
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) {
    months--;
  }
  months = Math.max(0, months);

  // Decomposição harmônica: Meses + Dias restantes + Horas restantes
  const cursorDate = new Date(start.getTime());
  cursorDate.setMonth(cursorDate.getMonth() + months);
  if (cursorDate > now) {
    cursorDate.setMonth(cursorDate.getMonth() - 1);
  }
  const remainingMs = Math.max(0, now.getTime() - cursorDate.getTime());
  const breakdownDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const breakdownHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return {
    months,
    days,
    hours,
    minutes,
    breakdownMonths: months,
    breakdownDays,
    breakdownHours,
  };
};

const formatMemoryDate = (dateString?: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  });
};

export default function HomeScreen() {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const router = useRouter();
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const insets = useSafeAreaInsets();

  const [coupleTitle, setCoupleTitle] = useState<string>('Você & Meu Amor');
  const [effectiveStartDateStr, setEffectiveStartDateStr] = useState<string | null>(null);
  const [recentMemory, setRecentMemory] = useState<RecentMemory | null>(null);
  const [latestMessage, setLatestMessage] = useState<LatestMessage | null>(null);
  const [nextMilestone, setNextMilestone] = useState<NextMilestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setCurrentTick] = useState<number>(Date.now());

  // Micro-interações táteis e orgânicas refinadas
  const badgeHeartScale = useSharedValue(1);
  const sparkleScale = useSharedValue(1);

  useEffect(() => {
    badgeHeartScale.value = withRepeat(
      withSequence(
        withTiming(1.28, { duration: 150, easing: Easing.out(Easing.ease) }),
        withTiming(1.05, { duration: 110, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.32, { duration: 170, easing: Easing.out(Easing.ease) }),
        withTiming(1.0, { duration: 260, easing: Easing.out(Easing.quad) }),
        withDelay(1800, withTiming(1.0, { duration: 0 }))
      ),
      -1,
      false
    );

    sparkleScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withDelay(800, withTiming(1.0, { duration: 0 }))
      ),
      -1,
      false
    );
  }, [badgeHeartScale, sparkleScale]);

  const badgeHeartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeHeartScale.value }],
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkleScale.value }],
  }));

  // Intervalo a cada 60s para manter horas vivas
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTick(Date.now());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // 1. Busca os integrantes e nomes do casal
  const loadCoupleDetails = useCallback(async () => {
    if (!user || !coupleId) return;

    try {
      const { data: members, error: membersError } = await supabase
        .from('couple_members')
        .select('user_id')
        .eq('couple_id', coupleId);

      if (membersError) {
        return;
      }

      const userIds = (members || []).map((m) => m.user_id);
      if (userIds.length === 0) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map<string, { name: string; avatar: string | null }>();
      profiles?.forEach((p) => {
        if (p.id) {
          profileMap.set(p.id, {
            name: p.display_name || '',
            avatar: p.avatar_url || null,
          });
        }
      });

      const myProfile = profileMap.get(user.id);
      const myDisplayName =
        myProfile?.name ||
        user.user_metadata?.display_name ||
        user.email?.split('@')[0] ||
        'Você';
      const myFirstName = getFirstName(myDisplayName) || 'Você';

      const otherMember = members?.find((m) => m.user_id !== user.id);
      let partnerFirstName = 'Meu Amor';

      if (otherMember) {
        const partnerProfile = profileMap.get(otherMember.user_id);
        if (partnerProfile?.name) {
          partnerFirstName = getFirstName(partnerProfile.name) || 'Meu Amor';
        }
      }

      setCoupleTitle(`${myFirstName} & ${partnerFirstName}`);
    } catch {
      // Ignora silenciosamente
    }
  }, [user, coupleId]);

  // 2. Busca a data de início (anniversary_date ou created_at)
  const loadCoupleDays = useCallback(async () => {
    if (!coupleId) return;

    try {
      const { data: coupleData, error } = await supabase
        .from('couples')
        .select('id, anniversary_date, created_at')
        .eq('id', coupleId)
        .single();

      if (error) {
        return;
      }

      const customDateStr = coupleData?.anniversary_date;
      const effectiveDate = customDateStr || coupleData?.created_at;
      setEffectiveStartDateStr(effectiveDate || null);
    } catch {
      // Ignora silenciosamente
    }
  }, [coupleId]);

  // 3. Busca a memória mais recente com URL assinada
  const loadRecentMemory = useCallback(async () => {
    if (!coupleId) return;

    try {
      const { data: memoryData } = await supabase
        .from('memories')
        .select('id, title, memory_date, image_url')
        .eq('couple_id', coupleId)
        .order('memory_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!memoryData) {
        setRecentMemory(null);
        return;
      }

      let displayUrl = memoryData.image_url;
      if (memoryData.image_url) {
        let cleanPath = memoryData.image_url.trim();
        if (
          cleanPath.startsWith('file:') ||
          cleanPath.startsWith('data:') ||
          cleanPath.startsWith('http://') ||
          cleanPath.startsWith('https://')
        ) {
          displayUrl = cleanPath;
        } else {
          if (cleanPath.includes('/memories/')) {
            cleanPath = cleanPath.split('/memories/')[1].split('?')[0];
          }
          cleanPath = cleanPath.replace(/^\/+/, '');

          try {
            const { data: signedData } = await supabase.storage
              .from('memories')
              .createSignedUrl(cleanPath, 60 * 60 * 24);

            if (signedData?.signedUrl) {
              displayUrl = signedData.signedUrl;
            } else {
              const { data: publicData } = supabase.storage
                .from('memories')
                .getPublicUrl(cleanPath);
              if (publicData?.publicUrl) {
                displayUrl = publicData.publicUrl;
              }
            }
          } catch {
            const { data: publicData } = supabase.storage
              .from('memories')
              .getPublicUrl(cleanPath);
            if (publicData?.publicUrl) {
              displayUrl = publicData.publicUrl;
            }
          }
        }
      }

      setRecentMemory({
        ...memoryData,
        displayUrl,
      });
    } catch {
      // Ignora silenciosamente
    }
  }, [coupleId]);

  // 4. Busca o último recado carinhoso trocado
  const loadLatestMessage = useCallback(async () => {
    if (!coupleId || !user) return;

    try {
      const { data: msg } = await supabase
        .from('messages')
        .select('id, content, created_at, created_by')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!msg) {
        setLatestMessage(null);
        return;
      }

      const isMe = msg.created_by === user.id;

      // Busca avatar e nome do autor
      let authorName = isMe ? 'Você' : 'Meu Amor';
      let authorAvatarUrl: string | null = null;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', msg.created_by)
          .maybeSingle();

        if (profile) {
          authorName = isMe ? 'Você' : getFirstName(profile.display_name) || 'Meu Amor';
          if (profile.avatar_url) {
            let cleanPath = profile.avatar_url.trim();
            if (cleanPath.includes('/avatars/')) {
              cleanPath = cleanPath.split('/avatars/')[1].split('?')[0];
            }
            cleanPath = cleanPath.replace(/^\/+/, '');
            const { data: signedAvatar } = await supabase.storage
              .from('avatars')
              .createSignedUrl(cleanPath, 60 * 60 * 24);
            authorAvatarUrl = signedAvatar?.signedUrl || profile.avatar_url;
          }
        }
      } catch {
        // Fallback silencioso
      }

      setLatestMessage({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        created_by: msg.created_by,
        isMe,
        authorName,
        authorAvatarUrl,
      });
    } catch {
      // Ignora silenciosamente
    }
  }, [coupleId, user]);

  // 5. Busca o próximo marco / comemoração agendada
  const loadNextMilestone = useCallback(async () => {
    if (!coupleId) return;

    try {
      const nowIso = new Date().toISOString();
      const { data: nextDate } = await supabase
        .from('special_dates')
        .select('id, title, category, event_date')
        .eq('couple_id', coupleId)
        .gte('event_date', nowIso)
        .order('event_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextDate) {
        const targetTime = new Date(nextDate.event_date).getTime();
        const diffMs = Math.max(0, targetTime - Date.now());
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        setNextMilestone({
          ...nextDate,
          daysRemaining,
        });
      } else {
        setNextMilestone(null);
      }
    } catch {
      // Ignora silenciosamente
    }
  }, [coupleId]);

  // Carrega todos os dados simultaneamente
  const loadAllData = useCallback(async () => {
    try {
      await Promise.all([
        loadCoupleDetails(),
        loadCoupleDays(),
        loadRecentMemory(),
        loadLatestMessage(),
        loadNextMilestone(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadCoupleDetails, loadCoupleDays, loadRecentMemory, loadLatestMessage, loadNextMilestone]);

  useEffect(() => {
    if (!user || !coupleId) return;

    loadAllData();

    // Sincronização em tempo real via Supabase Realtime
    const channel = supabase
      .channel(`home_channel_${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couple_members', filter: `couple_id=eq.${coupleId}` },
        () => loadCoupleDetails()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
        () => loadCoupleDays()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memories', filter: `couple_id=eq.${coupleId}` },
        () => loadRecentMemory()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `couple_id=eq.${coupleId}` },
        () => loadLatestMessage()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'special_dates', filter: `couple_id=eq.${coupleId}` },
        () => loadNextMilestone()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, coupleId, loadAllData, loadCoupleDetails, loadCoupleDays, loadRecentMemory, loadLatestMessage, loadNextMilestone]);

  // Ação de Pull-to-Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // Totais acumulados calculados dinamicamente
  const timeTotals = useMemo(() => {
    return calculateAccumulatedTime(effectiveStartDateStr);
  }, [effectiveStartDateStr]);

  const handleOpenMemories = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/memories');
  };

  const handleOpenMessages = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/messages');
  };

  const handleOpenDates = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/dates');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeTokens.background }]}>
      <AtmosphereBackground />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 88 : 82),
            paddingBottom: 130,
          },
        ]}
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
            <View
              style={[
                styles.skeletonHeroCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.6)',
                  borderColor: isDark
                    ? themeTokens.glassBorder
                    : 'rgba(255,255,255,0.8)',
                },
              ]}
            >
              <View
                style={[
                  styles.skeletonImage,
                  {
                    backgroundColor: isDark
                      ? 'rgba(167,151,255,0.08)'
                      : 'rgba(142,124,232,0.1)',
                  },
                ]}
              />
              <View
                style={[
                  styles.skeletonPill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(167,151,255,0.1)'
                      : 'rgba(142,124,232,0.12)',
                  },
                ]}
              />
            </View>
            <View
              style={[
                styles.skeletonRowCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.6)',
                  borderColor: isDark
                    ? themeTokens.glassBorder
                    : 'rgba(255,255,255,0.8)',
                },
              ]}
            />
          </View>
        ) : (
          <View>
            {/* ── Hero Card: Photo + Journey Counter ── */}
            <LiquidGlassView variant="hero" style={styles.heroGlassCard} borderRadius={28}>
              <AnimatedTouchable
                style={styles.heroImageContainer}
                onPress={handleOpenMemories}
                scaleTo={0.97}
              >
                {recentMemory?.displayUrl || recentMemory?.image_url ? (
                  <Image
                    source={{
                      uri: (recentMemory.displayUrl || recentMemory.image_url) as string,
                    }}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={
                      isDark
                        ? [themeTokens.orbLavender, themeTokens.orbPink]
                        : ['#EDE9FE', '#DDD6FE', '#FCE7F3']
                    }
                    style={styles.heroImagePlaceholder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View
                      style={[
                        styles.placeholderIconCircle,
                        {
                          backgroundColor: isDark
                            ? 'rgba(167,151,255,0.2)'
                            : 'rgba(255,255,255,0.7)',
                          borderColor: isDark
                            ? 'rgba(167,151,255,0.3)'
                            : 'rgba(255,255,255,0.9)',
                        },
                      ]}
                    >
                      <Ionicons name="camera" size={28} color={themeTokens.primary} />
                    </View>
                    <Text
                      style={[styles.placeholderTitle, { color: isDark ? themeTokens.textPrimary : '#1E1B4B' }]}
                    >
                      Eternize sua primeira memória
                    </Text>
                    <Text style={[styles.placeholderSub, { color: themeTokens.textSecondary }]}>
                      Toque para adicionar uma foto de vocês
                    </Text>
                  </LinearGradient>
                )}

                {/* Floating badge */}
                <View
                  style={[
                    styles.photoBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(167,151,255,0.55)'
                        : 'rgba(124,58,237,0.6)',
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(255,255,255,0.5)',
                    },
                  ]}
                >
                  <Animated.View style={badgeHeartAnimatedStyle}>
                    <Ionicons name="heart" size={12} color="#FFFFFF" />
                  </Animated.View>
                  <Text style={styles.photoBadgeText}>Nós</Text>
                </View>
              </AnimatedTouchable>

              {/* Journey Counter */}
              <View style={styles.journeySection}>
                <Text style={[styles.journeyLabel, { color: themeTokens.textSecondary }]}>
                  NOSSA JORNADA
                </Text>

                <View
                  style={[
                    styles.journeyPill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(167,151,255,0.1)'
                        : 'rgba(142,124,232,0.06)',
                      borderColor: isDark
                        ? 'rgba(167,151,255,0.2)'
                        : 'rgba(142,124,232,0.15)',
                    },
                  ]}
                >
                  <Text style={[styles.journeyDays, { color: themeTokens.primary }]}>
                    Juntos há {timeTotals.days} dias
                  </Text>
                  <Text style={[styles.journeyBreakdown, { color: isDark ? themeTokens.primary : '#8E7CE8' }]}>
                    {timeTotals.breakdownMonths}{' '}
                    {timeTotals.breakdownMonths === 1 ? 'mês' : 'meses'} •{' '}
                    {timeTotals.breakdownDays}{' '}
                    {timeTotals.breakdownDays === 1 ? 'dia' : 'dias'} •{' '}
                    {timeTotals.breakdownHours}h
                  </Text>
                </View>
              </View>
            </LiquidGlassView>

            {/* ── Quick Actions ── */}
            <View style={styles.quickActionsRow}>
              {[
                { icon: 'chatbubble-ellipses' as const, label: 'Recado', onPress: handleOpenMessages },
                { icon: 'camera' as const, label: 'Memória', onPress: handleOpenMemories },
                { icon: 'calendar' as const, label: 'Datas', onPress: handleOpenDates },
              ].map((action) => (
                <AnimatedTouchable
                  key={action.label}
                  style={styles.quickActionTouch}
                  onPress={action.onPress}
                  scaleTo={0.95}
                >
                  <LiquidGlassView variant="pill" style={styles.quickActionPill} borderRadius={16}>
                    <Ionicons name={action.icon} size={15} color={themeTokens.primary} />
                    <Text style={[styles.quickActionText, { color: themeTokens.primary }]}>
                      {action.label}
                    </Text>
                  </LiquidGlassView>
                </AnimatedTouchable>
              ))}
            </View>

            {/* ── Next Milestone ── */}
            {nextMilestone && (
              <AnimatedTouchable onPress={handleOpenDates} scaleTo={0.97}>
                <LiquidGlassView variant="card" style={styles.milestoneCard} borderRadius={20}>
                  <View
                    style={[
                      styles.milestoneIcon,
                      {
                        backgroundColor: isDark
                          ? 'rgba(167,151,255,0.15)'
                          : 'rgba(142,124,232,0.1)',
                      },
                    ]}
                  >
                    <Animated.View style={sparkleAnimatedStyle}>
                      <Ionicons name="sparkles" size={17} color={themeTokens.primary} />
                    </Animated.View>
                  </View>
                  <View style={styles.milestoneInfo}>
                    <Text style={[styles.milestoneLabel, { color: themeTokens.textSecondary }]}>
                      PRÓXIMO MOMENTO
                    </Text>
                    <Text
                      style={[styles.milestoneTitle, { color: themeTokens.textPrimary }]}
                      numberOfLines={1}
                    >
                      {nextMilestone.title}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.milestoneBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(167,151,255,0.15)'
                          : '#EDE9FE',
                      },
                    ]}
                  >
                    <Text style={[styles.milestoneBadgeText, { color: themeTokens.primary }]}>
                      {nextMilestone.daysRemaining === 0
                        ? 'É hoje!'
                        : `em ${nextMilestone.daysRemaining}d`}
                    </Text>
                  </View>
                </LiquidGlassView>
              </AnimatedTouchable>
            )}

            {/* ── Recent Memory ── */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: themeTokens.textSecondary }]}>
                MEMÓRIA RECENTE
              </Text>
              <AnimatedTouchable onPress={handleOpenMemories} scaleTo={0.95}>
                <Text style={[styles.sectionLink, { color: themeTokens.primary }]}>Ver todas</Text>
              </AnimatedTouchable>
            </View>

            {recentMemory ? (
              <AnimatedTouchable onPress={handleOpenMemories} scaleTo={0.97}>
                <LiquidGlassView variant="card" style={styles.memoryCard} borderRadius={20}>
                  <View
                    style={[
                      styles.memoryThumb,
                      {
                        backgroundColor: isDark
                          ? 'rgba(167,151,255,0.12)'
                          : '#EDE9FE',
                        borderColor: isDark
                          ? themeTokens.glassBorder
                          : 'rgba(255,255,255,0.9)',
                      },
                    ]}
                  >
                    {recentMemory.displayUrl || recentMemory.image_url ? (
                      <Image
                        source={{
                          uri: (recentMemory.displayUrl || recentMemory.image_url) as string,
                        }}
                        style={styles.memoryThumbImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="images-outline" size={22} color={themeTokens.primary} />
                    )}
                  </View>
                  <View style={styles.memoryMeta}>
                    <Text style={[styles.memoryDate, { color: themeTokens.textSecondary }]}>
                      {formatMemoryDate(recentMemory.memory_date)}
                    </Text>
                    <Text
                      style={[styles.memoryTitle, { color: themeTokens.textPrimary }]}
                      numberOfLines={1}
                    >
                      {recentMemory.title}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.chevron,
                      {
                        backgroundColor: isDark
                          ? 'rgba(167,151,255,0.12)'
                          : 'rgba(142,124,232,0.08)',
                      },
                    ]}
                  >
                    <Ionicons name="chevron-forward" size={15} color={themeTokens.primary} />
                  </View>
                </LiquidGlassView>
              </AnimatedTouchable>
            ) : (
              <AnimatedTouchable onPress={handleOpenMemories} scaleTo={0.97}>
                <LiquidGlassView variant="card" style={styles.memoryCard} borderRadius={20}>
                  <View
                    style={[
                      styles.memoryThumb,
                      {
                        backgroundColor: isDark
                          ? 'rgba(167,151,255,0.12)'
                          : 'rgba(142,124,232,0.08)',
                      },
                    ]}
                  >
                    <Ionicons name="sparkles-outline" size={22} color={themeTokens.primary} />
                  </View>
                  <View style={styles.memoryMeta}>
                    <Text style={[styles.emptyTitle, { color: themeTokens.textPrimary }]}>
                      Guarde sua primeira memória
                    </Text>
                    <Text style={[styles.emptySub, { color: themeTokens.textSecondary }]}>
                      Eternize os melhores momentos de vocês
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.chevron,
                      {
                        backgroundColor: isDark
                          ? 'rgba(167,151,255,0.12)'
                          : 'rgba(142,124,232,0.08)',
                      },
                    ]}
                  >
                    <Ionicons name="add" size={17} color={themeTokens.primary} />
                  </View>
                </LiquidGlassView>
              </AnimatedTouchable>
            )}

            {/* ── Latest Message ── */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: themeTokens.textSecondary }]}>
                RECADO DO CASAL
              </Text>
              <AnimatedTouchable onPress={handleOpenMessages} scaleTo={0.95}>
                <Text style={[styles.sectionLink, { color: themeTokens.primary }]}>Abrir chat</Text>
              </AnimatedTouchable>
            </View>

            <AnimatedTouchable onPress={handleOpenMessages} scaleTo={0.97}>
              <LiquidGlassView variant="card" style={styles.noteCard} borderRadius={20}>
                <View style={styles.noteHeader}>
                  <View
                    style={[
                      styles.noteAuthorBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(167,151,255,0.12)'
                          : 'rgba(142,124,232,0.08)',
                      },
                    ]}
                  >
                    <Ionicons name="chatbubble-ellipses" size={13} color={themeTokens.primary} />
                    <Text style={[styles.noteAuthorText, { color: themeTokens.primary }]}>
                      {latestMessage ? latestMessage.authorName : 'Deixe um bilhete'}
                    </Text>
                  </View>
                  {latestMessage && (
                    <Text style={[styles.noteTime, { color: themeTokens.textSecondary }]}>
                      {formatMessageTime(latestMessage.created_at)}
                    </Text>
                  )}
                </View>

                <Text
                  style={[
                    styles.noteContent,
                    { color: latestMessage ? themeTokens.textPrimary : themeTokens.textSecondary },
                    !latestMessage && styles.noteContentEmpty,
                  ]}
                  numberOfLines={2}
                >
                  {latestMessage
                    ? `"${latestMessage.content}"`
                    : 'Surpreenda seu amor com um bilhete carinhoso hoje ❤️'}
                </Text>
              </LiquidGlassView>
            </AnimatedTouchable>
          </View>
        )}
      </ScrollView>

      {/* Cabeçalho Fixo com Blur e Transparência Apple Liquid Glass */}
      <View style={[styles.blurredHeaderContainer, { paddingTop: insets.top }]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 85}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? 'rgba(15, 13, 24, 0.45)' : 'rgba(248, 249, 252, 0.50)',
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        />
        <View style={styles.headerInnerRow}>
          <AppHeader
            coupleSubtitle={coupleTitle}
            showNotification={true}
            containerStyle={{ marginBottom: 0, paddingTop: 4, paddingBottom: 8 }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scrollContent: {
    paddingHorizontal: 20,
  },

  /* ── Skeleton ── */
  skeletonContainer: {
    paddingTop: 10,
    gap: 16,
  },
  skeletonHeroCard: {
    width: '100%',
    height: 340,
    borderRadius: 28,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  skeletonImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
  },
  skeletonPill: {
    width: '65%',
    height: 44,
    borderRadius: 22,
    alignSelf: 'center',
  },
  skeletonRowCard: {
    width: '100%',
    height: 80,
    borderRadius: 20,
    borderWidth: 1,
  },

  /* ── Hero Card ── */
  heroGlassCard: {
    padding: 12,
    marginBottom: 12,
  },
  heroImageContainer: {
    width: '100%',
    height: width > 400 ? 240 : 210,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  placeholderIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  placeholderTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  placeholderSub: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  photoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  photoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* ── Journey Counter ── */
  journeySection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 4,
  },
  journeyLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  journeyPill: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  journeyDays: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  journeyBreakdown: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.1,
    fontVariant: ['tabular-nums'],
  },

  /* ── Quick Actions ── */
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickActionTouch: {
    flex: 1,
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 5,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  /* ── Milestone ── */
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  milestoneIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  milestoneBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  milestoneBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  /* ── Section Headers ── */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* ── Memory Card ── */
  memoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  memoryThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  memoryThumbImage: {
    width: '100%',
    height: '100%',
  },
  memoryMeta: {
    flex: 1,
  },
  memoryDate: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  memoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 1,
  },
  emptySub: {
    fontSize: 11,
  },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Note Card ── */
  noteCard: {
    padding: 14,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteAuthorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  noteAuthorText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noteTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  noteContentEmpty: {
    fontStyle: 'normal',
  },
});

