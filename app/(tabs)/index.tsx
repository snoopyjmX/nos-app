import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
  RefreshControl,
  Dimensions,
  AppState,
  AppStateStatus,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AnimatedTouchable } from '../../components/AnimatedTouchable';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';
import { LiquidGlassView } from '../../components/ui/LiquidGlassView';
import { GlassSurface } from '../../components/ui/GlassSurface';
import { AppHeader } from '../../components/AppHeader';
import { PressableScale } from '../../components/ui/PressableScale';
import { Image as ExpoImage } from 'expo-image';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { supabase } from '../../lib/supabase';
import { THEME } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../constants/theme';
import { useTabBarHeight } from '../../hooks/useTabBarHeight';
import { ConfettiView } from '../../components/ui/ConfettiView';
import { checkTodayCelebration } from '../../src/lib/milestones';

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

let hasAnimatedHeroCounterThisSession = false;

interface CoupleJourneyCounterProps {
  startDate: string | null;
  isDark: boolean;
  themeTokens: any;
}

const CoupleJourneyCounter = React.memo(function CoupleJourneyCounter({
  startDate,
  isDark,
  themeTokens,
}: CoupleJourneyCounterProps) {
  const [timeTotals, setTimeTotals] = useState(() => calculateAccumulatedTime(startDate));
  const [animatedDays, setAnimatedDays] = useState(() => {
    return hasAnimatedHeroCounterThisSession ? timeTotals.days : 0;
  });

  useEffect(() => {
    setTimeTotals(calculateAccumulatedTime(startDate));

    let timer: ReturnType<typeof setInterval> | null = null;

    const startTimer = () => {
      if (!timer) {
        timer = setInterval(() => {
          setTimeTotals(calculateAccumulatedTime(startDate));
        }, 60000);
      }
    };

    const stopTimer = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    startTimer();

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        setTimeTotals(calculateAccumulatedTime(startDate));
        startTimer();
      } else {
        stopTimer();
      }
    };

    const handleVisibility = () => {
      if (typeof document !== 'undefined') {
        if (document.visibilityState === 'visible') {
          setTimeTotals(calculateAccumulatedTime(startDate));
          startTimer();
        } else {
          stopTimer();
        }
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppState);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      stopTimer();
      appStateSub.remove();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [startDate]);

  // Animação de 0 ao valor em ~900ms na primeira abertura da sessão
  useEffect(() => {
    if (hasAnimatedHeroCounterThisSession) {
      setAnimatedDays(timeTotals.days);
      return;
    }

    const target = timeTotals.days;
    if (target <= 0) {
      setAnimatedDays(0);
      hasAnimatedHeroCounterThisSession = true;
      return;
    }

    hasAnimatedHeroCounterThisSession = true;
    const duration = 900;
    const startTime = Date.now();
    let frameId: number;

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(ease * target);
      setAnimatedDays(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setAnimatedDays(target);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [timeTotals.days]);

  return (
    <View style={styles.journeyContent}>
      <Text style={styles.journeyLabel}>NOSSA JORNADA</Text>
      <Text style={styles.journeyTitle}>Juntos há</Text>
      <Text style={styles.journeyDaysDisplay}>{animatedDays} dias</Text>
      <View
        style={[
          styles.journeyBreakdownPill,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.18)'
              : 'rgba(240, 236, 254, 0.92)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.25)'
              : 'rgba(255, 255, 255, 0.85)',
          },
        ]}
      >
        <Text
          style={[
            styles.journeyBreakdownText,
            { color: isDark ? '#DDD6FE' : '#6D28D9' },
          ]}
        >
          {timeTotals.breakdownMonths}{' '}
          {timeTotals.breakdownMonths === 1 ? 'mês' : 'meses'} •{' '}
          {timeTotals.breakdownDays}{' '}
          {timeTotals.breakdownDays === 1 ? 'dia' : 'dias'} •{' '}
          {timeTotals.breakdownHours}h
        </Text>
      </View>
    </View>
  );
});

