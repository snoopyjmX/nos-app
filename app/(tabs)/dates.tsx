import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
 } from 'react-native';
import { AnimatedTouchable } from '../../components/AnimatedTouchable';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { supabase } from '../../lib/supabase';

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
  const { user } = useAuth();
  const { coupleId } = useCouple();

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
    } catch (err: any) {
      console.warn('Erro ao carregar datas especiais:', err.message);
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

    // Próximos em ordem cronológica (mais perto primeiro)
    upcoming.sort(
      (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );

    // Histórico em ordem decrescente (mais recente primeiro)
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

      setIsAddModalVisible(false);
      setNewTitle('');
      setNewCategory('Comemoração');
      const resetD = new Date();
      resetD.setDate(resetD.getDate() + 7);
      resetD.setHours(20, 0, 0, 0);
      setSelectedDate(resetD);

      await loadDates();
      Alert.alert('Sucesso!', 'Data especial marcada no calendário do casal.');
    } catch (err: any) {
      Alert.alert('Erro ao salvar data', err.message || 'Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Excluir data
  const handleDeleteDate = (id: string, title: string) => {
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

  // Tratadores de DateTimePicker
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
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.headerBadge}>
            <Ionicons name="calendar" size={20} color="#8E7CE8" />
          </View>
          <View>
            <Text style={styles.headerTitle}>nós • datas</Text>
            <Text style={styles.headerSubtitle}>Marcos e momentos que virão</Text>
          </View>
        </View>

        <AnimatedTouchable
          style={styles.headerAddBtn}
          onPress={() => setIsAddModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.headerAddBtnText}>Nova Data</Text>
        </AnimatedTouchable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8E7CE8"
            colors={['#8E7CE8']}
          />
        }
      >
        {/* 1. Card de Destaque (Countdown Hero) */}
        {nextHeroEvent && countdown ? (
          <View style={styles.heroCard}>
            <View style={styles.heroGlowCircle} />

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
              <Ionicons name="time-outline" size={15} color="rgba(22, 21, 30, 0.65)" />
              <Text style={styles.heroDateText}>
                {formatFullDatePTBR(nextHeroEvent.event_date)} às{' '}
                {formatTimePTBR(nextHeroEvent.event_date)}
              </Text>
            </View>

            {countdown.isNow ? (
              <View style={styles.eventHappeningBox}>
                <Ionicons name="heart" size={20} color="#8E7CE8" />
                <Text style={styles.eventHappeningText}>É hoje! Aproveitem cada segundo.</Text>
              </View>
            ) : (
              <View style={styles.countdownRow}>
                {/* Dias */}
                <View style={styles.countBadge}>
                  <Text style={styles.countNumber}>{countdown.days}</Text>
                  <Text style={styles.countLabel}>DIAS</Text>
                </View>

                {/* Horas */}
                <View style={styles.countBadge}>
                  <Text style={styles.countNumber}>
                    {String(countdown.hours).padStart(2, '0')}
                  </Text>
                  <Text style={styles.countLabel}>HORAS</Text>
                </View>

                {/* Minutos */}
                <View style={styles.countBadge}>
                  <Text style={styles.countNumber}>
                    {String(countdown.minutes).padStart(2, '0')}
                  </Text>
                  <Text style={styles.countLabel}>MINUTOS</Text>
                </View>

                {/* Segundos */}
                <View style={styles.countBadge}>
                  <Text style={styles.countNumber}>
                    {String(countdown.seconds).padStart(2, '0')}
                  </Text>
                  <Text style={styles.countLabel}>SEGUNDOS</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyHeroCard}>
            <View style={styles.emptyHeroIconCircle}>
              <Ionicons name="sparkles-outline" size={26} color="#8E7CE8" />
            </View>
            <Text style={styles.emptyHeroTitle}>Nenhum evento agendado</Text>
            <Text style={styles.emptyHeroSubtitle}>
              Que tal planejar o próximo momento juntos e acompanhar a contagem regressiva?
            </Text>
            <AnimatedTouchable
              style={styles.emptyHeroBtn}
              onPress={() => setIsAddModalVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={18} color="#8E7CE8" />
              <Text style={styles.emptyHeroBtnText}>Agendar momento</Text>
            </AnimatedTouchable>
          </View>
        )}

        {/* 2. Filtro de Abas: Próximos vs Histórico */}
        <View style={styles.segmentedContainer}>
          <AnimatedTouchable
            style={[
              styles.segmentItem,
              activeTab === 'upcoming' && styles.segmentItemActive,
            ]}
            onPress={() => setActiveTab('upcoming')}
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
            onPress={() => setActiveTab('past')}
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
        </View>

        {/* 3. Listagem de Eventos da Aba Selecionada */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#8E7CE8" size="large" />
          </View>
        ) : activeTab === 'upcoming' ? (
          upcomingEvents.length === 0 ? (
            <View style={styles.emptyListContainer}>
              <Ionicons name="calendar-outline" size={38} color="#C4BDEE" />
              <Text style={styles.emptyListTitle}>Sem próximas datas agendadas</Text>
              <Text style={styles.emptyListSubtitle}>
                Toque em "Nova Data" no topo para marcar uma viagem, encontro ou aniversário.
              </Text>
            </View>
          ) : (
            upcomingEvents.map((item) => {
              const meta = getCategoryMeta(item.category);
              return (
                <View key={item.id} style={styles.eventCard}>
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
                    <Ionicons name="trash-outline" size={18} color="#A09EAD" />
                  </AnimatedTouchable>
                </View>
              );
            })
          )
        ) : pastEvents.length === 0 ? (
          <View style={styles.emptyListContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={38} color="#C4BDEE" />
            <Text style={styles.emptyListTitle}>Nenhuma data no histórico ainda</Text>
            <Text style={styles.emptyListSubtitle}>
              Quando os momentos planejados forem vivenciados, eles ficarão guardados aqui.
            </Text>
          </View>
        ) : (
          pastEvents.map((item) => {
            const meta = getCategoryMeta(item.category);
            return (
              <View key={item.id} style={[styles.eventCard, styles.pastEventCard]}>
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
                      <Text style={[styles.miniCategoryText, { color: '#686578' }]}>
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
                  <Ionicons name="trash-outline" size={18} color="#A09EAD" />
                </AnimatedTouchable>
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
                <Ionicons name="calendar" size={20} color="#8E7CE8" />
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
                  placeholderTextColor="#686578"
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
                        onPress={() => setNewCategory(cat.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={cat.icon}
                          size={16}
                          color={isSelected ? '#8E7CE8' : '#686578'}
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
                  <Ionicons name="calendar-outline" size={18} color="#8E7CE8" />
                  <Text style={styles.dateTimeButtonText}>
                    {formatFullDatePTBR(selectedDate.toISOString())}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#686578" />
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
                  <Ionicons name="time-outline" size={18} color="#8E7CE8" />
                  <Text style={styles.dateTimeButtonText}>
                    {formatTimePTBR(selectedDate.toISOString())}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#686578" />
                </AnimatedTouchable>
              </View>

              {/* DatePicker no iOS ou quando acionado no Android */}
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

              {/* TimePicker quando acionado */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 124, 232, 0.1)',
    backgroundColor: '#F8F9FC',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.25)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16151E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#686578',
    marginTop: 2,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8E7CE8',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#8E7CE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  headerAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },

  // Hero Countdown Card
  heroCard: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#8E7CE8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
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
    color: '#8E7CE8',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16151E',
    lineHeight: 28,
    marginBottom: 6,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
  },
  heroDateText: {
    fontSize: 13,
    color: 'rgba(22, 21, 30, 0.65)',
    fontWeight: '500',
  },
  countdownRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  countBadge: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.2)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  countNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8E7CE8',
    letterSpacing: -0.5,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#686578',
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
    color: '#8E7CE8',
  },

  // Empty Hero Card
  emptyHeroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.2)',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  emptyHeroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(142, 124, 232, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyHeroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16151E',
    marginBottom: 4,
  },
  emptyHeroSubtitle: {
    fontSize: 13,
    color: '#686578',
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
    color: '#8E7CE8',
  },

  // Segmented Tabs
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 20,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#8E7CE8',
    shadowColor: '#8E7CE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#686578',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Event Card
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  pastEventCard: {
    opacity: 0.85,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
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
    color: '#686578',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16151E',
    marginBottom: 4,
  },
  pastEventTitle: {
    color: '#4A5568',
  },
  eventDateText: {
    fontSize: 12,
    color: '#686578',
    fontWeight: '500',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(104, 101, 120, 0.06)',
  },

  // Loading & Empty States
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyListContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.15)',
    paddingHorizontal: 24,
  },
  emptyListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16151E',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyListSubtitle: {
    fontSize: 13,
    color: '#686578',
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'ios' ? 44 : 26,
    maxHeight: '90%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#16151E',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#686578',
    marginTop: 2,
    lineHeight: 16,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16151E',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(142, 124, 232, 0.06)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#16151E',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.15)',
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
    borderColor: 'rgba(142, 124, 232, 0.12)',
  },
  catChipSelected: {
    backgroundColor: 'rgba(142, 124, 232, 0.18)',
    borderColor: '#8E7CE8',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#686578',
  },
  catChipTextSelected: {
    color: '#8E7CE8',
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
    borderColor: 'rgba(142, 124, 232, 0.15)',
  },
  dateTimeButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#16151E',
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
    color: '#8E7CE8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pickerDoneBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#8E7CE8',
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
    color: '#686578',
  },
  modalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 18,
    backgroundColor: '#8E7CE8',
    shadowColor: '#8E7CE8',
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
