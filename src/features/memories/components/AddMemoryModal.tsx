import React from 'react';
import { View, Text, StyleSheet, Modal, KeyboardAvoidingView, ScrollView, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { AnimatedTouchable } from '@/design/components/AnimatedTouchable';
import { formatFullDatePTBR } from '../utils/formatting';

interface AddMemoryModalProps {
  visible: boolean;
  onClose: () => void;
  selectedImageUri: string | null;
  memoryTitle: string;
  setMemoryTitle: (text: string) => void;
  memoryDate: Date;
  onDateChange: (event: DateTimePickerChangeEvent, selected?: Date) => void;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  uploading: boolean;
  onSave: () => void;
  isDark: boolean;
  themeTokens: any;
}

export function AddMemoryModal({
  visible,
  onClose,
  selectedImageUri,
  memoryTitle,
  setMemoryTitle,
  memoryDate,
  onDateChange,
  showDatePicker,
  setShowDatePicker,
  uploading,
  onSave,
  isDark,
  themeTokens,
}: AddMemoryModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => !uploading && onClose()}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? '#1C1A2E' : '#FFFFFF',
              borderColor: themeTokens.glassBorder,
            },
          ]}
        >
          <View
            style={[
              styles.modalHandle,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#E2E8F0' },
            ]}
          />

          <Text style={[styles.modalTitle, { color: themeTokens.textPrimary }]}>Nova Memória</Text>
          <Text style={[styles.modalSubtitle, { color: themeTokens.textSecondary }]}>
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
                contentFit="cover"
                transition={200}
              />
            )}

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: themeTokens.textPrimary }]}>Título da Memória</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(142, 124, 232, 0.08)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(142, 124, 232, 0.22)',
                    color: themeTokens.textPrimary,
                  },
                ]}
                placeholder="Ex: Nosso primeiro piquenique..."
                placeholderTextColor="#8A879A"
                value={memoryTitle}
                onChangeText={setMemoryTitle}
                maxLength={100}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: themeTokens.textPrimary }]}>Quando aconteceu?</Text>
              <AnimatedTouchable
                style={[
                  styles.dateSelectorButton,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(142, 124, 232, 0.08)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(142, 124, 232, 0.22)',
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={18} color={themeTokens.primary} />
                <Text style={[styles.dateSelectorText, { color: themeTokens.textPrimary }]}>
                  {formatFullDatePTBR(memoryDate.toISOString())}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#8A879A" />
              </AnimatedTouchable>
            </View>

            {(showDatePicker || Platform.OS === 'ios') && (
              <View style={styles.pickerBox}>
                <DateTimePicker
                  value={memoryDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onValueChange={onDateChange}
                  textColor={themeTokens.textPrimary}
                />
                {Platform.OS === 'ios' && (
                  <AnimatedTouchable
                    style={[styles.pickerDoneBtn, { backgroundColor: themeTokens.primary }]}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.pickerDoneBtnText}>Concluir Data</Text>
                  </AnimatedTouchable>
                )}
              </View>
            )}

            <View style={styles.modalActionsRow}>
              <AnimatedTouchable
                style={[
                  styles.modalCancelButton,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(104, 101, 120, 0.08)' },
                ]}
                onPress={onClose}
                disabled={uploading}
              >
                <Text style={[styles.modalCancelText, { color: themeTokens.textSecondary }]}>Cancelar</Text>
              </AnimatedTouchable>

              <AnimatedTouchable
                style={[
                  styles.modalSaveButton,
                  { backgroundColor: themeTokens.primary },
                  uploading && styles.buttonDisabled,
                ]}
                onPress={onSave}
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
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 20,
    maxHeight: '90%',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    fontSize: 13,
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
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInput: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  dateSelectorButton: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  dateSelectorText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pickerBox: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
  pickerDoneBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  pickerDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 2,
    height: 52,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
});
