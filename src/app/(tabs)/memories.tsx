import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { showAlert } from '@/lib/core/dialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDockInset, useDockTop } from '@/lib/hooks/useDockInset';
import { useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '@/lib/context/AuthContext';
import { useCouple } from '@/lib/context/CoupleContext';
import { useTheme } from '@/theme';
import { useToast } from '@/lib/context/ToastContext';

import { MemoryItem } from '@/features/memories/types';
import { useMemories } from '@/features/memories/api/useMemories';
import { MemoryList } from '@/features/memories/components/MemoryList';
import { MemoryFAB } from '@/features/memories/components/MemoryFAB';
import { AddMemoryModal } from '@/features/memories/components/AddMemoryModal';
import { MemoryPreviewModal } from '@/features/memories/components/MemoryPreviewModal';

export default function MemoriesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const insets = useSafeAreaInsets();
  const dockInset = useDockInset();
  const dockTop = useDockTop();
  const reducedMotion = useReducedMotion();
  const { showToast } = useToast();

  const {
    memories,
    loading,
    loadingMore,
    hasMore,
    refreshing,
    profileMap,
    loadMoreMemories,
    onRefresh,
    addMemory,
    removeMemory,
  } = useMemories(coupleId, user);

  const pendingDeleteRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    const pendingDelete = pendingDeleteRef.current;
    return () => {
      pendingDelete.forEach((timer) => clearTimeout(timer));
      pendingDelete.clear();
    };
  }, []);

  // UI States
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryDate, setMemoryDate] = useState<Date>(new Date());
  const [uploading, setUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [previewMemory, setPreviewMemory] = useState<MemoryItem | null>(null);

  const handleDeleteMemory = useCallback(
    (item: MemoryItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const proceedDelete = async () => {
        setPreviewMemory(null);

        try {
          await removeMemory(item);
          showToast({ message: `"${item.title}" removida` });
        } catch {
          showToast({ message: 'Erro ao apagar. Tente novamente.', type: 'error' });
        }
      };

      showAlert('Remover memória', `Tem certeza que deseja excluir "${item.title}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: proceedDelete },
      ]);
    },
    [showToast, removeMemory]
  );

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert(
          'Permissão necessária',
          'Precisamos de acesso às suas fotos para guardar os momentos especiais de vocês.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
        setMemoryTitle('');
        setMemoryDate(new Date());
        setIsAddModalVisible(true);
      }
    } catch (err: any) {
      showAlert('Erro ao selecionar foto', err.message || 'Tente novamente.');
    }
  };

  const handleSaveMemory = async () => {
    if (uploading) return;
    if (!memoryTitle.trim()) {
      showAlert('Atenção', 'Por favor, dê um título carinhoso para esta memória.');
      return;
    }
    if (!selectedImageUri || !coupleId || !user?.id) return;

    setUploading(true);
    try {
      await addMemory({ imageUri: selectedImageUri, title: memoryTitle, date: memoryDate });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAddModalVisible(false);
      setSelectedImageUri(null);
      setMemoryTitle('');
    } catch (err: any) {
      showAlert('Não conseguimos salvar agora', err.message || 'Tenta de novo?');
    } finally {
      setUploading(false);
    }
  };

  const onDateChange = (_event: DateTimePickerChangeEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setMemoryDate(selected);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* A última memória rola livre acima da dock e do FAB (bottomInset) */}
      <MemoryList
        memories={memories}
        user={user}
        profileMap={profileMap}
        loading={loading}
        loadingMore={loadingMore}
        refreshing={refreshing}
        reducedMotion={reducedMotion}
        insets={insets}
        bottomInset={Math.max(dockInset, dockTop + 70)}
        hasMore={hasMore}
        onRefresh={onRefresh}
        onLoadMore={loadMoreMemories}
        onPreview={setPreviewMemory}
        onDelete={handleDeleteMemory}
        onAddMemory={handlePickImage}
      />

      <MemoryFAB onPress={handlePickImage} />

      <AddMemoryModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        selectedImageUri={selectedImageUri}
        memoryTitle={memoryTitle}
        setMemoryTitle={setMemoryTitle}
        memoryDate={memoryDate}
        onDateChange={onDateChange}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        uploading={uploading}
        onSave={handleSaveMemory}
      />

      <MemoryPreviewModal
        previewMemory={previewMemory}
        onClose={() => setPreviewMemory(null)}
        onDelete={handleDeleteMemory}
        user={user}
        profileMap={profileMap}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
