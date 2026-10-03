import React from 'react';
import { View, Text, StyleSheet, Modal, KeyboardAvoidingView, ScrollView, TextInput, Platform, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton, PressableScale, WebDatePicker } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useReducedMotion } from '@/lib/hooks/useAccessibility';
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
  const { colors, typography, radii, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !uploading && onClose()}
    >
      <KeyboardAvoidingView
        accessibilityViewIsModal
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        {/* Fundo: scrim de vidro que desfoca suavemente a interface */}
        <LiquidGlassView variant="scrim" borderRadius={0} style={StyleSheet.absoluteFill} />

        <Animated.View
          entering={reducedMotion ? FadeIn.duration(150) : SlideInDown.springify().damping(20).stiffness(180)}
          style={styles.sheetAnchor}
        >
        <LiquidGlassView
          variant="hero"
          readable
          borderRadius={0}
          corners={{ borderTopLeftRadius: radii.lg + 8, borderTopRightRadius: radii.lg + 8 }}
          style={[styles.modalCard, { paddingBottom: insets.bottom + spacing[24], maxHeight: windowHeight * 0.9 }]}
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
              <IconButton icon="x" onPress={onClose} disabled={uploading} variant="ghost" accessibilityLabel="Fechar" />
            </View>
          </View>

          <Text accessibilityRole="header" style={[styles.modalTitle, { color: colors.textPrimary, ...typography.font.bold }]}>Nova Memória</Text>
          <Text style={[styles.modalSubtitle, { color: colors.textSecondary, ...typography.font.regular }]}>
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
              <Text style={[styles.inputLabel, { color: colors.textPrimary, ...typography.font.bold }]}>Título da Memória</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.primarySoft,
                    borderColor: 'transparent',
                    color: colors.textPrimary,
                    borderRadius: radii.md,
                    ...typography.font.regular,
                  },
                ]}
                placeholder="Ex: Nosso primeiro piquenique..."
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Título da memória"
                value={memoryTitle}
                onChangeText={setMemoryTitle}
                maxLength={100}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary, ...typography.font.bold }]}>Quando aconteceu?</Text>
              <PressableScale
                onPress={() => setShowDatePicker(true)}
                accessibilityRole="button"
                accessibilityLabel={`Data da memória: ${formatFullDatePTBR(memoryDate.toISOString())}. Toque para alterar`}
              >
                <View
                  style={[
                    styles.dateSelectorButton,
                    { backgroundColor: colors.primarySoft, borderRadius: radii.md },
                  ]}
                >
                  <Feather name="calendar" size={18} color={colors.primaryText} />
                  <Text style={[styles.dateSelectorText, { color: colors.textPrimary, ...typography.font.regular }]}>
                    {formatFullDatePTBR(memoryDate.toISOString())}
                  </Text>
                  <Feather name="chevron-down" size={16} color={colors.textSecondary} />
                </View>
              </PressableScale>
            </View>

            {Platform.OS !== 'web' && (showDatePicker || Platform.OS === 'ios') && (
              <View style={styles.pickerBox}>
                <DateTimePicker
                  value={memoryDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
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

            {Platform.OS === 'web' && (
              <WebDatePicker
                value={memoryDate}
                onChange={(date) => onDateChange({ type: 'set', nativeEvent: { timestamp: date.getTime() } } as any, date)}
                mode="date"
              />
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
  sheetAnchor: {},
  modalCard: {
    paddingTop: 14,
    paddingHorizontal: 20,
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
