import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  TouchableOpacity,
  FlatList,
  AppState,
  AppStateStatus,
  AccessibilityInfo,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
  Easing,
  LinearTransition,
  useReducedMotion,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import { usePathname } from 'expo-router';
import { AnimatedTouchable } from '../../components/AnimatedTouchable';
import { PressableScale } from '../../components/ui/PressableScale';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';
import { LiquidGlassView } from '../../components/ui/LiquidGlassView';
import { GlassSurface } from '../../components/ui/GlassSurface';
import { EmptyState } from '../../components/ui/EmptyState';
import { AppHeader } from '../../components/AppHeader';
import { useToast } from '../../context/ToastContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { supabase } from '../../lib/supabase';
import { THEME } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../constants/theme';
import { useTabBarHeight } from '../../hooks/useTabBarHeight';

export interface SpecialDate {
  id: string;
  couple_id: string;
  title: string;
  category: string;
  event_date: string;
  created_by?: string;
  created_at: string;
}

interface CategoryOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'Viagem', label: 'Viagem', icon: 'airplane-outline', color: '#2B6CB0', bg: 'rgba(43, 108, 176, 0.12)' },
  { id: 'Encontro', label: 'Encontro', icon: 'restaurant-outline', color: '#C53030', bg: 'rgba(197, 48, 48, 0.12)' },
  { id: 'Comemoração', label: 'Comemoração', icon: 'sparkles', color: '#8E7CE8', bg: 'rgba(142, 124, 232, 0.15)' },
  { id: 'Aniversário', label: 'Aniversário', icon: 'gift-outline', color: '#DD6B20', bg: 'rgba(221, 107, 32, 0.12)' },
  { id: 'Outro', label: 'Outro', icon: 'bookmark-outline', color: '#4A5568', bg: 'rgba(74, 85, 104, 0.12)' },
];

const getCategoryMeta = (catName?: string): CategoryOption => {
  const found = CATEGORIES.find((c) => c.id.toLowerCase() === (catName || '').toLowerCase());
  return (
    found || {
      id: catName || 'Outro',
      label: catName || 'Outro',
      icon: 'sparkles',
      color: '#8E7CE8',
      bg: 'rgba(142, 124, 232, 0.12)',
    }
  );
};

const parseEventDate = (dateString?: string): Date => {
  if (!dateString) return new Date();
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return new Date();
  if (dateString.includes('T00:00:00')) {
    return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
  }
  return d;
};

