import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { AnimatedTouchable } from '../../components/AnimatedTouchable';
import { AtmosphereBackground } from '../../components/ui/AtmosphereBackground';
import { LiquidGlassView } from '../../components/ui/LiquidGlassView';
import { AppHeader } from '../../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { supabase } from '../../lib/supabase';
import { THEME } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../constants/theme';

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
  { id: 'Comemoração', label: 'Comemoração', icon: 'sparkles-outline', color: '#8E7CE8', bg: 'rgba(142, 124, 232, 0.15)' },
  { id: 'Aniversário', label: 'Aniversário', icon: 'gift-outline', color: '#DD6B20', bg: 'rgba(221, 107, 32, 0.12)' },
  { id: 'Outro', label: 'Outro', icon: 'bookmark-outline', color: '#4A5568', bg: 'rgba(74, 85, 104, 0.12)' },
];

const getCategoryMeta = (catName?: string): CategoryOption => {
  const found = CATEGORIES.find((c) => c.id.toLowerCase() === (catName || '').toLowerCase());
  return (
    found || {
      id: catName || 'Outro',
      label: catName || 'Outro',
      icon: 'bookmark-outline',
      color: '#8E7CE8',
      bg: 'rgba(142, 124, 232, 0.12)',
    }
  );
};

