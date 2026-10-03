import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
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
import { supabase } from '@/lib/core/supabase';
import { normalizeAndCompressImage } from '@/lib/core/imageManipulation';
import { logger } from '@/lib/core/logger';

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
    setMemories,
    loading,
    loadingMore,
    hasMore,
    refreshing,
    profileMap,
    loadMoreMemories,
    onRefresh,
    loadMemories,
  } = useMemories(coupleId, user);

  const pendingDeleteRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    return () => {
      pendingDeleteRef.current.forEach((timer) => clearTimeout(timer));
      pendingDeleteRef.current.clear();
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
        setMemories((prev) => prev.filter((m) => m.id !== item.id));

        try {
          if (item.image_url) {
            let cleanPath = item.image_url;
            if (cleanPath.includes('/memories/')) {
              cleanPath = cleanPath.split('/memories/')[1].split('?')[0];
            }
            cleanPath = cleanPath.replace(/^\/+/, '');

            const pathsToRemove = [cleanPath];
            if (item.thumb_path) {
              let cleanThumb = item.thumb_path;
              if (cleanThumb.includes('/memories/')) cleanThumb = cleanThumb.split('/memories/')[1].split('?')[0];
              cleanThumb = cleanThumb.replace(/^\/+/, '');
              pathsToRemove.push(cleanThumb);
            }
            await supabase.storage.from('memories').remove(pathsToRemove);
          }

          const { error } = await supabase.from('memories').delete().eq('id', item.id);
          if (error) throw error;

          showToast({ message: `"${item.title}" removida` });
        } catch (err: any) {
          loadMemories(true);
          showToast({ message: 'Erro ao apagar. Tente novamente.', type: 'error' });
        }
      };

      if (Platform.OS === 'web') {
        if (window.confirm(`Tem certeza que deseja excluir "${item.title}"?`)) {
          proceedDelete();
        }
      } else {
        Alert.alert(
          'Remover memória',
          `Tem certeza que deseja excluir "${item.title}"?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: proceedDelete },
          ]
        );
      }
    },
    [showToast, loadMemories, setMemories]
  );

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
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
      Alert.alert('Erro ao selecionar foto', err.message || 'Tente novamente.');
    }
  };

  const handleSaveMemory = async () => {
    if (uploading) return;
    if (!memoryTitle.trim()) {
      Alert.alert('Atenção', 'Por favor, dê um título carinhoso para esta memória.');
      return;
    }
    if (!selectedImageUri || !coupleId || !user?.id) return;

    setUploading(true);
    try {
      const timestamp = Date.now();
      const fileName = `${coupleId}/${timestamp}.jpg`;
      const thumbFileName = `${coupleId}/${timestamp}_thumb.jpg`;

      const mainManipulatedUri = await normalizeAndCompressImage(selectedImageUri, 1080, 0.8);
      const thumbManipulatedUri = await normalizeAndCompressImage(selectedImageUri, 400, 0.75);

      const formDataMain = new FormData();
      formDataMain.append('file', { uri: mainManipulatedUri, name: 'image.jpg', type: 'image/jpeg' } as any);

      const formDataThumb = new FormData();
      formDataThumb.append('file', { uri: thumbManipulatedUri, name: 'thumb.jpg', type: 'image/jpeg' } as any);

      const { error: mainUploadError } = await supabase.storage.from('memories').upload(fileName, formDataMain, { upsert: false });
      if (mainUploadError) throw new Error(mainUploadError.message);

      const { error: thumbUploadError } = await supabase.storage.from('memories').upload(thumbFileName, formDataThumb, { upsert: false });
      const finalThumbPath = thumbUploadError ? null : thumbFileName;

      const year = memoryDate.getFullYear();
      const month = String(memoryDate.getMonth() + 1).padStart(2, '0');
      const day = String(memoryDate.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;

      let { error: insertError } = await supabase.from('memories').insert({
        couple_id: coupleId,
        created_by: user.id,
        title: memoryTitle.trim(),
        memory_date: isoDate,
        image_url: fileName,
        thumb_path: finalThumbPath,
      });

      if (insertError && (insertError.code === '42703' || insertError.message?.includes('thumb_path'))) {
        const retry = await supabase.from('memories').insert({
          couple_id: coupleId,
          created_by: user.id,
          title: memoryTitle.trim(),
          memory_date: isoDate,
          image_url: fileName,
        });
        insertError = retry.error;
      }

      if (insertError) throw new Error(insertError.message);

      const partnerId = Array.from(profileMap.keys()).find((id) => id !== user.id);
      if (partnerId) {
        const partnerProfile = profileMap.get(partnerId);
        if (partnerProfile?.push_token) {
          const currentUserName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Seu amor';
          fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: partnerProfile.push_token,
              sound: 'default',
              title: 'nós.',
              body: `${currentUserName} eternizou um novo momento: "${memoryTitle.trim()}" ✨`,
              data: { url: '/memories' },
            }),
          }).catch((err) => logger.warn('Push error on memory save:', err));
        }
      }

      const optimisticMemory: MemoryItem = {
        id: `local-${timestamp}`,
        couple_id: coupleId,
        created_by: user.id,
        title: memoryTitle.trim(),
        memory_date: isoDate,
        image_url: fileName,
        thumb_path: finalThumbPath,
        displayUrl: mainManipulatedUri,
        displayThumbUrl: thumbManipulatedUri,
        created_at: new Date().toISOString(),
      };
      setMemories((prev) => [optimisticMemory, ...prev]);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAddModalVisible(false);
      setSelectedImageUri(null);
      setMemoryTitle('');

      await loadMemories(true);
    } catch (err: any) {
      Alert.alert('Não conseguimos salvar agora', err.message || 'Tenta de novo?');
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