const formatFullDatePTBR = (dateString?: string): string => {
  if (!dateString) return '';
  const d = parseEventDate(dateString);
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatTimePTBR = (dateString?: string): string => {
  if (!dateString) return '';
  if (dateString.includes('T00:00:00')) return '';
  const d = parseEventDate(dateString);
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatHeroDatePTBR = (dateString?: string): string => {
  if (!dateString) return '';
  const d = parseEventDate(dateString);
  const dateStr = d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const isMidnightUtc = dateString.includes('T00:00:00');
  if (isMidnightUtc) {
    return dateStr;
  }
  const timeStr = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return timeStr ? `${dateStr} às ${timeStr}` : dateStr;
};

const formatListItemDateTime = (dateString?: string): string => {
  if (!dateString) return '';
  const d = parseEventDate(dateString);
  const dateStr = d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const isMidnightUtc = dateString.includes('T00:00:00');
  if (isMidnightUtc) {
    return dateStr;
  }
  const timeStr = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return timeStr ? `${dateStr} • ${timeStr}` : dateStr;
};

const formatEventDateTime = (dateString?: string): string => {
  return formatListItemDateTime(dateString);
};

function Floating3DHeart() {
  const pathname = usePathname();
  const isFocused = pathname.includes('dates') || pathname === '/';
  const [reducedMotion, setReducedMotion] = useState(false);
  const [appActive, setAppActive] = useState(true);
  const translateY = useSharedValue(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      setAppActive(state === 'active');
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reducedMotion || !isFocused || !appActive) {
      cancelAnimation(translateY);
      translateY.value = 0;
      return;
    }

    translateY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(4, { duration: 2000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(translateY);
    };
  }, [isFocused, reducedMotion, appActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[heartStyles.heroHeartContainer, animatedStyle]}>
      <Image
        source={require('../../assets/images/heart-3d.webp')}
        style={heartStyles.heroHeartImage}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    </Animated.View>
  );
}

const heartStyles = StyleSheet.create({
  heroHeartContainer: {
    position: 'absolute',
    right: -10,
    top: -12,
    width: 140,
    height: 140,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeartImage: {
    width: 135,
    height: 135,
  },
});

interface CountdownDigitsProps {
  targetDate: string;
  createdAt?: string;
}

let hasAnimatedProgressThisSession = false;

interface AnimatedDigitStringProps {
  value: string;
  style?: any;
  reducedMotion?: boolean;
}

const AnimatedDigitString = React.memo(function AnimatedDigitString({
  value,
  style,
  reducedMotion,
}: AnimatedDigitStringProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Text
        key={value}
        entering={reducedMotion ? undefined : FadeInDown.duration(200)}
        exiting={reducedMotion ? undefined : FadeOutDown.duration(200)}
        style={[style, { fontVariant: ['tabular-nums'], position: 'absolute' }]}
      >
        {value}
      </Animated.Text>
      <Text style={[style, { opacity: 0, fontVariant: ['tabular-nums'] }]}>{value}</Text>
    </View>
  );
});

const CountdownDigits = React.memo(function CountdownDigits({ targetDate, createdAt }: CountdownDigitsProps) {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const styles = useMemo(() => getStyles(themeTokens, isDark), [themeTokens, isDark]);
  const reducedMotion = useReducedMotion();

  const calculateDiff = useCallback(() => {
    const target = parseEventDate(targetDate).getTime();
    const diff = target - Date.now();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isNow: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isNow: false };
  }, [targetDate]);

  const [countdown, setCountdown] = useState(calculateDiff);

  useEffect(() => {
    setCountdown(calculateDiff());
    let interval: ReturnType<typeof setInterval> | null = null;

    const startTimer = () => {
      if (!interval) {
        interval = setInterval(() => {
          setCountdown(calculateDiff());
        }, 1000);
      }
    };

    const stopTimer = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    startTimer();

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        setCountdown(calculateDiff());
        startTimer();
      } else {
        stopTimer();
      }
    };

    const handleVisibility = () => {
      if (typeof document !== 'undefined') {
        if (document.visibilityState === 'visible') {
          setCountdown(calculateDiff());
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
  }, [calculateDiff]);

  // Cálculo de progresso decorrido (0 a 1)
  const targetProgress = useMemo(() => {
    const targetMs = new Date(targetDate).getTime();
    if (isNaN(targetMs)) return 0.5;
    const fallbackCreatedMs = targetMs - 30 * 24 * 60 * 60 * 1000;
    const parsedCreatedMs = createdAt ? new Date(createdAt).getTime() : NaN;
    const validCreatedMs = (!isNaN(parsedCreatedMs) && parsedCreatedMs < targetMs)
      ? parsedCreatedMs
      : fallbackCreatedMs;
    const totalDuration = Math.max(1, targetMs - validCreatedMs);
    const elapsed = Math.max(0, Math.min(totalDuration, Date.now() - validCreatedMs));
    return Math.max(0.04, Math.min(1, elapsed / totalDuration));
  }, [targetDate, createdAt]);

  const progress = useSharedValue(hasAnimatedProgressThisSession ? targetProgress : 0);

  useEffect(() => {
    if (!hasAnimatedProgressThisSession) {
      hasAnimatedProgressThisSession = true;
      progress.value = withTiming(targetProgress, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = withTiming(targetProgress, { duration: 300 });
    }
  }, [targetProgress]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${Math.max(4, Math.min(100, progress.value * 100))}%`,
  }));

  if (countdown.isNow) {
    return (
      <View style={styles.eventHappeningBox}>
        <Ionicons name="heart" size={20} color="#7C3AED" />
        <Text style={styles.eventHappeningText}>É hoje! Aproveitem cada segundo.</Text>
      </View>
    );
  }

  return (
    <View style={styles.lowerCountdownPanel}>
      {/* Barra de Progresso com coração na ponta */}
      <View style={styles.progressBarTrack}>
        <Animated.View style={[styles.progressBarFill, progressBarStyle]}>
          <LinearGradient
            colors={['#8E7CE8', '#7C3AED']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.progressTipHeart}>
            <Ionicons name="heart" size={8} color="#FFFFFF" />
          </View>
        </Animated.View>
      </View>

      {/* 4 Colunas: DIAS / HORAS / MINUTOS / SEGUNDOS */}
      <View style={styles.countdownColumnsRow}>
        <View style={styles.countColumn}>
          <AnimatedDigitString
            value={String(countdown.days)}
            style={styles.countNumber}
            reducedMotion={reducedMotion}
          />
          <Text style={styles.countLabel}>DIAS</Text>
        </View>

        <View style={styles.columnDivider} />

        <View style={styles.countColumn}>
          <AnimatedDigitString
            value={String(countdown.hours).padStart(2, '0')}
            style={styles.countNumber}
            reducedMotion={reducedMotion}
          />
          <Text style={styles.countLabel}>HORAS</Text>
        </View>

        <View style={styles.columnDivider} />

        <View style={styles.countColumn}>
          <AnimatedDigitString
            value={String(countdown.minutes).padStart(2, '0')}
            style={styles.countNumber}
            reducedMotion={reducedMotion}
          />
          <Text style={styles.countLabel}>MINUTOS</Text>
        </View>

        <View style={styles.columnDivider} />

        <View style={styles.countColumn}>
          <AnimatedDigitString
            value={String(countdown.seconds).padStart(2, '0')}
            style={styles.countNumber}
            reducedMotion={reducedMotion}
          />
          <Text style={styles.countLabel}>SEGUNDOS</Text>
        </View>
      </View>
    </View>
  );
});

let cachedDates: SpecialDate[] | null = null;

export default function DatesScreen() {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const styles = getStyles(themeTokens, isDark);
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const insets = useSafeAreaInsets();
  const { paddingBottom: tabBarPaddingBottom } = useTabBarHeight();
  const reducedMotion = useReducedMotion();
  const { showToast } = useToast();
  const pendingDeleteRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const [dates, setDates] = useState<SpecialDate[]>(() => cachedDates || []);
  const [loading, setLoading] = useState(() => !cachedDates);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    return () => {
      pendingDeleteRef.current.forEach((timer) => clearTimeout(timer));
      pendingDeleteRef.current.clear();
    };
  }, []);

  // Filtro de exibição ('upcoming' | 'past')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Estados para Adicionar/Editar Nova Data
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Comemoração');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Busca as datas especiais do casal
  const loadDates = useCallback(async (silent = false) => {
    if (!coupleId) return;

    try {
      if (!silent && !cachedDates) setLoading(true);
      const { data, error } = await supabase
        .from('special_dates')
        .select('id, couple_id, title, event_date, category, created_at, created_by')
        .eq('couple_id', coupleId)
        .order('event_date', { ascending: true });

      if (error) throw error;
      cachedDates = data || [];
      setDates(data || []);
    } catch {
      // Ignora silenciosamente
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) return;
    loadDates();

    // Sincronização em tempo real (Supabase Realtime)
    const channel = supabase
      .channel(`special_dates_tab_${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'special_dates',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          loadDates(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, loadDates]);

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDates();
    setRefreshing(false);
  };

  // Separação em Próximos e Histórico (sem dependência de timer de segundos)
  const { upcomingEvents, pastEvents, nextHeroEvent } = useMemo(() => {
    const nowTime = Date.now();
    const upcoming: SpecialDate[] = [];
    const past: SpecialDate[] = [];

    dates.forEach((item) => {
      const eventTime = parseEventDate(item.event_date).getTime();
      if (eventTime >= nowTime) {
        upcoming.push(item);
      } else {
        past.push(item);
      }
    });

    upcoming.sort(
      (a, b) => parseEventDate(a.event_date).getTime() - parseEventDate(b.event_date).getTime()
    );

    past.sort(
      (a, b) => parseEventDate(b.event_date).getTime() - parseEventDate(a.event_date).getTime()
    );

    return {
      upcomingEvents: upcoming,
      pastEvents: past,
      nextHeroEvent: upcoming.length > 0 ? upcoming[0] : null,
    };
  }, [dates]);

  // 3. Salvar nova data
  const handleSaveDate = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Título obrigatório', 'Dê um nome para esta data especial.');
      return;
    }

    if (!coupleId || !user?.id) return;

    setSubmitting(true);
    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');

      let finalIso: string;
      if (selectedTime) {
        const hours = String(selectedTime.getHours()).padStart(2, '0');
        const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
        const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), 0);
        finalIso = d.toISOString();
      } else {
        // Horário opcional não definido: salva a data pura (meia-noite UTC)
        const d = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0));
        finalIso = d.toISOString();
      }

      if (editingDateId) {
        const { error } = await supabase.from('special_dates').update({
          title: newTitle.trim(),
          category: newCategory,
          event_date: finalIso,
        }).eq('id', editingDateId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('special_dates').insert({
          couple_id: coupleId,
          created_by: user.id,
          title: newTitle.trim(),
          category: newCategory,
          event_date: finalIso,
        });
        if (error) throw error;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAddModalVisible(false);
      setEditingDateId(null);
      setNewTitle('');
      setNewCategory('Comemoração');
      const resetD = new Date();
      resetD.setDate(resetD.getDate() + 7);
      resetD.setHours(0, 0, 0, 0);
      setSelectedDate(resetD);
      setSelectedTime(null);
      setShowDatePicker(false);
      setShowTimePicker(false);

      await loadDates();
    } catch (err: any) {
      Alert.alert('Erro ao salvar data', err.message || 'Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditDate = useCallback((item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingDateId(item.id);
    setNewTitle(item.title);
    setNewCategory(item.category || 'Comemoração');
    const d = parseEventDate(item.event_date);
    setSelectedDate(d);
    const isMidnightUtc = item.event_date.includes('T00:00:00');
    setSelectedTime(isMidnightUtc ? null : d);
    setIsAddModalVisible(true);
  }, []);

  const handleDeleteDate = useCallback((id: string, title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const proceedDelete = async () => {
      setDates((prev) => prev.filter((d) => d.id !== id));
      try {
        const { error } = await supabase.from('special_dates').delete().eq('id', id);
        if (error) throw error;
        showToast({ message: `"${title}" removida` });
      } catch (err: any) {
        loadDates(true);
        showToast({ message: 'Erro ao remover.', type: 'error' });
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Tem certeza que deseja remover "${title}"?`)) { proceedDelete(); }
    } else {
      Alert.alert('Remover', `Deseja excluir "${title}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: proceedDelete },
      ]);
    }
  }, [loadDates, showToast]);

  const onDateChange = (_event: DateTimePickerChangeEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      const updated = new Date(selectedDate);
      updated.setFullYear(date.getFullYear());
      updated.setMonth(date.getMonth());
      updated.setDate(date.getDate());
      setSelectedDate(updated);
    }
  };

  const onTimeChange = (_event: DateTimePickerChangeEvent, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (time) {
      setSelectedTime(time);
    }
  };

  const renderEventItem = useCallback(
    ({ item }: { item: SpecialDate }) => {
      const isPast = activeTab === 'past';
      const meta = getCategoryMeta(item.category);
      return (
        <Animated.View
          key={item.id}
          layout={reducedMotion ? undefined : LinearTransition.duration(250)}
          style={{ marginBottom: 12 }}
        >
          <PressableScale
            style={styles.eventCardTouchable}
            onPress={() => handleEditDate(item)}
            onLongPress={() => handleDeleteDate(item.id, item.title)}
          >
            <View style={[styles.eventCard, isPast && styles.pastEventCard]}>
              <View
                style={[
                  styles.eventIconSquare,
                  {
                    backgroundColor: isPast
                      ? (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(104, 101, 120, 0.08)')
                      : (isDark ? 'rgba(142, 124, 232, 0.16)' : '#F3EFFE'),
                  },
                ]}
              >
                <Ionicons
                  name={meta.icon}
                  size={22}
                  color={isPast ? '#686578' : themeTokens.primary}
                />
              </View>

              <View style={styles.eventInfo}>
                <View style={styles.eventMetaRow}>
                  <View
                    style={[
                      styles.miniCategoryPill,
                      {
                        backgroundColor: isPast
                          ? (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(104, 101, 120, 0.08)')
                          : (isDark ? 'rgba(142, 124, 232, 0.15)' : '#F0EDFD'),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.miniCategoryText,
                        { color: isPast ? themeTokens.textSecondary : themeTokens.primary },
                      ]}
                    >
                      {meta.label}
                    </Text>
                  </View>
                  {isPast && <Text style={styles.concludedBadge}>CONCLUÍDO</Text>}
                </View>

                <Text
                  style={[styles.eventTitle, isPast && styles.pastEventTitle]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>

                <Text style={styles.eventDateText}>
                  {formatListItemDateTime(item.event_date)}
                </Text>
              </View>

              <View style={styles.chevronButton}>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isPast ? themeTokens.textSecondary : themeTokens.primary}
                />
              </View>
            </View>
          </PressableScale>
        </Animated.View>
      );
    },
    [activeTab, themeTokens.textSecondary, themeTokens.primary, isDark, styles, handleEditDate, handleDeleteDate]
  );

  const listHeader = useMemo(() => {
    return (
      <View>
        {/* 1. Hero Card "Próximo momento" */}
        {nextHeroEvent ? (
          <View style={styles.heroCardContainer}>
            <LinearGradient
              colors={
                isDark
                  ? ['#1F1B3A', '#261F45', '#331F33']
                  : ['#FFFFFF', '#F6F0FE', '#FDF2F7']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradientBackground}
            >
              {/* Seção Superior */}
              <View style={styles.heroTopSection}>
                <View style={styles.heroTextContent}>
                  {/* Chip de categoria */}
                  <View
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isDark
                          ? 'rgba(142, 124, 232, 0.20)'
                          : '#F0EDFD',
                      },
                    ]}
                  >
                    <Ionicons
                      name={getCategoryMeta(nextHeroEvent.category).icon}
                      size={13}
                      color={themeTokens.primary}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: themeTokens.primary },
                      ]}
                    >
                      {getCategoryMeta(nextHeroEvent.category).label}
                    </Text>
                  </View>

                  <Text style={styles.heroTag}>PRÓXIMO MOMENTO</Text>

                  <Text style={styles.heroTitle} numberOfLines={2}>
                    {nextHeroEvent.title}
                  </Text>

                  <View style={styles.heroDateRow}>
                    <View style={styles.heroCalendarIconBox}>
                      <Ionicons name="calendar" size={13} color={themeTokens.primary} />
                    </View>
                    <Text style={styles.heroDateText}>
                      {formatHeroDatePTBR(nextHeroEvent.event_date)}
                    </Text>
                  </View>
                </View>

                {/* Coração 3D Flutuante */}
                <Floating3DHeart />
              </View>

              {/* Painel Inferior Branco com Progresso e 4 Colunas */}
              <CountdownDigits
                targetDate={nextHeroEvent.event_date}
                createdAt={nextHeroEvent.created_at}
              />
            </LinearGradient>
          </View>
        ) : (
          <View>
            <View style={styles.emptyHeroCard}>
              <View style={styles.emptyHeroIconCircle}>
                <Ionicons name="sparkles-outline" size={26} color={themeTokens.primary} />
              </View>
              <Text style={styles.emptyHeroTitle}>Nenhum evento agendado</Text>
              <Text style={styles.emptyHeroSubtitle}>
                Que tal planejar o próximo momento juntos e acompanhar a contagem regressiva?
              </Text>
              <PressableScale
                style={styles.emptyHeroBtn}
                onPress={() => {
                  setIsAddModalVisible(true);
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color={themeTokens.primary} />
                <Text style={styles.emptyHeroBtnText}>Agendar momento</Text>
              </PressableScale>
            </View>
          </View>
        )}

        {/* 2. Filtro de Abas: Próximos vs Histórico */}
        <View style={{ marginBottom: 16 }}>
          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              style={[styles.segmentItem, activeTab === 'upcoming' && styles.segmentItemActive]}
              onPress={() => setActiveTab('upcoming')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={activeTab === 'upcoming' ? "calendar" : "calendar-outline"} 
                size={15} 
                color={activeTab === 'upcoming' ? '#FFFFFF' : themeTokens.textSecondary} 
              />
              <Text style={activeTab === 'upcoming' ? styles.segmentTextActive : styles.segmentText}>
                Próximos ({upcomingEvents.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentItem, activeTab === 'past' && styles.segmentItemActive]}
              onPress={() => setActiveTab('past')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={activeTab === 'past' ? "time" : "time-outline"} 
                size={15} 
                color={activeTab === 'past' ? '#FFFFFF' : themeTokens.textSecondary} 
              />
              <Text style={activeTab === 'past' ? styles.segmentTextActive : styles.segmentText}>
                Histórico ({pastEvents.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [nextHeroEvent, themeTokens, isDark, activeTab, upcomingEvents.length, pastEvents.length, styles]);

  const listEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
        </View>
      );
    }

    if (activeTab === 'upcoming') {
      return (
        <EmptyState
          icon="calendar-outline"
          title="Sem datas agendadas por enquanto"
          subtitle="Que tal planejar um novo momento ou viagem especial de vocês?"
          actionLabel="Agendar momento"
          onAction={() => setIsAddModalVisible(true)}
          compact
        />
      );
    }

    return (
      <EmptyState
        icon="sparkles-outline"
        title="Nenhuma data no histórico ainda"
        subtitle="Quando os momentos planejados forem vivenciados, eles ficarão guardados aqui."
        compact
      />
    );
  }, [loading, activeTab, styles]);

  return (
    <View style={styles.container}>
      {/* 1. Fundo Atmosférico Vivo preenchendo 100% da viewport física */}
      <AtmosphereBackground />

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
            sectionTitle="datas"
            coupleSubtitle="Marcos e celebrações"
            containerStyle={{ marginBottom: 0, paddingTop: 4, paddingBottom: 8 }}
            rightAction={
              <PressableScale
                onPress={() => {
                  setIsAddModalVisible(true);
                }}
              >
                <LinearGradient
                  colors={['#7C6FE0', '#6D28D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.headerAddBtn}
                >
                  <Ionicons name="add" size={17} color="#FFFFFF" />
                  <Text style={styles.headerAddBtnText}>Adicionar</Text>
                </LinearGradient>
              </PressableScale>
            }
          />
        </View>
      </View>

      <FlatList
        data={loading ? [] : (activeTab === 'upcoming' ? upcomingEvents : pastEvents)}
        keyExtractor={(item) => item.id}
        renderItem={renderEventItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={{
          paddingTop: insets.top + (Platform.OS === 'ios' ? 88 : 82),
          paddingBottom: tabBarPaddingBottom,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeTokens.primary}
            colors={[themeTokens.primary]}
          />
        }
      />

      {/* 4. Modal: Adicionar Nova Data Especial */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !submitting && setIsAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          {/* Backdrop tocável para fechar o modal */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => !submitting && setIsAddModalVisible(false)}
          />

          <View style={styles.modalCard}>
            {/* Puxador da barra para descer / fechar */}
            <AnimatedTouchable
              style={styles.modalHandleTouchArea}
              onPress={() => !submitting && setIsAddModalVisible(false)}
              activeOpacity={0.7}
              hitSlop={{ top: 16, bottom: 20, left: 60, right: 60 }}
            >
              <View style={styles.modalHandle} />
            </AnimatedTouchable>

            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderIconBadge}>
                <Ionicons name="calendar" size={20} color={themeTokens.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Nova Data Especial</Text>
                <Text style={styles.modalSubtitle}>
                  Marque um momento marcante ou planeje o próximo capítulo de vocês.
                </Text>
              </View>
              <AnimatedTouchable
                onPress={() => !submitting && setIsAddModalVisible(false)}
                style={styles.modalCloseIconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color={themeTokens.textSecondary} />
              </AnimatedTouchable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Nome do Evento */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>O que vocês vão viver?</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Aniversário de Namoro, Viagem à praia..."
                  placeholderTextColor={isDark ? '#6B6880' : '#8A879A'}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  maxLength={70}
                />
              </View>

              {/* Seletor de Categoria */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Categoria</Text>
                <View style={styles.categoriesGrid}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = newCategory === cat.id;
                    return (
                      <AnimatedTouchable
                        key={cat.id}
                        style={[
                          styles.catChip,
                          isSelected && styles.catChipSelected,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setNewCategory(cat.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={cat.icon}
                          size={16}
                          color={isSelected ? themeTokens.primary : themeTokens.textSecondary}
                        />
                        <Text
                          style={[
                            styles.catChipText,
                            isSelected && styles.catChipTextSelected,
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </AnimatedTouchable>
                    );
                  })}
                </View>
              </View>

              {/* Data do Evento */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Data do Momento</Text>
                <AnimatedTouchable
                  style={styles.dateTimeButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowDatePicker((prev) => !prev);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={18} color={themeTokens.primary} />
                  <Text style={styles.dateTimeButtonText}>
                    {formatFullDatePTBR(selectedDate.toISOString())}
                  </Text>
                  <Ionicons
                    name={showDatePicker ? 'chevron-down' : 'chevron-forward'}
                    size={16}
                    color={themeTokens.textSecondary}
                  />
                </AnimatedTouchable>
              </View>

              {/* DatePicker sem botão de concluir */}
              {(showDatePicker || Platform.OS === 'web') && (
                <View style={styles.pickerBox}>
                  {Platform.OS !== 'web' && <Text style={styles.pickerTitle}>Selecione a Data</Text>}
                  {Platform.OS === 'web' ? (
                    React.createElement('input', {
                      type: 'date',
                      value: selectedDate.toISOString().split('T')[0],
                      onChange: (e: any) => {
                        const newDateStr = e.target.value;
                        if (newDateStr) {
                          const [year, month, day] = newDateStr.split('-');
                          const newDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
                          onDateChange(null as any, newDate);
                        }
                      },
                      style: {
                        padding: '12px',
                        borderRadius: '12px',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(124, 111, 224, 0.2)'}`,
                        fontSize: '16px',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 111, 224, 0.05)',
                        color: isDark ? '#F7F5FF' : '#1E1A33',
                        WebkitTextFillColor: isDark ? '#F7F5FF' : '#1E1A33',
                        colorScheme: isDark ? 'dark' : 'light',
                        outline: 'none',
                        width: '100%',
                        fontFamily: 'inherit',
                      }
                    })
                  ) : (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onValueChange={onDateChange}
                      textColor={isDark ? '#F7F5FF' : '#16151E'}
                      themeVariant={isDark ? 'dark' : 'light'}
                    />
                  )}
                </View>
              )}

              {/* Horário do Evento (Opcional) */}
              <View style={styles.inputWrapper}>
                <View style={styles.labelWithClearRow}>
                  <Text style={styles.inputLabel}>Horário (opcional)</Text>
                  {selectedTime !== null && (
                    <AnimatedTouchable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedTime(null);
                        setShowTimePicker(false);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.clearTimeText}>Limpar horário</Text>
                    </AnimatedTouchable>
                  )}
                </View>
                <AnimatedTouchable
                  style={styles.dateTimeButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowTimePicker((prev) => {
                      const next = !prev;
                      if (next && !selectedTime) {
                        const t = new Date();
                        t.setHours(20, 0, 0, 0);
                        setSelectedTime(t);
                      }
                      return next;
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="time-outline" size={18} color={themeTokens.primary} />
                  <Text
                    style={[
                      styles.dateTimeButtonText,
                      !selectedTime && styles.dateTimePlaceholderText,
                    ]}
                  >
                    {selectedTime
                      ? formatTimePTBR(selectedTime.toISOString())
                      : 'Nenhum horário definido'}
                  </Text>
                  <Ionicons
                    name={showTimePicker ? 'chevron-down' : 'chevron-forward'}
                    size={16}
                    color={themeTokens.textSecondary}
                  />
                </AnimatedTouchable>
              </View>

              {/* TimePicker sem botão de concluir */}
              {(showTimePicker || Platform.OS === 'web') && (
                <View style={styles.pickerBox}>
                  {Platform.OS !== 'web' && <Text style={styles.pickerTitle}>Selecione o Horário</Text>}
                  {Platform.OS === 'web' ? (
                    React.createElement('input', {
                      type: 'time',
                      value: selectedTime ? `${String(selectedTime.getHours()).padStart(2, '0')}:${String(selectedTime.getMinutes()).padStart(2, '0')}` : '',
                      onChange: (e: any) => {
                        const newTimeStr = e.target.value;
                        if (newTimeStr) {
                          const [hours, minutes] = newTimeStr.split(':');
                          const newTime = new Date();
                          newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                          onTimeChange(null as any, newTime);
                        } else {
                          setSelectedTime(null);
                        }
                      },
                      style: {
                        padding: '12px',
                        borderRadius: '12px',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(124, 111, 224, 0.2)'}`,
                        fontSize: '16px',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 111, 224, 0.05)',
                        color: isDark ? '#F7F5FF' : '#1E1A33',
                        WebkitTextFillColor: isDark ? '#F7F5FF' : '#1E1A33',
                        colorScheme: isDark ? 'dark' : 'light',
                        outline: 'none',
                        width: '100%',
                        fontFamily: 'inherit',
                      }
                    })
                  ) : (
                    <DateTimePicker
                      value={selectedTime || new Date()}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onValueChange={onTimeChange}
                      textColor={isDark ? '#F7F5FF' : '#16151E'}
                      themeVariant={isDark ? 'dark' : 'light'}
                    />
                  )}
                </View>
              )}

              {/* Ações */}
              <View style={styles.modalActionsRow}>
                <AnimatedTouchable
                  style={styles.modalCancelBtn}
                  onPress={() => setIsAddModalVisible(false)}
                  disabled={submitting}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </AnimatedTouchable>

                <AnimatedTouchable
                  style={[styles.modalSaveBtn, submitting && styles.btnDisabled]}
                  onPress={handleSaveDate}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.modalSaveText}>Salvar Data</Text>
                      <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                    </>
                  )}
                </AnimatedTouchable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  headerAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // Skeleton Loading Shimmer
  skeletonContainer: {
    paddingTop: 10,
    gap: 16,
  },
  skeletonCard: {
    width: '100%',
    height: 90,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(142, 124, 232, 0.08)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(142, 124, 232, 0.15)',
  },

  // Hero Card "Próximo momento"
  heroCardContainer: {
    borderRadius: 28,
    marginBottom: 20,
    shadowColor: themeTokens.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  heroGradientBackground: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.85)',
    overflow: 'hidden',
  },
  heroTopSection: {
    position: 'relative',
    flexDirection: 'row',
    marginBottom: 16,
    minHeight: 120,
  },
  heroTextContent: {
    flex: 1,
    paddingRight: 110,
    justifyContent: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: themeTokens.primary,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: themeTokens.textPrimary,
    lineHeight: 28,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroCalendarIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(124, 111, 224, 0.20)' : '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDateText: {
    fontSize: 12,
    color: themeTokens.textSecondary,
    fontWeight: '500',
  },

  // Lower Countdown Panel
  lowerCountdownPanel: {
    backgroundColor: isDark ? '#1C1835' : '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.08)',
    shadowColor: themeTokens.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1EEF9',
    marginBottom: 14,
    position: 'relative',
    overflow: 'visible',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible',
  },
  progressTipHeart: {
    position: 'absolute',
    right: -7,
    top: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#7C3AED',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  countdownColumnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnDivider: {
    width: 1,
    height: 28,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
  },
  countNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: themeTokens.primary,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: themeTokens.textSecondary,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  eventHappeningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.25)',
  },
  eventHappeningText: {
    fontSize: 15,
    fontWeight: '700',
    color: themeTokens.primary,
  },

  // Empty Hero Card
  emptyHeroCard: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.2)',
    borderStyle: 'dashed',
    marginBottom: 20,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
  },
  emptyHeroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyHeroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: themeTokens.textPrimary,
    marginBottom: 4,
  },
  emptyHeroSubtitle: {
    fontSize: 13,
    color: themeTokens.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  emptyHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  emptyHeroBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: themeTokens.primary,
  },

  // Segmented Tabs
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: themeTokens.glassBorder,
    shadowColor: themeTokens.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 20,
  },
  segmentItemActive: {
    backgroundColor: themeTokens.primary,
  },
  inactiveSegmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 20,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: themeTokens.textSecondary,
  },
  segmentTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Event List Card
  eventCardTouchable: {
    borderRadius: 22,
    shadowColor: themeTokens.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    padding: 14,
    backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
    borderWidth: 1,
    borderColor: themeTokens.glassBorder,
    gap: 12,
  },
  pastEventCard: {
    opacity: 0.82,
  },
  eventIconSquare: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  miniCategoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  miniCategoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  concludedBadge: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: themeTokens.textSecondary,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: themeTokens.textPrimary,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  pastEventTitle: {
    color: themeTokens.textSecondary,
  },
  eventDateText: {
    fontSize: 12,
    color: themeTokens.textSecondary,
    fontWeight: '500',
  },
  chevronButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyListContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    paddingHorizontal: 24,
  },
  emptyListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: themeTokens.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyListSubtitle: {
    fontSize: 13,
    color: themeTokens.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: isDark ? '#1C1A2E' : '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 12,
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'ios' ? 44 : 26,
    maxHeight: '90%',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: themeTokens.glassBorder,
  },
  modalHandleTouchArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 14,
    width: '100%',
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.40)' : 'rgba(0, 0, 0, 0.22)',
  },
  modalCloseIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  modalHeaderIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: themeTokens.textPrimary,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    color: themeTokens.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  labelWithClearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clearTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  dateTimePlaceholderText: {
    color: themeTokens.textSecondary,
    fontWeight: '400',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: themeTokens.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(142, 124, 232, 0.06)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: themeTokens.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.18)',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(142, 124, 232, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.15)',
  },
  catChipSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderColor: themeTokens.primary,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: themeTokens.textSecondary,
  },
  catChipTextSelected: {
    color: themeTokens.primary,
    fontWeight: '700',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(142, 124, 232, 0.06)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.18)',
  },
  dateTimeButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: themeTokens.textPrimary,
  },
  pickerBox: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(142, 124, 232, 0.08)',
    borderRadius: 20,
    padding: 12,
    marginVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(142, 124, 232, 0.22)',
  },
  pickerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: themeTokens.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
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
    color: themeTokens.textSecondary,
  },
  modalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 18,
    backgroundColor: themeTokens.primary,
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