const formatFullDatePTBR = (dateString?: string): string => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatTimePTBR = (dateString?: string): string => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function DatesScreen() {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const styles = getStyles(themeTokens, isDark);
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const insets = useSafeAreaInsets();

  const [dates, setDates] = useState<SpecialDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtro de exibição ('upcoming' | 'past')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Relógio do contador em tempo real (atualiza a cada 1s)
  const [now, setNow] = useState<Date>(new Date());

  // Estados para Adicionar Nova Data
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Comemoração');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(20, 0, 0, 0);
    return d;
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);



  // 1. Atualizador do relógio para o countdown hero
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Busca as datas especiais do casal
  const loadDates = useCallback(async () => {
    if (!coupleId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('special_dates')
        .select('*')
        .eq('couple_id', coupleId)
        .order('event_date', { ascending: true });

      if (error) throw error;
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
          loadDates();
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

  // Separação em Próximos e Histórico
  const { upcomingEvents, pastEvents, nextHeroEvent } = useMemo(() => {
    const nowTime = now.getTime();
    const upcoming: SpecialDate[] = [];
    const past: SpecialDate[] = [];

    dates.forEach((item) => {
      const eventTime = new Date(item.event_date).getTime();
      if (eventTime >= nowTime) {
        upcoming.push(item);
      } else {
        past.push(item);
      }
    });

    upcoming.sort(
      (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );

    past.sort(
      (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
    );

    return {
      upcomingEvents: upcoming,
      pastEvents: past,
      nextHeroEvent: upcoming.length > 0 ? upcoming[0] : null,
    };
  }, [dates, now]);

  // Cálculo da contagem regressiva para o evento hero
  const countdown = useMemo(() => {
    if (!nextHeroEvent) return null;
    const target = new Date(nextHeroEvent.event_date).getTime();
    const diff = target - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isNow: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isNow: false };
  }, [nextHeroEvent, now]);

  // 3. Salvar nova data
  const handleSaveDate = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Título obrigatório', 'Dê um nome para esta data especial.');
      return;
    }

    if (!coupleId || !user?.id) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('special_dates').insert({
        couple_id: coupleId,
        created_by: user.id,
        title: newTitle.trim(),
        category: newCategory,
        event_date: selectedDate.toISOString(),
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAddModalVisible(false);
      setNewTitle('');
      setNewCategory('Comemoração');
      const resetD = new Date();
      resetD.setDate(resetD.getDate() + 7);
      resetD.setHours(20, 0, 0, 0);
      setSelectedDate(resetD);

      await loadDates();
    } catch (err: any) {
      Alert.alert('Erro ao salvar data', err.message || 'Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Excluir data
  const handleDeleteDate = (id: string, title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Remover data especial',
      `Tem certeza que deseja excluir "${title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('special_dates')
                .delete()
                .eq('id', id);

              if (error) throw error;
              await loadDates();
            } catch (err: any) {
              Alert.alert('Erro ao excluir', err.message || 'Não foi possível remover a data.');
            }
          },
        },
      ]
    );
  };

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
      const updated = new Date(selectedDate);
      updated.setHours(time.getHours());
      updated.setMinutes(time.getMinutes());
      setSelectedDate(updated);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Fundo Atmosférico Vivo preenchendo 100% da viewport física */}
      <AtmosphereBackground />

      {/* Cabeçalho Fixo com Blur e Transparência */}
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
        <View style={styles.headerInnerRow}>
          <AppHeader
            sectionTitle="datas"
            coupleSubtitle="Marcos e celebrações"
            containerStyle={{ marginBottom: 0, paddingTop: 6, paddingBottom: 6 }}
            rightAction={
              <AnimatedTouchable
                style={styles.headerAddBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsAddModalVisible(true);
                }}
              >
                <Ionicons name="add" size={17} color="#FFFFFF" />
                <Text style={styles.headerAddBtnText}>Adicionar</Text>
              </AnimatedTouchable>
            }
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + (Platform.OS === 'ios' ? 70 : 66),
          paddingBottom: 130,
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
      >
        {/* 1. Card de Destaque (Countdown Hero) */}
        {nextHeroEvent && countdown ? (
          <View>
            <LiquidGlassView variant="hero" style={styles.heroCard} borderRadius={30}>
              <View style={styles.heroTopRow}>
                <View
                  style={[
                    styles.categoryPill,
                    { backgroundColor: getCategoryMeta(nextHeroEvent.category).bg },
                  ]}
                >
                  <Ionicons
                    name={getCategoryMeta(nextHeroEvent.category).icon}
                    size={13}
                    color={getCategoryMeta(nextHeroEvent.category).color}
                  />
                  <Text
                    style={[
                      styles.categoryPillText,
                      { color: getCategoryMeta(nextHeroEvent.category).color },
                    ]}
                  >
                    {getCategoryMeta(nextHeroEvent.category).label}
                  </Text>
                </View>

                <Text style={styles.heroTag}>PRÓXIMO MOMENTO</Text>
              </View>

              <Text style={styles.heroTitle} numberOfLines={2}>
                {nextHeroEvent.title}
              </Text>

              <View style={styles.heroDateRow}>
                <Ionicons name="time-outline" size={15} color="#7E7699" />
                <Text style={styles.heroDateText}>
                  {formatFullDatePTBR(nextHeroEvent.event_date)} às{' '}
                  {formatTimePTBR(nextHeroEvent.event_date)}
                </Text>
              </View>

              {countdown.isNow ? (
                <View style={styles.eventHappeningBox}>
                  <Ionicons name="heart" size={20} color="#7C3AED" />
                  <Text style={styles.eventHappeningText}>É hoje! Aproveitem cada segundo.</Text>
                </View>
              ) : (
                <View style={styles.countdownRow}>
                  {/* Dias */}
                  <LiquidGlassView variant="pill" style={styles.countBadge} borderRadius={16}>
                    <Text style={styles.countNumber}>{countdown.days}</Text>
                    <Text style={styles.countLabel}>DIAS</Text>
                  </LiquidGlassView>

                  {/* Horas */}
                  <LiquidGlassView variant="pill" style={styles.countBadge} borderRadius={16}>
                    <Text style={styles.countNumber}>
                      {String(countdown.hours).padStart(2, '0')}
                    </Text>
                    <Text style={styles.countLabel}>HORAS</Text>
                  </LiquidGlassView>

                  {/* Minutos */}
                  <LiquidGlassView variant="pill" style={styles.countBadge} borderRadius={16}>
                    <Text style={styles.countNumber}>
                      {String(countdown.minutes).padStart(2, '0')}
                    </Text>
                    <Text style={styles.countLabel}>MINUTOS</Text>
                  </LiquidGlassView>

                  {/* Segundos */}
                  <LiquidGlassView variant="pill" style={styles.countBadge} borderRadius={16}>
                    <Text style={styles.countNumber}>
                      {String(countdown.seconds).padStart(2, '0')}
                    </Text>
                    <Text style={styles.countLabel}>SEGUNDOS</Text>
                  </LiquidGlassView>
                </View>
              )}
            </LiquidGlassView>
          </View>
        ) : (
          <View>
            <LiquidGlassView variant="card" style={styles.emptyHeroCard} borderRadius={26}>
              <View style={styles.emptyHeroIconCircle}>
                <Ionicons name="sparkles-outline" size={26} color={themeTokens.primary} />
              </View>
              <Text style={styles.emptyHeroTitle}>Nenhum evento agendado</Text>
              <Text style={styles.emptyHeroSubtitle}>
                Que tal planejar o próximo momento juntos e acompanhar a contagem regressiva?
              </Text>
              <AnimatedTouchable
                style={styles.emptyHeroBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsAddModalVisible(true);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color={themeTokens.primary} />
                <Text style={styles.emptyHeroBtnText}>Agendar momento</Text>
              </AnimatedTouchable>
            </LiquidGlassView>
          </View>
        )}

        {/* 2. Filtro de Abas: Próximos vs Histórico */}
        <View>
          <LiquidGlassView variant="pill" style={styles.segmentedContainer} borderRadius={24}>
            <AnimatedTouchable
              style={[
                styles.segmentItem,
                activeTab === 'upcoming' && styles.segmentItemActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('upcoming');
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeTab === 'upcoming' && styles.segmentTextActive,
                ]}
              >
                Próximos ({upcomingEvents.length})
              </Text>
            </AnimatedTouchable>

            <AnimatedTouchable
              style={[
                styles.segmentItem,
                activeTab === 'past' && styles.segmentItemActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('past');
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeTab === 'past' && styles.segmentTextActive,
                ]}
              >
                Histórico ({pastEvents.length})
              </Text>
            </AnimatedTouchable>
          </LiquidGlassView>
        </View>

        {/* 3. Listagem de Eventos da Aba Selecionada */}
        {loading ? (
          <View style={styles.skeletonContainer}>
            <View style={styles.skeletonCard} />
            <View style={styles.skeletonCard} />
          </View>
        ) : activeTab === 'upcoming' ? (
          upcomingEvents.length === 0 ? (
            <LiquidGlassView variant="card" style={styles.emptyListContainer} borderRadius={26}>
              <Ionicons name="calendar-outline" size={38} color="#C4BDEE" />
              <Text style={styles.emptyListTitle}>Sem próximas datas agendadas</Text>
              <Text style={styles.emptyListSubtitle}>
                Toque em "Adicionar" no topo para marcar uma viagem, encontro ou aniversário.
              </Text>
            </LiquidGlassView>
          ) : (
            upcomingEvents.map((item, index) => {
              const meta = getCategoryMeta(item.category);
              return (
                <View key={item.id}>
                  <LiquidGlassView variant="card" style={styles.eventCard} borderRadius={22}>
                    <View style={[styles.eventIconCircle, { backgroundColor: meta.bg }]}>
                      <Ionicons name={meta.icon} size={20} color={meta.color} />
                    </View>

                    <View style={styles.eventInfo}>
                      <View style={styles.eventMetaRow}>
                        <View style={[styles.miniCategoryPill, { backgroundColor: meta.bg }]}>
                          <Text style={[styles.miniCategoryText, { color: meta.color }]}>
                            {meta.label}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.eventTitle} numberOfLines={2}>
                        {item.title}
                      </Text>

                      <Text style={styles.eventDateText}>
                        {formatFullDatePTBR(item.event_date)} • {formatTimePTBR(item.event_date)}
                      </Text>
                    </View>

                    <AnimatedTouchable
                      style={styles.deleteButton}
                      onPress={() => handleDeleteDate(item.id, item.title)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="trash-outline" size={17} color="#8A879A" />
                    </AnimatedTouchable>
                  </LiquidGlassView>
                </View>
              );
            })
          )
        ) : pastEvents.length === 0 ? (
          <LiquidGlassView variant="card" style={styles.emptyListContainer} borderRadius={26}>
            <Ionicons name="checkmark-done-circle-outline" size={38} color="#C4BDEE" />
            <Text style={styles.emptyListTitle}>Nenhuma data no histórico ainda</Text>
            <Text style={styles.emptyListSubtitle}>
              Quando os momentos planejados forem vivenciados, eles ficarão guardados aqui.
            </Text>
          </LiquidGlassView>
        ) : (
          pastEvents.map((item, index) => {
            const meta = getCategoryMeta(item.category);
            return (
              <View key={item.id}>
                <LiquidGlassView variant="card" style={[styles.eventCard, styles.pastEventCard]} borderRadius={22}>
                  <View
                    style={[
                      styles.eventIconCircle,
                      { backgroundColor: 'rgba(104, 101, 120, 0.08)' },
                    ]}
                  >
                    <Ionicons name={meta.icon} size={20} color="#686578" />
                  </View>

                  <View style={styles.eventInfo}>
                    <View style={styles.eventMetaRow}>
                      <View
                        style={[
                          styles.miniCategoryPill,
                          { backgroundColor: 'rgba(104, 101, 120, 0.08)' },
                        ]}
                      >
                        <Text style={[styles.miniCategoryText, { color: themeTokens.textSecondary }]}>
                          {meta.label}
                        </Text>
                      </View>
                      <Text style={styles.concludedBadge}>CONCLUÍDO</Text>
                    </View>

                    <Text style={[styles.eventTitle, styles.pastEventTitle]} numberOfLines={2}>
                      {item.title}
                    </Text>

                    <Text style={styles.eventDateText}>
                      {formatFullDatePTBR(item.event_date)}
                    </Text>
                  </View>

                  <AnimatedTouchable
                    style={styles.deleteButton}
                    onPress={() => handleDeleteDate(item.id, item.title)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="trash-outline" size={17} color="#8A879A" />
                  </AnimatedTouchable>
                </LiquidGlassView>
              </View>
            );
          })
        )}
      </ScrollView>

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
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />

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
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Nome do Evento */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>O que vocês vão viver?</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Aniversário de Namoro, Viagem à praia..."
                  placeholderTextColor="#8A879A"
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
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={18} color={themeTokens.primary} />
                  <Text style={styles.dateTimeButtonText}>
                    {formatFullDatePTBR(selectedDate.toISOString())}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#8A879A" />
                </AnimatedTouchable>
              </View>

              {/* Horário do Evento */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Horário (opcional)</Text>
                <AnimatedTouchable
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="time-outline" size={18} color={themeTokens.primary} />
                  <Text style={styles.dateTimeButtonText}>
                    {formatTimePTBR(selectedDate.toISOString())}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#8A879A" />
                </AnimatedTouchable>
              </View>

              {/* DatePicker */}
              {(showDatePicker || Platform.OS === 'ios') && (
                <View style={styles.pickerBox}>
                  <Text style={styles.pickerTitle}>Selecione a Data</Text>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onValueChange={onDateChange}
                    textColor="#16151E"
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

              {/* TimePicker */}
              {showTimePicker && (
                <View style={styles.pickerBox}>
                  <Text style={styles.pickerTitle}>Selecione o Horário</Text>
                  <DateTimePicker
                    value={selectedDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onValueChange={onTimeChange}
                    textColor="#16151E"
                  />
                  {Platform.OS === 'ios' && (
                    <AnimatedTouchable
                      style={styles.pickerDoneBtn}
                      onPress={() => setShowTimePicker(false)}
                    >
                      <Text style={styles.pickerDoneBtnText}>Concluir Horário</Text>
                    </AnimatedTouchable>
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
    backgroundColor: themeTokens.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  headerAddBtnText: {
    fontSize: 12,
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

  // Hero Countdown Card Liquid Glass
  heroCard: {
    position: 'relative',
    borderRadius: 32,
    padding: 22,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroGlowCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(142, 124, 232, 0.15)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: themeTokens.primary,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: themeTokens.textPrimary,
    lineHeight: 28,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
  },
  heroDateText: {
    fontSize: 13,
    color: themeTokens.textSecondary,
    fontWeight: '500',
  },
  countdownRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  countBadge: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  countNumber: {
    fontSize: 20,
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

  // Segmented Tabs Liquid Glass
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 22,
    padding: 4,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: themeTokens.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: themeTokens.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Event Card Liquid Glass
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 14,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
    gap: 12,
  },
  pastEventCard: {
    opacity: 0.88,
  },
  eventIconCircle: {
    width: 44,
    height: 44,
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
    fontSize: 16,
    fontWeight: '800',
    color: themeTokens.textPrimary,
    marginBottom: 3,
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
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(142, 124, 232, 0.08)',
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
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
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
    backgroundColor: 'rgba(142, 124, 232, 0.04)',
    borderRadius: 18,
    padding: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: themeTokens.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