let homeDataCache: {
  coupleTitle: string;
  ownerFirstName: string;
  partnerFirstName: string;
  effectiveStartDateStr: string | null;
  recentMemory: RecentMemory | null;
  throwbackMemory: any;
  latestMessage: LatestMessage | null;
  nextMilestone: NextMilestone | null;
} | null = null;

let hasPlayedHomeEntranceInSession = false;

export default function HomeScreen() {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const router = useRouter();
  const { user } = useAuth();
  const { coupleId, anniversaryDate } = useCouple();
  const insets = useSafeAreaInsets();
  const { paddingBottom: tabBarPaddingBottom } = useTabBarHeight();

  const reducedMotion = useReducedMotion();
  const [shouldAnimateCascade] = useState(() => !hasPlayedHomeEntranceInSession && !reducedMotion);

  useEffect(() => {
    hasPlayedHomeEntranceInSession = true;
  }, []);

  const [coupleTitle, setCoupleTitle] = useState<string>(() => homeDataCache?.coupleTitle || 'Você & Meu Amor');
  const [ownerFirstName, setOwnerFirstName] = useState<string>(
    () => homeDataCache?.ownerFirstName || getFirstName(user?.user_metadata?.display_name || user?.email?.split('@')[0]) || ''
  );
  const [partnerFirstName, setPartnerFirstName] = useState<string>(() => homeDataCache?.partnerFirstName || '');
  const [effectiveStartDateStr, setEffectiveStartDateStr] = useState<string | null>(() => anniversaryDate || homeDataCache?.effectiveStartDateStr || null);

  useEffect(() => {
    if (anniversaryDate) {
      setEffectiveStartDateStr(anniversaryDate);
    }
  }, [anniversaryDate]);
  const [recentMemory, setRecentMemory] = useState<RecentMemory | null>(() => homeDataCache?.recentMemory ?? null);
  const [throwbackMemory, setThrowbackMemory] = useState<{
    id: string;
    title: string;
    memory_date: string;
    displayUrl: string | null;
    label: string;
  } | null>(() => homeDataCache?.throwbackMemory ?? null);
  const [latestMessage, setLatestMessage] = useState<LatestMessage | null>(() => homeDataCache?.latestMessage ?? null);
  const [nextMilestone, setNextMilestone] = useState<NextMilestone | null>(() => homeDataCache?.nextMilestone ?? null);
  const [loading, setLoading] = useState(() => !homeDataCache);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const celebration = useMemo(
    () => checkTodayCelebration(effectiveStartDateStr),
    [effectiveStartDateStr]
  );

  useEffect(() => {
    if (celebration && !reducedMotion) {
      setShowConfetti(true);
    }
  }, [celebration, reducedMotion]);

  const contextualGreeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = ownerFirstName?.trim() || getFirstName(user?.user_metadata?.display_name) || '';
    const nameSuffix = name && name.toLowerCase() !== 'você' ? `, ${name}` : '';
    if (hour >= 5 && hour < 12) {
      return `Bom dia${nameSuffix} ☀️`;
    }
    if (hour >= 12 && hour < 18) {
      return `Boa tarde${nameSuffix} 🌤️`;
    }
    return `Boa noite${nameSuffix} 🌙`;
  }, [ownerFirstName, user]);

  const heroImageUri = recentMemory?.displayUrl || recentMemory?.image_url;

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
      setOwnerFirstName(myFirstName);
      setPartnerFirstName(partnerFirstName);
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
        .select('id, title, memory_date, image_url, created_at')
        .eq('couple_id', coupleId)
        .order('memory_date', { ascending: false })
        .order('created_at', { ascending: false })
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

  // Busca memória antiga especial ("Faz tempo...")
  const loadThrowbackMemory = useCallback(async () => {
    if (!coupleId) return;

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 25);
      const dateLimitStr = thirtyDaysAgo.toISOString().split('T')[0];

      const { data: pastMemories } = await supabase
        .from('memories')
        .select('id, couple_id, title, memory_date, image_url, thumb_path, created_at')
        .eq('couple_id', coupleId)
        .lte('memory_date', dateLimitStr)
        .order('memory_date', { ascending: false })
        .limit(8);

      if (pastMemories && pastMemories.length > 0) {
        const now = Date.now();
        let best = pastMemories[0];
        let bestLabel = 'Há algum tempo:';

        for (const m of pastMemories) {
          const memTime = new Date(m.memory_date).getTime();
          const diffDays = Math.floor((now - memTime) / (1000 * 60 * 60 * 24));
          if (diffDays >= 340 && diffDays <= 390) {
            best = m;
            bestLabel = 'Há 1 ano vocês viveram isso:';
            break;
          } else if (diffDays >= 165 && diffDays <= 200) {
            best = m;
            bestLabel = 'Há 6 meses vocês viveram isso:';
            break;
          } else if (diffDays >= 75 && diffDays <= 110) {
            best = m;
            bestLabel = 'Há 3 meses vocês viveram isso:';
            break;
          } else if (diffDays >= 25 && diffDays <= 45) {
            best = m;
            bestLabel = 'Há 1 mês vocês viveram isso:';
            break;
          } else {
            const months = Math.floor(diffDays / 30);
            bestLabel = months > 1 ? `Há ${months} meses vocês viveram isso:` : 'Há algum tempo:';
          }
        }

        let displayUrl: string | null = null;
        const rawPath = (best.thumb_path || best.image_url)?.trim();
        if (rawPath) {
          let cleanPath = rawPath;
          if (cleanPath.includes('/memories/')) {
            cleanPath = cleanPath.split('/memories/')[1].split('?')[0];
          }
          cleanPath = cleanPath.replace(/^\/+/, '');
          try {
            const { data: signed } = await supabase.storage
              .from('memories')
              .createSignedUrl(cleanPath, 3600);
            if (signed?.signedUrl) {
              displayUrl = signed.signedUrl;
            }
          } catch {}
        }

        setThrowbackMemory({
          id: best.id,
          title: best.title,
          memory_date: best.memory_date,
          displayUrl,
          label: bestLabel,
        });
      } else {
        setThrowbackMemory(null);
      }
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

  useEffect(() => {
    homeDataCache = {
      coupleTitle,
      ownerFirstName,
      partnerFirstName,
      effectiveStartDateStr,
      recentMemory,
      throwbackMemory,
      latestMessage,
      nextMilestone,
    };
  }, [coupleTitle, ownerFirstName, partnerFirstName, effectiveStartDateStr, recentMemory, throwbackMemory, latestMessage, nextMilestone]);

  // Carrega todos os dados simultaneamente (SWR: sem travar a tela se já houver cache)
  const loadAllData = useCallback(async (silent = false) => {
    if (!silent && !homeDataCache) {
      setLoading(true);
    }
    try {
      await Promise.all([
        loadCoupleDetails(),
        loadCoupleDays(),
        loadRecentMemory(),
        loadThrowbackMemory(),
        loadLatestMessage(),
        loadNextMilestone(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadCoupleDetails, loadCoupleDays, loadRecentMemory, loadThrowbackMemory, loadLatestMessage, loadNextMilestone]);

  const callbacksRef = useRef({
    loadCoupleDetails,
    loadCoupleDays,
    loadRecentMemory,
    loadThrowbackMemory,
    loadLatestMessage,
    loadNextMilestone,
  });
  callbacksRef.current = {
    loadCoupleDetails,
    loadCoupleDays,
    loadRecentMemory,
    loadThrowbackMemory,
    loadLatestMessage,
    loadNextMilestone,
  };

  useEffect(() => {
    if (!coupleId) return;

    loadAllData();

    // Sincronização em tempo real via Supabase Realtime
    const channel = supabase
      .channel(`home_channel_${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couple_members', filter: `couple_id=eq.${coupleId}` },
        () => callbacksRef.current.loadCoupleDetails()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
        () => callbacksRef.current.loadCoupleDays()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memories', filter: `couple_id=eq.${coupleId}` },
        () => {
          callbacksRef.current.loadRecentMemory();
          callbacksRef.current.loadThrowbackMemory();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `couple_id=eq.${coupleId}` },
        () => callbacksRef.current.loadLatestMessage()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'special_dates', filter: `couple_id=eq.${coupleId}` },
        () => callbacksRef.current.loadNextMilestone()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, loadAllData]);

  // Recarrega os dados ao focar na tela (garante que alterações feitas em Perfil/outras abas apareçam imediatamente)
  useFocusEffect(
    useCallback(() => {
      if (coupleId) {
        callbacksRef.current.loadCoupleDays();
        callbacksRef.current.loadCoupleDetails();
      }
    }, [coupleId])
  );

  // Ação de Pull-to-Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

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
            paddingBottom: tabBarPaddingBottom,
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
            {/* Saudação afetuosa contextual com o primeiro nome do parceiro(a) */}
            <View style={styles.greetingContainer}>
              <Text style={[styles.greetingText, { color: isDark ? '#F3F1FB' : '#1E1A33' }]}>
                {contextualGreeting}
              </Text>
            </View>

            {/* Card Comemorativo de Marco Especial / Aniversário com Confete */}
            {celebration ? (
              <Animated.View
                entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(0) : undefined}
                style={styles.celebrationWrapper}
              >
                <View
                  style={[
                    styles.celebrationCard,
                    {
                      backgroundColor: isDark ? '#261F45' : '#FFF5F8',
                      borderColor: isDark ? 'rgba(245, 143, 168, 0.35)' : 'rgba(245, 143, 168, 0.45)',
                      shadowColor: '#F58FA8',
                    },
                  ]}
                >
                  {showConfetti && <ConfettiView onComplete={() => setShowConfetti(false)} />}
                  <View style={styles.celebrationHeader}>
                    <View
                      style={[
                        styles.celebrationBadge,
                        {
                          backgroundColor: isDark
                            ? 'rgba(245, 143, 168, 0.22)'
                            : 'rgba(245, 143, 168, 0.16)',
                        },
                      ]}
                    >
                      <Ionicons name="sparkles" size={13} color={themeTokens.accent} />
                      <Text style={[styles.celebrationBadgeText, { color: themeTokens.accent }]}>
                        {celebration.badge}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.celebrationTitle,
                      { color: isDark ? '#FFFFFF' : '#1E1A33' },
                    ]}
                  >
                    {celebration.title}
                  </Text>
                  <Text
                    style={[
                      styles.celebrationSubtitle,
                      { color: isDark ? '#DDD6FE' : '#5B5675' },
                    ]}
                  >
                    {celebration.subtitle}
                  </Text>
                </View>
              </Animated.View>
            ) : null}

            {/* 1. Hero Card: "Nossa jornada" com foto grande, degradê escuro e contador */}
            <Animated.View
              entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(0) : undefined}
            >
              <PressableScale
                style={[
                  styles.heroCard,
                  {
                    backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
                    shadowColor: '#7C6FE0',
                  },
                ]}
                onPress={handleOpenMemories}
                activeOpacity={0.92}
              >
                {/* Foto grande da memória ou fallback suave */}
                {heroImageUri ? (
                  <ExpoImage
                    source={{ uri: heroImageUri }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                ) : (
                  <LinearGradient
                    colors={
                      isDark
                        ? ['#2E2554', '#1F1B3A']
                        : ['#EDE9FE', '#DDD6FE']
                    }
                    style={StyleSheet.absoluteFill}
                  />
                )}

                {/* Degradê escuro da esquerda para a direita (sem blur, contraste AA perfeito) */}
                <LinearGradient
                  colors={[
                    'rgba(15, 12, 28, 0.94)',
                    'rgba(15, 12, 28, 0.78)',
                    'rgba(15, 12, 28, 0.32)',
                    'rgba(15, 12, 28, 0.02)',
                  ]}
                  locations={[0, 0.44, 0.76, 1]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* Chip "♥ Nós" no topo esquerdo */}
                <View style={styles.photoBadge}>
                  <Ionicons name="heart" size={13} color="#FFFFFF" />
                  <Text style={styles.photoBadgeText}>Nós</Text>
                </View>

                {/* Contador "Nossa Jornada" */}
                <CoupleJourneyCounter
                  startDate={effectiveStartDateStr}
                  isDark={isDark}
                  themeTokens={themeTokens}
                />
              </PressableScale>
            </Animated.View>

            {/* 2. Três atalhos (Recado, Memória, Datas) */}
            <Animated.View
              entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(60) : undefined}
              style={styles.shortcutsRow}
            >
              <PressableScale
                style={[
                  styles.shortcutCard,
                  {
                    backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
                  },
                ]}
                onPress={handleOpenMessages}
              >
                <Ionicons name="chatbubble" size={17} color={themeTokens.primary} />
                <Text style={[styles.shortcutText, { color: themeTokens.primary }]}>Recado</Text>
              </PressableScale>

              <PressableScale
                style={[
                  styles.shortcutCard,
                  {
                    backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
                  },
                ]}
                onPress={handleOpenMemories}
              >
                <Ionicons name="camera" size={18} color={themeTokens.primary} />
                <Text style={[styles.shortcutText, { color: themeTokens.primary }]}>Memória</Text>
              </PressableScale>

              <PressableScale
                style={[
                  styles.shortcutCard,
                  {
                    backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
                  },
                ]}
                onPress={handleOpenDates}
              >
                <Ionicons name="calendar" size={17} color={themeTokens.primary} />
                <Text style={[styles.shortcutText, { color: themeTokens.primary }]}>Datas</Text>
              </PressableScale>
            </Animated.View>

            {/* 3. Card "Próximo momento" */}
            {nextMilestone ? (
              <Animated.View
                entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(120) : undefined}
              >
                <PressableScale
                  style={[
                    styles.milestoneCard,
                    {
                      backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
                    },
                  ]}
                  onPress={handleOpenDates}
                >
                  <View
                    style={[
                      styles.milestoneIconBox,
                      {
                        backgroundColor: isDark ? 'rgba(157, 146, 240, 0.16)' : '#EFECFC',
                      },
                    ]}
                  >
                    <Ionicons name="sparkles" size={20} color={themeTokens.primary} />
                  </View>

                  <View style={styles.milestoneContent}>
                    <Text style={[styles.milestoneLabel, { color: isDark ? '#AAA5B8' : '#7E7699' }]}>
                      PRÓXIMO MOMENTO
                    </Text>
                    <Text
                      style={[styles.milestoneTitle, { color: isDark ? '#F3F1FB' : '#1E1A33' }]}
                      numberOfLines={2}
                    >
                      {nextMilestone.title}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.milestoneChip,
                      {
                        backgroundColor: isDark ? 'rgba(157, 146, 240, 0.20)' : '#F3E8FF',
                      },
                    ]}
                  >
                    <Text style={[styles.milestoneChipText, { color: isDark ? '#C4B5FD' : '#7C3AED' }]}>
                      {nextMilestone.daysRemaining === 0
                        ? 'É hoje!'
                        : `em ${nextMilestone.daysRemaining}d`}
                    </Text>
                  </View>
                </PressableScale>
              </Animated.View>
            ) : null}

            {/* 4. Seção "Memória recente" */}
            <Animated.View
              entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(180) : undefined}
            >
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeaderTitle, { color: isDark ? '#AAA5B8' : '#7E7699' }]}>
                  MEMÓRIA RECENTE
                </Text>
                <PressableScale onPress={handleOpenMemories}>
                  <Text style={[styles.sectionHeaderLink, { color: themeTokens.primary }]}>
                    Ver todas
                  </Text>
                </PressableScale>
              </View>

              {recentMemory ? (
                <PressableScale
                  style={[
                    styles.memoryCard,
                    {
                      backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
                    },
                  ]}
                  onPress={handleOpenMemories}
                >
                  <View
                    style={[
                      styles.memoryThumbBox,
                      {
                        backgroundColor: isDark ? 'rgba(157, 146, 240, 0.12)' : '#EFECFC',
                      },
                    ]}
                  >
                    {recentMemory.displayUrl || recentMemory.image_url ? (
                      <ExpoImage
                        source={{ uri: (recentMemory.displayUrl || recentMemory.image_url) as string }}
                        style={styles.memoryThumbImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                      />
                    ) : (
                      <Ionicons name="images-outline" size={22} color={themeTokens.primary} />
                    )}
                  </View>

                  <View style={styles.memoryContent}>
                    <Text
                      style={[styles.memoryTitleText, { color: isDark ? '#F3F1FB' : '#1E1A33' }]}
                      numberOfLines={2}
                    >
                      {recentMemory.title}
                    </Text>
                    <Text style={[styles.memoryDateText, { color: isDark ? '#AAA5B8' : '#7E7699' }]}>
                      {formatMemoryDate(recentMemory.memory_date)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.memoryChevronBox,
                      {
                        backgroundColor: isDark ? 'rgba(157, 146, 240, 0.12)' : 'rgba(124, 111, 224, 0.08)',
                      },
                    ]}
                  >
                    <Ionicons name="chevron-forward" size={15} color={themeTokens.primary} />
                  </View>
                </PressableScale>
              ) : (
                <PressableScale
                  style={[
                    styles.memoryCard,
                    {
                      backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
                    },
                  ]}
                  onPress={handleOpenMemories}
                >
                  <View
                    style={[
                      styles.memoryThumbBox,
                      {
                        backgroundColor: isDark ? 'rgba(157, 146, 240, 0.12)' : '#EFECFC',
                      },
                    ]}
                  >
                    <Ionicons name="sparkles-outline" size={22} color={themeTokens.primary} />
                  </View>

                  <View style={styles.memoryContent}>
                    <Text style={[styles.memoryTitleText, { color: isDark ? '#F3F1FB' : '#1E1A33' }]}>
                      Guarde sua primeira memória
                    </Text>
                    <Text style={[styles.memoryDateText, { color: isDark ? '#AAA5B8' : '#7E7699' }]}>
                      Eternize os melhores momentos de vocês
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.memoryChevronBox,
                      {
                        backgroundColor: isDark ? 'rgba(157, 146, 240, 0.12)' : 'rgba(124, 111, 224, 0.08)',
                      },
                    ]}
                  >
                    <Ionicons name="add" size={17} color={themeTokens.primary} />
                  </View>
                </PressableScale>
              )}
            </Animated.View>

            {/* 5. Seção "Faz tempo..." sugerindo recordação de meses atrás */}
            {throwbackMemory ? (
              <Animated.View
                entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(240) : undefined}
                style={{ marginTop: 20 }}
              >
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeaderTitle, { color: isDark ? '#AAA5B8' : '#7E7699' }]}>
                    FAZ TEMPO...
                  </Text>
                  <PressableScale onPress={handleOpenMemories}>
                    <Text style={[styles.sectionHeaderLink, { color: themeTokens.primary }]}>
                      Ver todas
                    </Text>
                  </PressableScale>
                </View>

                <PressableScale
                  style={[
                    styles.memoryCard,
                    {
                      backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
                    },
                  ]}
                  onPress={handleOpenMemories}
                >
                  <View
                    style={[
                      styles.memoryThumbBox,
                      {
                        backgroundColor: isDark ? 'rgba(157, 146, 240, 0.12)' : '#EFECFC',
                      },
                    ]}
                  >
                    {throwbackMemory.displayUrl ? (
                      <ExpoImage
                        source={{ uri: throwbackMemory.displayUrl }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                      />
                    ) : (
                      <Ionicons name="time-outline" size={22} color={themeTokens.primary} />
                    )}
                  </View>

                  <View style={styles.memoryContent}>
                    <Text style={[styles.throwbackTag, { color: themeTokens.accent }]}>
                      {throwbackMemory.label}
                    </Text>
                    <Text
                      style={[styles.memoryTitleText, { color: isDark ? '#F3F1FB' : '#1E1A33' }]}
                      numberOfLines={1}
                    >
                      {throwbackMemory.title}
                    </Text>
                    <Text style={[styles.memoryDateText, { color: isDark ? '#AAA5B8' : '#7E7699' }]}>
                      {throwbackMemory.memory_date.split('-').reverse().join('/')}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.memoryChevronBox,
                      {
                        backgroundColor: isDark ? 'rgba(157, 146, 240, 0.12)' : 'rgba(124, 111, 224, 0.08)',
                      },
                    ]}
                  >
                    <Ionicons name="chevron-forward" size={17} color={themeTokens.primary} />
                  </View>
                </PressableScale>
              </Animated.View>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Cabeçalho Fixo com Blur e Transparência Apple Liquid Glass */}
      <View style={[styles.blurredHeaderContainer, { paddingTop: insets.top }]}>
        <GlassSurface
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
    height: 245,
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  skeletonImage: {
    width: '100%',
    height: 130,
    borderRadius: 18,
  },
  skeletonPill: {
    width: '65%',
    height: 38,
    borderRadius: 19,
    alignSelf: 'flex-start',
  },
  skeletonShortcut: {
    flex: 1,
    height: 52,
    borderRadius: 18,
  },
  skeletonRowCard: {
    width: '100%',
    height: 80,
    borderRadius: 20,
    borderWidth: 1,
  },

  /* ── Greeting ── */
  greetingContainer: {
    paddingTop: 4,
    paddingBottom: 12,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Nunito', android: 'Nunito', default: 'sans-serif' }),
    letterSpacing: -0.3,
  },

  /* ── Celebration Card ── */
  celebrationWrapper: {
    marginBottom: 16,
  },
  celebrationCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  celebrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  celebrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  celebrationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Nunito', android: 'Nunito', default: 'sans-serif' }),
    letterSpacing: 0.2,
  },
  celebrationTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Nunito', android: 'Nunito', default: 'sans-serif' }),
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  celebrationSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Platform.select({ ios: 'Nunito', android: 'Nunito', default: 'sans-serif' }),
    lineHeight: 18,
  },
  throwbackTag: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Nunito', android: 'Nunito', default: 'sans-serif' }),
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  /* ── Hero Card ── */
  heroCard: {
    width: '100%',
    height: 245,
    borderRadius: 28,
    overflow: 'hidden',
    padding: 20,
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#7C6FE0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  photoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* ── Journey Counter ── */
  journeyContent: {
    alignSelf: 'flex-start',
  },
  journeyLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 2,
  },
  journeyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  journeyDaysDisplay: {
    fontSize: 40,
    fontWeight: '800',
    color: '#DDD6FE',
    letterSpacing: -0.8,
    lineHeight: 44,
    marginBottom: 10,
    fontVariant: ['tabular-nums'],
  },
  journeyBreakdownPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  journeyBreakdownText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  /* ── Atalhos (Shortcuts) ── */
  shortcutsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  shortcutCard: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#7C6FE0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  shortcutText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  /* ── Próximo Momento ── */
  milestoneCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    shadowColor: '#7C6FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  milestoneIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 21,
  },
  milestoneChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  milestoneChipText: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },

  /* ── Memória Recente ── */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionHeaderLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  memoryCard: {
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    shadowColor: '#7C6FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  memoryThumbBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  memoryThumbImage: {
    width: '100%',
    height: '100%',
  },
  memoryContent: {
    flex: 1,
  },
  memoryTitleText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  memoryDateText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  memoryChevronBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

