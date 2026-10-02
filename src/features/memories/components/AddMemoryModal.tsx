import React from 'react';
import { View, Text, StyleSheet, Modal, KeyboardAvoidingView, ScrollView, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { Button, IconButton } from '@/components/ui';
import { useTheme } from '@/theme';
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
}: AddMemoryModalProps) {
  const { colors, typography, radii, shadows } = useTheme();

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
              backgroundColor: colors.surface,
              ...shadows.medium,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={{ width: 44 }} />
            <View
              style={[
                styles.modalHandle,
                { backgroundColor: colors.border },
              ]}
            />
            <View style={{ width: 44, alignItems: 'flex-end' }}>
              <IconButton icon="x" onPress={onClose} disabled={uploading} variant="ghost" />
            </View>
          </View>

          <Text style={[styles.modalTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>Nova Memória</Text>
          <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
            Guarde este momento com um título e a data em que aconteceu.
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center' }}
          >
            {selectedImageUri && (
              <Image
                source={{ uri: selectedImageUri }}
                style={[styles.modalImagePreview, { borderRadius: radii.md }]}
                contentFit="cover"
                transition={200}
              />
            )}

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>Título da Memória</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.primarySoft,
                    borderColor: 'transparent',
                    color: colors.textPrimary,
                    borderRadius: radii.md,
                    fontFamily: typography.fontFamily.regular,
                  },
                ]}
                placeholder="Ex: Nosso primeiro piquenique..."
                placeholderTextColor={colors.textSecondary}
                value={memoryTitle}
                onChangeText={setMemoryTitle}
                maxLength={100}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>Quando aconteceu?</Text>
              <View
                style={[
                  styles.dateSelectorButton,
                  {
                    backgroundColor: colors.primarySoft,
                    borderRadius: radii.md,
                  },
                ]}
                onTouchEnd={() => setShowDatePicker(true)}
              >
                <Feather name="calendar" size={18} color={colors.primary} />
                <Text style={[styles.dateSelectorText, { color: colors.textPrimary, fontFamily: typography.fontFamily.regular }]}>
                  {formatFullDatePTBR(memoryDate.toISOString())}
                </Text>
                <Feather name="chevron-down" size={16} color={colors.textSecondary} />
              </View>
            </View>

            {(showDatePicker || Platform.OS === 'ios') && (
              <View style={styles.pickerBox}>
                <DateTimePicker
                  value={memoryDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onValueChange={onDateChange}
                  textColor={colors.textPrimary}
                />
                {Platform.OS === 'ios' && (
                  <View style={{ marginTop: 16 }}>
                    <Button variant="secondary" onPress={() => setShowDatePicker(false)}>Concluir Data</Button>
                  </View>
                )}
              </View>
            )}

            <View style={styles.modalActionsRow}>
              <View style={{ flex: 1 }}>
                <Button variant="secondary" onPress={onClose} disabled={uploading}>Cancelar</Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button variant="primary" onPress={onSave} loading={uploading}>Guardar</Button>
              </View>
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
  },
  modalTitle: {
    fontSize: 26,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 6,
    paddingHorizontal: 12,
  },
  modalImagePreview: {
    width: '100%',
    height: 220,
    marginBottom: 24,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  textInput: {
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
  },
  dateSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateSelectorText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  pickerBox: {
    width: '100%',
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    width: '100%',
  },
});
