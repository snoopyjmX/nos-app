import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AnimatedIcon, Button, IconButton, PressableScale, WebDatePicker } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useReducedMotion } from '@/lib/hooks/useAccessibility';
import { useTheme } from '@/theme';
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
  onTimeChange: (event: any, date?: Date | null) => void;
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
  const { colors, typography, radii, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Fundo: scrim de vidro que desfoca suavemente a interface */}
        <LiquidGlassView variant="scrim" borderRadius={0} style={StyleSheet.absoluteFill} />

        <Animated.View
          entering={reducedMotion ? FadeIn.duration(150) : SlideInDown.springify().damping(20).stiffness(180)}
        >
        <LiquidGlassView
          variant="hero"
          readable
          borderRadius={0}
          corners={{ borderTopLeftRadius: radii.lg + 8, borderTopRightRadius: radii.lg + 8 }}
          style={[
            styles.modalContent,
            { paddingBottom: insets.bottom + spacing[24], maxHeight: windowHeight * 0.9 },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={[styles.modalTitle, { color: colors.textPrimary, ...typography.font.bold }]}>
              {isEditing ? 'Editar Data' : 'Nova Data Especial'}
            </Text>
            <IconButton icon="x" variant="ghost" onPress={onClose} accessibilityLabel="Fechar" />
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* O que vamos celebrar? */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, ...typography.font.bold }]}>
                O que vamos celebrar?
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.primarySoft,
                    borderRadius: radii.md,
                  },
                ]}
              >
                <TextInput
                  style={[styles.textInput, { color: colors.textPrimary, ...typography.font.regular }]}
                  placeholder="Ex: Aniversário de namoro, Viagem para Paris..."
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Nome da data especial"
                  value={newTitle}
                  onChangeText={setNewTitle}
                  maxLength={50}
                  autoCapitalize="sentences"
                />
              </View>
            </View>

            {/* Categoria */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, ...typography.font.bold }]}>
                Categoria
              </Text>
              <View style={styles.categoriesRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = newCategory === cat.id;
                  return (
                    <PressableScale
                      key={cat.id}
                      onPress={() => setNewCategory(cat.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Categoria ${cat.label}`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <LiquidGlassView
                        variant="pill"
                        readable
                        tintColor={isSelected ? colors.primarySoft : undefined}
                        borderRadius={radii.pill}
                        style={styles.categoryOption}
                      >
                        <AnimatedIcon
                          name={cat.icon}
                          size={15}
                          color={isSelected ? colors.primaryText : colors.textSecondary}
                          active={isSelected}
                        />
                        <Text
                          style={[
                            styles.categoryOptionText,
                            isSelected
                              ? { color: colors.primaryText, ...typography.font.bold }
                              : { color: colors.textSecondary, ...typography.font.medium },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </LiquidGlassView>
                    </PressableScale>
                  );
                })}
              </View>
            </View>

            {/* Data */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, ...typography.font.bold }]}>
                Data do Evento
              </Text>
              <PressableScale
                style={[
                  styles.dateTimeButton,
                  {
                    backgroundColor: colors.primarySoft,
                    borderRadius: radii.md,
                    borderColor: showDatePicker ? colors.primary : 'transparent',
                    borderWidth: 1,
                  },
                ]}
                onPress={() => {
                  setShowDatePicker(!showDatePicker);
                  if (showTimePicker) setShowTimePicker(false);
                }}
              >
                <Feather name="calendar" size={18} color={colors.primaryText} />
                <Text style={[styles.dateTimeButtonText, { color: colors.textPrimary, ...typography.font.regular }]}>
                  {formatFullDatePTBR(selectedDate.toISOString())}
                </Text>
                <Feather
                  name={showDatePicker ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textSecondary}
                />
              </PressableScale>
            </View>

            {/* DatePicker */}
            {Platform.OS !== 'web' && showDatePicker && (
              <View style={[styles.pickerBox, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.pickerTitle, { color: colors.textSecondary, ...typography.font.bold }]}>
                  Selecione o Dia
                </Text>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  textColor={colors.textPrimary}
                />
                {Platform.OS === 'ios' && (
                  <View style={{ marginTop: 16 }}>
                    <Button variant="secondary" onPress={() => setShowDatePicker(false)}>Concluir Data</Button>
                  </View>
                )}
              </View>
            )}

            {Platform.OS === 'web' && showDatePicker && (
              <View style={[styles.pickerBox, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.pickerTitle, { color: colors.textSecondary, ...typography.font.bold }]}>
                  Selecione o Dia
                </Text>
                <WebDatePicker
                  value={selectedDate}
                  onChange={(date) => onDateChange({ type: 'set', nativeEvent: { timestamp: date.getTime() } } as any, date)}
                  mode="date"
                />
                <View style={{ marginTop: 16 }}>
                  <Button variant="secondary" onPress={() => setShowDatePicker(false)}>Concluir Data</Button>
                </View>
              </View>
            )}

            {/* Horário Opcional */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary, ...typography.font.bold }]}>
                Horário (Opcional)
              </Text>
              <PressableScale
                style={[
                  styles.dateTimeButton,
                  {
                    backgroundColor: colors.primarySoft,
                    borderRadius: radii.md,
                    borderColor: showTimePicker ? colors.primary : 'transparent',
                    borderWidth: 1,
                  },
                ]}
                onPress={() => {
                  setShowTimePicker(!showTimePicker);
                  if (showDatePicker) setShowDatePicker(false);
                  if (!selectedTime) {
                    const now = new Date();
                    now.setHours(12, 0, 0, 0);
                    onTimeChange(null, now);
                  }
                }}
              >
                <Feather name="clock" size={18} color={colors.primaryText} />
                <Text style={[styles.dateTimeButtonText, { color: colors.textPrimary, ...typography.font.regular }]}>
                  {selectedTime ? formatTimePTBR(selectedTime.toISOString()) : 'Adicionar Horário'}
                </Text>
                <Feather
                  name={showTimePicker ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textSecondary}
                />
              </PressableScale>

              {selectedTime && (
                <PressableScale
                  style={styles.clearTimeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Remover horário do evento"
                  onPress={() => {
                    onTimeChange(null, null);
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={[styles.clearTimeText, { color: colors.dangerText, ...typography.font.bold }]}>
                    Remover Horário
                  </Text>
                </PressableScale>
              )}
            </View>

            {/* TimePicker */}
            {Platform.OS !== 'web' && showTimePicker && (
              <View style={[styles.pickerBox, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.pickerTitle, { color: colors.textSecondary, ...typography.font.bold }]}>
                  Selecione o Horário
                </Text>
                <DateTimePicker
                  value={selectedTime || new Date()}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  is24Hour={true}
                  onChange={onTimeChange}
                  textColor={colors.textPrimary}
                />
                {Platform.OS === 'ios' && (
                  <View style={{ marginTop: 16 }}>
                    <Button variant="secondary" onPress={() => setShowTimePicker(false)}>Concluir Horário</Button>
                  </View>
                )}
              </View>
            )}

            {Platform.OS === 'web' && showTimePicker && (
              <View style={[styles.pickerBox, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.pickerTitle, { color: colors.textSecondary, ...typography.font.bold }]}>
                  Selecione o Horário
                </Text>
                <WebDatePicker
                  value={selectedTime || new Date()}
                  onChange={(date) => onTimeChange({ type: 'set', nativeEvent: { timestamp: date.getTime() } } as any, date)}
                  mode="time"
                />
                <View style={{ marginTop: 16 }}>
                  <Button variant="secondary" onPress={() => setShowTimePicker(false)}>Concluir Horário</Button>
                </View>
              </View>
            )}

            <View style={styles.modalActionsRow}>
              <View style={{ flex: 1 }}>
                <Button variant="secondary" onPress={onClose} disabled={submitting}>Cancelar</Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button variant="primary" onPress={onSave} loading={submitting}>Salvar Data</Button>
              </View>
            </View>
          </ScrollView>
        </LiquidGlassView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textInput: {
    fontSize: 16,
    padding: 0,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  categoryOptionText: {
    fontSize: 13,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateTimeButtonText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  clearTimeButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  clearTimeText: {
    fontSize: 13,
  },
  pickerBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    marginTop: -8,
  },
  pickerTitle: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
    width: '100%',
  },
});
