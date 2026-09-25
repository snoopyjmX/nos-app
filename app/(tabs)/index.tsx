import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, withRepeat, withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AnimatedTouchable } from '../../components/AnimatedTouchable';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { supabase } from '../../lib/supabase';

interface RecentMemory {
  id: string;
  title: string;
  memory_date: string;
  image_url: string | null;
  displayUrl?: string | null;
}

interface AccumulatedTime {
  months: number;
  days: number;
  hours: number;
  minutes: number;
}

const getFirstName = (name?: string | null): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
};

// Calcula os totais acumulados absolutos de toda a história
const calculateAccumulatedTime = (startDateString?: string | null): AccumulatedTime => {
  if (!startDateString) {
    return { months: 0, days: 0, hours: 0, minutes: 0 };
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
    return { months: 0, days: 0, hours: 0, minutes: 0 };
  }

  const diffMs = now.getTime() - start.getTime();

  // 1. Total absoluto de minutos
  const minutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  // 2. Total absoluto de horas (integer limpo)
  const hours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  // 3. Total absoluto de dias
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  // 4. Total absoluto de meses de calendário
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) {
    months--;
  }
  months = Math.max(0, months);

  return { months, days, hours, minutes };
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
  const router = useRouter();
  const { user } = useAuth();
  const { coupleId } = useCouple();

  const [coupleTitle, setCoupleTitle] = useState<string>('Você & Meu Amor');
  const [effectiveStartDateStr, setEffectiveStartDateStr] = useState<string | null>(null);
  const [hasCustomAnniversary, setHasCustomAnniversary] = useState<boolean>(false);
  const [anniversaryDate, setAnniversaryDate] = useState<Date>(new Date());
  const [recentMemory, setRecentMemory] = useState<RecentMemory | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [, setCurrentTick] = useState<number>(Date.now());

  // Estados do Modal e Seletor de Data
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [savingDate, setSavingDate] = useState(false);

  // Intervalo a cada 60s para manter horas e minutos vivos
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
        console.warn('Erro ao buscar couple_members:', membersError.message);
        return;
      }

      const userIds = (members || []).map((m) => m.user_id);
      if (userIds.length === 0) return;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Erro ao buscar profiles:', profilesError.message);
      }

      const profileMap = new Map<string, string>();
      profiles?.forEach((p) => {
        if (p.id && p.display_name) {
          profileMap.set(p.id, p.display_name);
        }
      });

      const myDisplayName =
        profileMap.get(user.id) ||
        user.user_metadata?.display_name ||
        user.email?.split('@')[0] ||
        'Você';
      const myFirstName = getFirstName(myDisplayName) || 'Você';

      if (!profileMap.has(user.id) && user.user_metadata?.display_name) {
        supabase
          .from('profiles')
          .upsert({ id: user.id, display_name: user.user_metadata.display_name })
          .then();
      }

      const otherMember = members?.find((m) => m.user_id !== user.id);
      let partnerFirstName = 'Meu Amor';

      if (otherMember) {
        const partnerDisplayName = profileMap.get(otherMember.user_id);
        if (partnerDisplayName) {
          partnerFirstName = getFirstName(partnerDisplayName) || 'Meu Amor';
        }
      }

      setCoupleTitle(`${myFirstName} & ${partnerFirstName}`);
    } catch (err) {
      console.warn('Erro ao carregar detalhes do casal:', err);
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
        console.warn('Erro ao carregar dados do casal:', error.message);
        return;
      }

      const customDateStr = coupleData?.anniversary_date;
      const isCustom = !!customDateStr;
      const effectiveDate = customDateStr || coupleData?.created_at;

      const parsedDate = effectiveDate ? new Date(effectiveDate) : new Date();
      setAnniversaryDate(parsedDate);
      setTempDate(parsedDate);
      setHasCustomAnniversary(isCustom);
      setEffectiveStartDateStr(effectiveDate || null);
    } catch (err) {
      console.warn('Erro ao carregar dados do relacionamento:', err);
    }
  }, [coupleId]);

  // 3. Busca a memória mais recente
  const loadRecentMemory = useCallback(async () => {
    if (!coupleId) return;

    try {
      const { data: memoryData, error } = await supabase
        .from('memories')
        .select('id, title, memory_date, image_url')
        .eq('couple_id', coupleId)
        .order('memory_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Erro ao carregar memória recente:', error.message);
        return;
      }

      if (!memoryData) {
        setRecentMemory(null);
        return;
      }

      let displayUrl = memoryData.image_url;
      if (memoryData.image_url) {
        let cleanPath = memoryData.image_url.trim();
        if (cleanPath.includes('/memories/')) {
          cleanPath = cleanPath.split('/memories/')[1].split('?')[0];
        }

        try {
          const { data: signedData } = await supabase.storage
            .from('memories')
            .createSignedUrl(cleanPath, 60 * 60 * 24); // 24 horas de validade

          if (signedData?.signedUrl) {
            displayUrl = signedData.signedUrl;
          }
        } catch (signErr) {
          console.warn('Erro ao assinar URL da memória recente:', signErr);
        }
      }

      setRecentMemory({
        ...memoryData,
        displayUrl,
      });
    } catch (err) {
      console.warn('Erro ao buscar memória recente:', err);
    }
  }, [coupleId]);

  // Carrega todos os dados simultaneamente
  const loadAllData = useCallback(async () => {
    await Promise.all([loadCoupleDetails(), loadCoupleDays(), loadRecentMemory()]);
  }, [loadCoupleDetails, loadCoupleDays, loadRecentMemory]);

  useEffect(() => {
    if (!user || !coupleId) return;

    loadAllData();

    // Sincronização em tempo real via Supabase Realtime
    const channel = supabase
      .channel(`home_channel_${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couple_members',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          loadCoupleDetails();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couples',
          filter: `id=eq.${coupleId}`,
        },
        () => {
          loadCoupleDays();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memories',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          loadRecentMemory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, coupleId, loadAllData, loadCoupleDetails, loadCoupleDays, loadRecentMemory]);

  // Ação de Pull-to-Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // Abre o seletor de data conforme a plataforma
  const handleOpenDatePicker = () => {
    setTempDate(anniversaryDate);
    if (Platform.OS === 'android') {
      setShowAndroidPicker(true);
    } else {
      setIsModalVisible(true);
    }
  };

  // Salva a data de aniversário no Supabase com persistência garantida
  const handleSaveDate = async (dateToSave: Date) => {
    if (!coupleId) return;

    setSavingDate(true);
    try {
      const year = dateToSave.getFullYear();
      const month = String(dateToSave.getMonth() + 1).padStart(2, '0');
      const day = String(dateToSave.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;

      const { error } = await supabase
        .from('couples')
        .update({ anniversary_date: isoDate })
        .eq('id', coupleId);

      if (error) {
        throw new Error(error.message);
      }

      setAnniversaryDate(dateToSave);
      setHasCustomAnniversary(true);
      setEffectiveStartDateStr(isoDate);
      setIsModalVisible(false);

      // Recarrega os dados para confirmar a persistência
      await loadCoupleDays();

      Alert.alert(
        'Data definida com amor!',
        `A jornada de vocês agora conta desde ${day}/${month}/${year}.`
      );
    } catch (err: any) {
      Alert.alert('Erro ao salvar data', err.message || 'Não foi possível atualizar a data.');
    } finally {
      setSavingDate(false);
    }
  };

  // Tratamento de mudança de data no Android
  const onAndroidDateChange = (_event: DateTimePickerChangeEvent, selectedDate?: Date) => {
    setShowAndroidPicker(false);
    if (selectedDate) {
      handleSaveDate(selectedDate);
    }
  };

  const onDatePickerDismiss = () => {
    setShowAndroidPicker(false);
  };

  // Totais acumulados calculados dinamicamente
  const timeTotals = useMemo(() => {
    return calculateAccumulatedTime(effectiveStartDateStr);
  }, [effectiveStartDateStr]);

  // Prévia no Modal de edição
  const tempDateStr = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
  const tempTotals = useMemo(() => {
    return calculateAccumulatedTime(tempDateStr);
  }, [tempDateStr]);

  // Animação do pulse verde
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    pulseScale.value = withRepeat(withTiming(1.5, { duration: 1500 }), -1, true);
    pulseOpacity.value = withRepeat(withTiming(0.4, { duration: 1500 }), -1, true);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Background Atmosphere */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#FCE7F3', '#EDE9FE', '#F8F9FC']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
        {/* Cabeçalho Superior - Liquid Glass */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandTitle}>nós<Text style={styles.brandDot}>.</Text></Text>
            
            <View style={styles.connectedPill}>
              <View style={styles.pulseDotContainer}>
                <Animated.View style={[styles.pulseDotRing, pulseStyle]} />
                <View style={styles.pulseDotCore} />
              </View>
              <Text style={styles.connectedText}>Conectados</Text>
            </View>
          </View>

          <AnimatedTouchable style={styles.notificationButton} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={20} color="#16151E" />
          </AnimatedTouchable>
        </View>

        {/* Card Principal: Nossa Jornada (Interativo) */}
        <AnimatedTouchable
          style={styles.heroGlassCard}
          onPress={handleOpenDatePicker}
          activeOpacity={0.88}
        >
          {/* Badge sutil de ação no topo do card */}
          <View style={styles.dateActionBadge}>
            <Ionicons name="calendar-outline" size={14} color="#8E7CE8" />
            <Text style={styles.dateActionText}>
              {hasCustomAnniversary ? 'Editar data' : 'Definir dia de início'}
            </Text>
          </View>

          <View style={styles.imagePlaceholder}>
            <Ionicons name="heart" size={48} color="#8E7CE8" />
            <Text style={styles.imagePlaceholderText}>O nosso espaço a dois</Text>
          </View>

          <View style={styles.journeyContent}>
            <Text style={styles.journeyLabel}>NOSSA JORNADA</Text>

            {/* 4 Quadrinhos de Vidro: MESES, DIAS, HORAS, MINUTOS */}
            <View style={styles.capsulesRow}>
              <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.capsule}>
                <Text style={styles.capsuleLabel}>MESES</Text>
                <Text style={styles.capsuleValue} numberOfLines={1} adjustsFontSizeToFit>
                  {timeTotals.months}
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.capsule}>
                <Text style={styles.capsuleLabel}>DIAS</Text>
                <Text style={styles.capsuleValue} numberOfLines={1} adjustsFontSizeToFit>
                  {timeTotals.days}
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.capsule}>
                <Text style={styles.capsuleLabel}>HORAS</Text>
                <Text style={styles.capsuleValue} numberOfLines={1} adjustsFontSizeToFit>
                  {timeTotals.hours}
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.capsule}>
                <Text style={styles.capsuleLabel}>MINS</Text>
                <Text style={styles.capsuleValue} numberOfLines={1} adjustsFontSizeToFit>
                  {timeTotals.minutes}
                </Text>
              </Animated.View>
            </View>

            {!hasCustomAnniversary && (
              <View style={styles.hintContainer}>
                <Ionicons name="sparkles" size={13} color="#8E7CE8" />
                <Text style={styles.hintText}>
                  Toque para definir o dia em que começamos
                </Text>
              </View>
            )}
          </View>
        </AnimatedTouchable>

        {/* Seção: Memória Recente */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionSubtitle}>MEMÓRIA RECENTE</Text>
        </View>

        {recentMemory ? (
          <AnimatedTouchable
            style={styles.memoryCard}
            onPress={() => router.push('/(tabs)/memories')}
            activeOpacity={0.85}
          >
            <View style={styles.memoryThumbnail}>
              {recentMemory.displayUrl || recentMemory.image_url ? (
                <Image
                  source={{
                    uri: (recentMemory.displayUrl || recentMemory.image_url) as string,
                  }}
                  style={styles.memoryThumbnailImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="images-outline" size={22} color="#8E7CE8" />
              )}
            </View>
            <View style={styles.memoryInfo}>
              <Text style={styles.memoryDate}>
                {formatMemoryDate(recentMemory.memory_date)}
              </Text>
              <Text style={styles.memoryTitle} numberOfLines={1}>
                {recentMemory.title}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#686578" />
          </AnimatedTouchable>
        ) : (
          <AnimatedTouchable
            style={styles.emptyMemoryCard}
            onPress={() => router.push('/(tabs)/memories')}
            activeOpacity={0.85}
          >
            <View style={styles.emptyMemoryThumbnail}>
              <Ionicons name="sparkles-outline" size={22} color="#8E7CE8" />
            </View>
            <View style={styles.memoryInfo}>
              <Text style={styles.emptyMemoryTitle}>
                Toque para guardar sua primeira memória
              </Text>
              <Text style={styles.emptyMemorySubtitle}>
                Eternize os melhores momentos de vocês dois
              </Text>
            </View>
            <Ionicons name="add-circle-outline" size={22} color="#8E7CE8" />
          </AnimatedTouchable>
        )}
      </ScrollView>

      {/* Seletor Nativo Android */}
      {showAndroidPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onValueChange={onAndroidDateChange}
          onDismiss={onDatePickerDismiss}
        />
      )}

      {/* Modal Estilo Apple Liquid Glass para iOS / Outras plataformas */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalGlassCard}>
            <View style={styles.modalHandleBar} />

            <View style={styles.modalIconWrapper}>
              <Ionicons name="heart-circle" size={44} color="#8E7CE8" />
            </View>

            <Text style={styles.modalTitle}>O início de tudo</Text>
            <Text style={styles.modalSubtitle}>
              Quando começou essa história de amor?
            </Text>

            {/* Badge de prévia dinâmica */}
            <View style={styles.previewPill}>
              <Text style={styles.previewPillText}>
                {tempTotals.days.toLocaleString('pt-BR')} dias • {tempTotals.months} meses
              </Text>
            </View>

            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onValueChange={(_event: DateTimePickerChangeEvent, date?: Date) => {
                  if (date) setTempDate(date);
                }}
                textColor="#16151E"
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <AnimatedTouchable
                style={styles.modalCancelButton}
                onPress={() => setIsModalVisible(false)}
                disabled={savingDate}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </AnimatedTouchable>

              <AnimatedTouchable
                style={[styles.modalSaveButton, savingDate && styles.buttonDisabled]}
                onPress={() => handleSaveDate(tempDate)}
                disabled={savingDate}
              >
                {savingDate ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Salvar Data</Text>
                )}
              </AnimatedTouchable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 130,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.25)',
  },
  titleWrapper: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16151E',
    letterSpacing: -1.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  brandDot: {
    color: '#8E7CE8',
  },
  connectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  pulseDotContainer: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  pulseDotRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
  },
  pulseDotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  connectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#686578',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  heroGlassCard: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 28,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 24,
  },
  dateActionBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.25)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  dateActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E7CE8',
  },
  imagePlaceholder: {
    height: 200,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 124, 232, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.15)',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#686578',
    marginTop: 8,
    fontWeight: '500',
  },
  journeyContent: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  journeyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#686578',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  capsulesRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 6,
    marginBottom: 6,
  },
  capsule: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.2)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  capsuleLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#686578',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  capsuleValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8E7CE8',
    letterSpacing: 0,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#8E7CE8',
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#686578',
    letterSpacing: 1.2,
  },
  memoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  memoryThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 124, 232, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  memoryThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  memoryInfo: {
    flex: 1,
  },
  memoryDate: {
    fontSize: 12,
    color: '#686578',
    marginBottom: 2,
  },
  memoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16151E',
  },
  emptyMemoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.2)',
    borderStyle: 'dashed',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 14,
    elevation: 2,
  },
  emptyMemoryThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 124, 232, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emptyMemoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16151E',
    marginBottom: 2,
  },
  emptyMemorySubtitle: {
    fontSize: 12,
    color: '#686578',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(22, 21, 30, 0.45)',
    justifyContent: 'flex-end',
  },
  modalGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHandleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(104, 101, 120, 0.2)',
    marginBottom: 16,
  },
  modalIconWrapper: {
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#16151E',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#686578',
    textAlign: 'center',
    marginBottom: 12,
  },
  previewPill: {
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  previewPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E7CE8',
  },
  datePickerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 999,
    backgroundColor: 'rgba(104, 101, 120, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#686578',
  },
  modalSaveButton: {
    flex: 2,
    height: 50,
    borderRadius: 999,
    backgroundColor: '#8E7CE8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8E7CE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
