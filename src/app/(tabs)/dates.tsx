import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, RefreshControl, Alert, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDockInset } from '@/lib/hooks/useDockInset';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from 'react-native-reanimated';

import { EmptyState } from '@/components/ui';
import { useAuth } from '@/lib/context/AuthContext';
import { useCouple } from '@/lib/context/CoupleContext';
import { useTheme } from '@/theme';
import { useTabBarHeight } from '@/lib/hooks/useTabBarHeight';
import { useToast } from '@/lib/context/ToastContext';
import { supabase } from '@/lib/core/supabase';

import { useDates } from '@/features/dates/api/useDates';
import { SpecialDate } from '@/features/dates/types';
import { FilterTabs } from '@/features/dates/components/FilterTabs';
import { DatesHeroCard } from '@/features/dates/components/DatesHeroCard';
import { DateListItem } from '@/features/dates/components/DateListItem';
import { AddDateModal } from '@/features/dates/components/AddDateModal';
import { IconButton } from '@/components/ui';

export default function DatesScreen() {
  const { colors, typography, isDark } = useTheme();
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const insets = useSafeAreaInsets();
  const dockInset = useDockInset();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + (Platform.OS === 'ios' ? 88 : 82),
          paddingBottom: dockInset,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
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
            <View style={[styles.skeletonCard, { height: 240, backgroundColor: colors.surface }]} />
            <View style={[styles.skeletonCard, { backgroundColor: colors.surface }]} />
            <View style={[styles.skeletonCard, { backgroundColor: colors.surface }]} />
          </View>
        ) : (
          <>
            {activeTab === 'upcoming' && nextHeroEvent && (
              <DatesHeroCard nextEvent={nextHeroEvent} reducedMotion={reducedMotion} />
            )}

            {activeTab === 'upcoming' && upcomingEvents.length === 0 && (
              <EmptyState
                icon="calendar"
                title="Nenhuma data próxima"
                description="Planejem o próximo encontro ou viagem juntos!"
                actionLabel="Nova Data"
                onAction={handleOpenAddModal}
              />
            )}

            {activeTab === 'past' && pastEvents.length === 0 && (
              <EmptyState
                icon="clock"
                title="Nenhum histórico"
                description="Momentos incríveis ainda estão por vir."
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

      {/* Header Fixo Sólido */}
      <View 
        style={[
          styles.headerContainer, 
          { 
            paddingTop: insets.top,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }
        ]}
      >
        <View style={styles.headerInnerRow}>
          <Text style={[styles.headerBrandTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>Datas Especiais</Text>
          <IconButton icon="plus" variant="primary" onPress={handleOpenAddModal} accessibilityLabel="Nova Data" />
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, overflow: 'hidden',
  },
  headerInnerRow: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrandTitle: {
    fontSize: 27,
    letterSpacing: -0.8,
  },
  skeletonContainer: { paddingTop: 10, gap: 16 },
  skeletonCard: {
    width: '100%', height: 90, borderRadius: 24, borderWidth: 1, borderColor: 'transparent'
  },
});
