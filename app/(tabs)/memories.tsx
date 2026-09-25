import React, { useEffect, useState, useCallback } from 'react';
import { 
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
 } from 'react-native';
import { AnimatedTouchable } from '../../components/AnimatedTouchable';
import { LiquidGlassBackground } from '../../components/LiquidGlassBackground';
import { AppHeader } from '../../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { supabase } from '../../lib/supabase';

interface MemoryItem {
  id: string;
  couple_id: string;
  title: string;
  memory_date: string;
  image_url: string;
  displayUrl?: string;
  created_at: string;
}

const formatFullDatePTBR = (dateString?: string | null): string => {
  if (!dateString) return '';
  const clean = dateString.split('T')[0];
  const parts = clean.split('-');

  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
};

export default function MemoriesScreen() {
  const { user } = useAuth();
  const { coupleId } = useCouple();

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para Adicionar Memória
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryDate, setMemoryDate] = useState<Date>(new Date());
  const [uploading, setUploading] = useState(false);

  // Seletor de data dentro do modal
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Modal para visualização ampliada
  const [previewMemory, setPreviewMemory] = useState<MemoryItem | null>(null);

  // 1. Carrega todas as memórias do casal
  const loadMemories = useCallback(async () => {
    if (!coupleId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('memories')
        .select('id, couple_id, title, memory_date, image_url, created_at')
        .eq('couple_id', coupleId)
        .order('memory_date', { ascending: false });

      if (error) {
        throw error;
      }

      const rawList = data || [];

      // Gera uma URL assinada válida por 24 horas para cada memória
      const memoriesWithSignedUrls: MemoryItem[] = await Promise.all(
        rawList.map(async (item) => {
          if (!item.image_url) {
            return { ...item, displayUrl: '' };
          }

          let cleanPath = item.image_url.trim();
          if (cleanPath.includes('/memories/')) {
            cleanPath = cleanPath.split('/memories/')[1].split('?')[0];
          }

          try {
            const { data: signedData, error: signError } = await supabase.storage
              .from('memories')
              .createSignedUrl(cleanPath, 60 * 60 * 24); // 24 horas de validade

            if (signError || !signedData?.signedUrl) {
              console.warn('Erro ao assinar URL de memória:', signError?.message);
              return { ...item, displayUrl: item.image_url };
            }

            return {
              ...item,
              displayUrl: signedData.signedUrl,
            };
          } catch (signErr) {
            console.warn('Exceção ao gerar signed URL:', signErr);
            return { ...item, displayUrl: item.image_url };
          }
        })
      );

      setMemories(memoriesWithSignedUrls);
    } catch (err: any) {
      console.warn('Erro ao carregar memórias:', err.message);
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) return;

    loadMemories();

    // Sincronização em tempo real para novas memórias
    const channel = supabase
      .channel(`memories_tab_${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memories',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          loadMemories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, loadMemories]);

  // Pull-to-Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadMemories();
    setRefreshing(false);
  };

  // 2. Abre a galeria de imagens
  const handlePickImage = async () => {
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
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImageUri(asset.uri);
        setSelectedImageBase64(asset.base64 || null);
        setMemoryTitle('');
        setMemoryDate(new Date());
        setIsAddModalVisible(true);
      }
    } catch (err: any) {
      Alert.alert('Erro ao selecionar foto', err.message || 'Tente novamente.');
    }
  };

  // 3. Salva a memória no Supabase Storage e na tabela
  const handleSaveMemory = async () => {
    if (!memoryTitle.trim()) {
      Alert.alert('Atenção', 'Por favor, dê um título carinhoso para esta memória.');
      return;
    }

    if (!selectedImageUri || !coupleId || !user?.id) return;

    setUploading(true);

    try {
      const fileName = `${coupleId}/${Date.now()}.jpg`;

      let fileBody: any;
      try {
        const response = await fetch(selectedImageUri);
        fileBody = await response.blob();
      } catch (fetchErr) {
        if (selectedImageBase64) {
          const binary = atob(selectedImageBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          fileBody = bytes;
        } else {
          throw new Error('Não foi possível processar a imagem selecionada.');
        }
      }

      // Upload para o bucket memories
      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(fileName, fileBody, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Formata data ISO YYYY-MM-DD
      const year = memoryDate.getFullYear();
      const month = String(memoryDate.getMonth() + 1).padStart(2, '0');
      const day = String(memoryDate.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;

      // Inserção na tabela memories guardando o caminho relativo no bucket privado
      const { error: insertError } = await supabase.from('memories').insert({
        couple_id: coupleId,
        created_by: user.id,
        title: memoryTitle.trim(),
        memory_date: isoDate,
        image_url: fileName, // Caminho relativo (storage path) no bucket privado
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setIsAddModalVisible(false);
      setSelectedImageUri(null);
      setSelectedImageBase64(null);
      setMemoryTitle('');

      await loadMemories();

      Alert.alert('Memória guardada!', 'Esse momento especial agora está eternizado no NÓS.');
    } catch (err: any) {
      Alert.alert('Erro ao guardar memória', err.message || 'Ocorreu um erro no upload.');
    } finally {
      setUploading(false);
    }
  };

  const onDateChange = (_event: DateTimePickerChangeEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selected) {
      setMemoryDate(selected);
    }
  };

  const onDatePickerDismiss = () => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const renderMemoryCard = ({ item }: { item: MemoryItem }) => {
    const imageUrl = item.displayUrl || item.image_url;

    return (
      <AnimatedTouchable
        style={styles.memoryCard}
        onPress={() => setPreviewMemory(item)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        <View style={styles.cardContent}>
          <View style={styles.datePill}>
            <Ionicons name="calendar-outline" size={13} color="#8E7CE8" />
            <Text style={styles.datePillText}>
              {formatFullDatePTBR(item.memory_date)}
            </Text>
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      </AnimatedTouchable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Liquid Glass */}
      <LiquidGlassBackground />

      {/* Cabeçalho Apple Liquid Glass */}
      <View style={{ paddingHorizontal: 20 }}>
        <AppHeader
          sectionTitle="memórias"
          coupleSubtitle="Nossos momentos eternizados"
        />
      </View>

      {/* Conteúdo Principal */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#8E7CE8" size="large" />
        </View>
      ) : memories.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8E7CE8"
              colors={['#8E7CE8']}
            />
          }
        >
          <View style={styles.emptyGlassCard}>
            <View style={styles.emptyIconBadge}>
              <Ionicons name="images-outline" size={40} color="#8E7CE8" />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma memória guardada ainda</Text>
            <Text style={styles.emptySubtitle}>
              Toque no botão abaixo para adicionar a primeira foto e eternizar o momento.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={memories}
          keyExtractor={(item) => item.id}
          renderItem={renderMemoryCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: 130 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8E7CE8"
              colors={['#8E7CE8']}
            />
          }
        />
      )}

      {/* Botão Flutuante de Adicionar Memória */}
      <AnimatedTouchable
        style={styles.floatingButton}
        onPress={handlePickImage}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.floatingButtonText}>Adicionar Memória</Text>
      </AnimatedTouchable>

      {/* Modal para Adicionar Memória */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !uploading && setIsAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Nova Memória</Text>
            <Text style={styles.modalSubtitle}>
              Guarde este momento com um título e a data em que aconteceu.
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ alignItems: 'center' }}
            >
              {selectedImageUri && (
                <Image
                  source={{ uri: selectedImageUri }}
                  style={styles.modalImagePreview}
                />
              )}

              {/* Campo de Título */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Título da Memória</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Nosso primeiro piquenique..."
                  placeholderTextColor="#686578"
                  value={memoryTitle}
                  onChangeText={setMemoryTitle}
                  maxLength={100}
                />
              </View>

              {/* Botão de Escolha de Data */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Quando aconteceu?</Text>
                <AnimatedTouchable
                  style={styles.dateSelectorButton}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={18} color="#8E7CE8" />
                  <Text style={styles.dateSelectorText}>
                    {formatFullDatePTBR(memoryDate.toISOString())}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#686578" />
                </AnimatedTouchable>
              </View>

              {/* DateTimePicker no iOS ou quando ativado */}
              {(showDatePicker || Platform.OS === 'ios') && (
                <View style={styles.pickerBox}>
                  <DateTimePicker
                    value={memoryDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onValueChange={onDateChange}
                    onDismiss={onDatePickerDismiss}
                    textColor="#16151E"
                  />
                </View>
              )}

              {/* Botões de Ação */}
              <View style={styles.modalActionsRow}>
                <AnimatedTouchable
                  style={styles.modalCancelButton}
                  onPress={() => setIsAddModalVisible(false)}
                  disabled={uploading}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </AnimatedTouchable>

                <AnimatedTouchable
                  style={[styles.modalSaveButton, uploading && styles.buttonDisabled]}
                  onPress={handleSaveMemory}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.modalSaveText}>Guardar</Text>
                      <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                    </>
                  )}
                </AnimatedTouchable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Visualização Ampliada da Foto */}
      <Modal
        visible={!!previewMemory}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewMemory(null)}
      >
        <View style={styles.previewOverlay}>
          <AnimatedTouchable
            style={styles.previewCloseButton}
            onPress={() => setPreviewMemory(null)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </AnimatedTouchable>

          {previewMemory && (
            <View style={styles.previewCard}>
              <Image
                source={{ uri: previewMemory.displayUrl || previewMemory.image_url }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>{previewMemory.title}</Text>
                <Text style={styles.previewDate}>
                  {formatFullDatePTBR(previewMemory.memory_date)}
                </Text>
              </View>
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 124, 232, 0.1)',
    backgroundColor: '#F8F9FC',
  },
  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.25)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8E7CE8',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#686578',
    marginTop: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  emptyGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 28,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    width: '100%',
  },
  emptyIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 26,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.25)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16151E',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#686578',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 180 : 160,
  },
  memoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 26,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 250,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 124, 232, 0.08)',
  },
  cardContent: {
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 4,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(142, 124, 232, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E7CE8',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16151E',
    lineHeight: 24,
  },
  floatingButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 104 : 94,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8E7CE8',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#8E7CE8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 20,
  },
  floatingButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(22, 21, 30, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 20,
    maxHeight: '90%',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(104, 101, 120, 0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#16151E',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#686578',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    marginBottom: 16,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#686578',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInput: {
    height: 52,
    backgroundColor: '#F8F9FC',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#16151E',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.2)',
  },
  dateSelectorButton: {
    height: 52,
    backgroundColor: '#F8F9FC',
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.2)',
  },
  dateSelectorText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16151E',
  },
  pickerBox: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
  modalActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 18,
    marginBottom: 12,
  },
  modalCancelButton: {
    flex: 1,
    height: 52,
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
    height: 52,
    borderRadius: 999,
    backgroundColor: '#8E7CE8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#8E7CE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  previewCard: {
    width: '90%',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 420,
    borderRadius: 20,
  },
  previewInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  previewDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 4,
  },
});
