import React from 'react';
import { View, Text, StyleSheet, Modal, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { PressableScale } from '@/components/ui/PressableScale';
import { useTheme } from '@/theme';

interface AnniversaryModalProps {
  visible: boolean;
  tempDate: Date;
  savingDate: boolean;
  showAndroidPicker: boolean;
  setShowAndroidPicker: (show: boolean) => void;
  onDateChange: (event: DateTimePickerChangeEvent, selected?: Date) => void;
  onSave: () => void;
  onClose: () => void;
}

export function AnniversaryModal({
  visible,
  tempDate,
  savingDate,
  showAndroidPicker,
  setShowAndroidPicker,
  onDateChange,
  onSave,
  onClose,
}: AnniversaryModalProps) {
  const { colors, typography, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => !savingDate && onClose()}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.modalHandle, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#E2E8F0' }]} />

          <View style={styles.modalHeaderRow}>
            <View
              style={[
                styles.modalIconBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(157, 146, 240, 0.15)'
                    : 'rgba(124, 111, 224, 0.12)',
                },
              ]}
            >
              <Feather name="calendar" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.black }]}>
                Início do Relacionamento
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
                Essa data alimenta o contador da tela Início e a contagem da jornada de vocês.
              </Text>
            </View>
          </View>

          {/* Botão de abrir picker no Android */}
          {Platform.OS === 'android' && (
            <PressableScale
              style={styles.androidDateButton}
              onPress={() => setShowAndroidPicker(true)}
            >
              <Feather name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.androidDateText, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
                {tempDate.toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </PressableScale>
          )}

          {/* Picker nativo no iOS ou quando ativado no Android */}
          {(Platform.OS === 'ios' || showAndroidPicker) && (
            <View style={styles.pickerBox}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={onDateChange}
                textColor={colors.textPrimary}
              />
            </View>
          )}

          {/* Botões de Ação do Modal */}
          <View style={styles.modalActionsRow}>
            <PressableScale
              style={[
                styles.modalCancelBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(104, 101, 120, 0.08)',
                },
              ]}
              onPress={onClose}
              disabled={savingDate}
              accessibilityLabel="Cancelar edição de data"
            >
              <Text style={[styles.modalCancelText, { color: colors.textSecondary, fontFamily: typography.fontFamily.bold }]}>
                Cancelar
              </Text>
            </PressableScale>

            <PressableScale
              style={[
                styles.modalSaveBtn,
                savingDate && styles.btnDisabled,
              ]}
              onPress={onSave}
              disabled={savingDate}
              accessibilityLabel="Salvar data comemorativa"
            >
              <LinearGradient
                colors={['#7C6FE0', '#F58FA8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              {savingDate ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={[styles.modalSaveText, { fontFamily: typography.fontFamily.bold }]}>Salvar Data</Text>
                  <Feather name="heart" size={16} color="#FFFFFF" />
                </>
              )}
            </PressableScale>
          </View>
        </View>
      </View>
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 44 : 26,
    borderWidth: 1,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  androidDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  androidDateText: {
    fontSize: 14,
  },
  pickerBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
  },
  modalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
