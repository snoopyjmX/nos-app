import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from 'react-native-reanimated';

import { AtmosphereBackground } from '@/design/ui/AtmosphereBackground';
import { GlassSurface } from '@/design/ui/GlassSurface';
import { EmptyState } from '@/design/ui/EmptyState';
import { AppHeader } from '@/design/components/AppHeader';
import { AnimatedTouchable } from '@/design/components/AnimatedTouchable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from 'react-native';

import { useAuth } from '@/lib/context/AuthContext';
import { useCouple } from '@/lib/context/CoupleContext';
import { useAppTheme } from '@/lib/context/ThemeContext';
import { getThemeTokens } from '@/design/tokens/theme';
import { useTabBarHeight } from '@/lib/hooks/useTabBarHeight';
import { useToast } from '@/lib/context/ToastContext';
import { supabase } from '@/lib/core/supabase';

import { useDates } from '@/features/dates/api/useDates';
import { SpecialDate } from '@/features/dates/types';
import { FilterTabs } from '@/features/dates/components/FilterTabs';
import { DatesHeroCard } from '@/features/dates/components/DatesHeroCard';
import { DateListItem } from '@/features/dates/components/DateListItem';
import { AddDateModal } from '@/features/dates/components/AddDateModal';

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

  const {
    loading,
    refreshing,
    onRefresh,
    upcomingEvents,
    pastEvents,
    nextHeroEvent,
  } = useDates(coupleId);

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

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

  useEffect(() => {
    return () => {
      pendingDeleteRef.current.forEach((timer) => clearTimeout(timer));
      pendingDeleteRef.current.clear();
    };
  }, []);

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

      let dateString = `${year}-${month}-${day}T00:00:00`;
      if (selectedTime) {
        const h = String(selectedTime.getHours()).padStart(2, '0');
        const m = String(selectedTime.getMinutes()).padStart(2, '0');
        const s = String(selectedTime.getSeconds()).padStart(2, '0');
        dateString = `${year}-${month}-${day}T${h}:${m}:${s}`;
      }

      if (editingDateId) {
        const { error } = await supabase
          .from('special_dates')
          .update({
            title: newTitle.trim(),
            category: newCategory,
            event_date: dateString,
          })
          .eq('id', editingDateId)
          .eq('couple_id', coupleId);
        if (error) throw error;
        showToast({ type: 'success', message: 'Data atualizada!' });
      } else {
        const { error } = await supabase
          .from('special_dates')
          .insert([
            {
              couple_id: coupleId,
              title: newTitle.trim(),
              category: newCategory,
              event_date: dateString,
              created_by: user.id,
            },
          ]);
        if (error) throw error;
        showToast({ type: 'success', message: 'Data adicionada!', });
      }

      setIsAddModalVisible(false);
    } catch (err: any) {
      showToast({ type: 'error', message: 'Erro ao salvar: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingDateId(null);
    setNewTitle('');
    setNewCategory('Comemoração');
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
    setSelectedTime(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setIsAddModalVisible(true);
  }, []);

  const handleEditDate = useCallback((item: SpecialDate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingDateId(item.id);
    setNewTitle(item.title);
    setNewCategory(item.category);

    const d = new Date(item.event_date);
    if (!isNaN(d.getTime())) {
      setSelectedDate(d);
      if (!item.event_date.includes('T00:00:00')) {
        setSelectedTime(d);
      } else {
        setSelectedTime(null);
      }
    } else {
      setSelectedDate(new Date());
      setSelectedTime(null);
    }

    setShowDatePicker(false);
    setShowTimePicker(false);
    setIsAddModalVisible(true);
  }, []);

  const handleDeleteDate = useCallback((item: SpecialDate) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    // Opcional: optimistic delete via parent API se existisse
    const timer = setTimeout(async () => {
      pendingDeleteRef.current.delete(item.id);
      try {
        await supabase
          .from('special_dates')
          .delete()
          .eq('id', item.id)
          .eq('couple_id', coupleId);
      } catch {}
    }, 100);
    
    pendingDeleteRef.current.set(item.id, timer);
  }, [coupleId]);

  const displayedList = activeTab === 'upcoming'
    ? upcomingEvents.slice(1)
    : pastEvents;

  return (
    <View style={[styles.container, { backgroundColor: themeTokens.background }]}>
      <AtmosphereBackground />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + (Platform.OS === 'ios' ? 88 : 82),
          paddingBottom: tabBarPaddingBottom + 40,
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
        <FilterTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          upcomingCount={upcomingEvents.length}
          pastCount={pastEvents.length}
        />

        {loading ? (
          <View style={styles.skeletonContainer}>
            <View style={[styles.skeletonCard, { height: 240 }]} />
            <View style={styles.skeletonCard} />
            <View style={styles.skeletonCard} />
          </View>
        ) : (
          <>
            {activeTab === 'upcoming' && nextHeroEvent && (
              <DatesHeroCard nextEvent={nextHeroEvent} reducedMotion={reducedMotion} />
            )}

            {activeTab === 'upcoming' && upcomingEvents.length === 0 && (
              <EmptyState
                icon="calendar-outline"
                title="Nenhuma data próxima"
                subtitle="Planejem o próximo encontro ou viagem juntos!"
                actionLabel="Nova Data"
                onAction={handleOpenAddModal}
              />
            )}

            {activeTab === 'past' && pastEvents.length === 0 && (
              <EmptyState
                icon="time-outline"
                title="Nenhum histórico"
                subtitle="Momentos incríveis ainda estão por vir."
              />
            )}

            {displayedList.map((item, index) => (
              <DateListItem
                key={item.id}
                item={item}
                index={index}
                reducedMotion={reducedMotion}
                onEdit={handleEditDate}
                onDelete={handleDeleteDate}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Header Fixo com Blur */}
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
            sectionTitle="Datas Especiais"
            containerStyle={{ marginBottom: 0, paddingTop: 4, paddingBottom: 8 }}
            rightAction={
              <AnimatedTouchable style={styles.headerAddBtn} onPress={handleOpenAddModal}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.headerAddBtnText}>Nova</Text>
              </AnimatedTouchable>
            }
          />
        </View>
      </View>

      <AddDateModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        isEditing={!!editingDateId}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        selectedDate={selectedDate}
        onDateChange={(_e, d) => d && setSelectedDate(d)}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        selectedTime={selectedTime}
        onTimeChange={(_e, d) => d && setSelectedTime(d)}
        showTimePicker={showTimePicker}
        setShowTimePicker={setShowTimePicker}
        submitting={submitting}
        onSave={handleSaveDate}
      />
    </View>
  );
}

const getStyles = (themeTokens: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1 },
  blurredHeaderContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, overflow: 'hidden',
  },
  headerInnerRow: { paddingHorizontal: 20, paddingBottom: 4 },
  headerAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: themeTokens.primary,
    shadowColor: themeTokens.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  headerAddBtnText: {
    fontSize: 13, fontFamily: 'Nunito_700Bold', fontWeight: '700',
    color: '#FFFFFF', letterSpacing: -0.2,
  },
  skeletonContainer: { paddingTop: 10, gap: 16 },
  skeletonCard: {
    width: '100%', height: 90, borderRadius: 24, borderWidth: 1,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(142, 124, 232, 0.08)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(142, 124, 232, 0.15)',
  },
});
