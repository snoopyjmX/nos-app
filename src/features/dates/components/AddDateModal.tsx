import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AnimatedTouchable } from '@/design/components/AnimatedTouchable';
import { LiquidGlassView } from '@/design/ui/LiquidGlassView';
import { useAppTheme } from '@/lib/context/ThemeContext';
import { getThemeTokens } from '@/design/tokens/theme';
import { formatFullDatePTBR, formatTimePTBR, CATEGORIES } from '../utils/formatting';

interface AddDateModalProps {
  visible: boolean;
  onClose: () => void;
  isEditing: boolean;
  newTitle: string;
  setNewTitle: (val: string) => void;
  newCategory: string;
  setNewCategory: (val: string) => void;
  selectedDate: Date;
  onDateChange: (event: any, date?: Date) => void;
  showDatePicker: boolean;
  setShowDatePicker: (val: boolean) => void;
  selectedTime: Date | null;
  onTimeChange: (event: any, date?: Date) => void;
  showTimePicker: boolean;
  setShowTimePicker: (val: boolean) => void;
  submitting: boolean;
  onSave: () => void;
}

export function AddDateModal({
  visible,
  onClose,
  isEditing,
  newTitle,
  setNewTitle,
  newCategory,
  setNewCategory,
  selectedDate,
  onDateChange,
  showDatePicker,
  setShowDatePicker,
  selectedTime,
  onTimeChange,
  showTimePicker,
  setShowTimePicker,
  submitting,
  onSave,
}: AddDateModalProps) {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const styles = useMemo(() => getStyles(themeTokens, isDark), [themeTokens, isDark]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <LiquidGlassView intensity={isDark ? 30 : 60} style={StyleSheet.absoluteFill} />

        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: themeTokens.background,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeTokens.textPrimary }]}>
              {isEditing ? 'Editar Data' : 'Nova Data Especial'}
            </Text>
            <AnimatedTouchable style={styles.modalCloseBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={themeTokens.textSecondary} />
            </AnimatedTouchable>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* O que vamos celebrar? */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeTokens.textSecondary }]}>
                O que vamos celebrar?
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(124, 111, 224, 0.15)',
                  },
                ]}
              >
                <TextInput
                  style={[styles.textInput, { color: themeTokens.textPrimary }]}
                  placeholder="Ex: Aniversário de namoro, Viagem para Paris..."
                  placeholderTextColor={themeTokens.textMuted}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  maxLength={50}
                  autoCapitalize="sentences"
                />
              </View>
            </View>

            {/* Categoria */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeTokens.textSecondary }]}>
                Categoria
              </Text>
              <View style={styles.categoriesRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = newCategory === cat.id;
                  return (
                    <AnimatedTouchable
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        {
                          backgroundColor: isSelected ? cat.color : (isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6'),
                          borderColor: isSelected ? cat.color : (isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'),
                        },
                      ]}
                      onPress={() => setNewCategory(cat.id)}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={14}
                        color={isSelected ? '#FFFFFF' : themeTokens.textSecondary}
                      />
                      <Text
                        style={[
                          styles.categoryOptionText,
                          { color: isSelected ? '#FFFFFF' : themeTokens.textSecondary },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </AnimatedTouchable>
                  );
                })}
              </View>
            </View>

            {/* Data */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeTokens.textSecondary }]}>
                Data do Evento
              </Text>
              <AnimatedTouchable
                style={[
                  styles.dateTimeButton,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FC',
                    borderColor: showDatePicker
                      ? themeTokens.primary
                      : isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(124, 111, 224, 0.15)',
                  },
                ]}
                onPress={() => {
                  setShowDatePicker(!showDatePicker);
                  if (showTimePicker) setShowTimePicker(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={18} color={themeTokens.primary} />
                <Text style={styles.dateTimeButtonText}>
                  {formatFullDatePTBR(selectedDate.toISOString())}
                </Text>
                <Ionicons
                  name={showDatePicker ? 'chevron-down' : 'chevron-forward'}
                  size={16}
                  color={themeTokens.textSecondary}
                />
              </AnimatedTouchable>
            </View>

            {/* DatePicker */}
            {showDatePicker && (
              <View style={styles.pickerBox}>
                <Text style={[styles.pickerTitle, { color: themeTokens.textSecondary }]}>
                  Selecione o Dia
                </Text>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onValueChange={onDateChange}
                  textColor={isDark ? '#F7F5FF' : '#16151E'}
                  themeVariant={isDark ? 'dark' : 'light'}
                />
              </View>
            )}

            {/* Horário */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeTokens.textSecondary }]}>
                Horário (Opcional)
              </Text>
              <AnimatedTouchable
                style={[
                  styles.dateTimeButton,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8F9FC',
                    borderColor: showTimePicker
                      ? themeTokens.primary
                      : isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(124, 111, 224, 0.15)',
                  },
                ]}
                onPress={() => {
                  setShowTimePicker(!showTimePicker);
                  if (showDatePicker) setShowDatePicker(false);
                  if (!selectedTime) {
                    const now = new Date();
                    now.setHours(20, 0, 0, 0);
                    onTimeChange({ type: "set" }, now);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="time-outline" size={18} color={themeTokens.primary} />
                <Text
                  style={[
                    styles.dateTimeButtonText,
                    !selectedTime && { color: themeTokens.textMuted },
                  ]}
                >
                  {selectedTime ? formatTimePTBR(selectedTime.toISOString()) : 'Nenhum horário definido'}
                </Text>
                <Ionicons
                  name={showTimePicker ? 'chevron-down' : 'chevron-forward'}
                  size={16}
                  color={themeTokens.textSecondary}
                />
              </AnimatedTouchable>
            </View>

            {/* TimePicker */}
            {showTimePicker && (
              <View style={styles.pickerBox}>
                <Text style={[styles.pickerTitle, { color: themeTokens.textSecondary }]}>
                  Selecione o Horário
                </Text>
                <DateTimePicker
                  value={selectedTime || new Date()}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onValueChange={onTimeChange}
                  textColor={isDark ? '#F7F5FF' : '#16151E'}
                  themeVariant={isDark ? 'dark' : 'light'}
                />
              </View>
            )}

            {/* Ações */}
            <View style={styles.modalActionsRow}>
              <AnimatedTouchable
                style={[styles.modalCancelBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]}
                onPress={onClose}
                disabled={submitting}
              >
                <Text style={[styles.modalCancelText, { color: themeTokens.textPrimary }]}>Cancelar</Text>
              </AnimatedTouchable>

              <AnimatedTouchable
                style={[
                  styles.modalSaveBtn,
                  { backgroundColor: themeTokens.primary },
                  submitting && { opacity: 0.7 },
                ]}
                onPress={onSave}
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
  );
}

const getStyles = (themeTokens: any, isDark: boolean) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '90%',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
    shadowColor: '#7C6FE0',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    marginBottom: 8,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
    flex: 1,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryOptionText: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 10,
  },
  dateTimeButtonText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
    color: themeTokens.textPrimary,
  },
  pickerBox: {
    backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F8F9FC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  pickerTitle: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 40,
  },
  modalCancelBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
  },
  modalSaveBtn: {
    flex: 1.5,
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: themeTokens.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  modalSaveText: {
    fontSize: 15,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
