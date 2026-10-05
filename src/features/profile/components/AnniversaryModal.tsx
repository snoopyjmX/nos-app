import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { Easing, FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Button, PressableScale } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { WebDatePicker } from '@/components/ui/WebDatePicker';
import { useReducedMotion } from '@/lib/hooks/useAccessibility';
import { useTheme } from '@/theme';

interface AnniversaryModalProps {
  visible: boolean;
  tempDate: Date;
  savingDate: boolean;
  onDateChange: (date: Date) => void;
  onSave: () => void;
  onClose: () => void;
}

export function AnniversaryModal({
  visible,
  tempDate,
  savingDate,
  onDateChange,
  onSave,
  onClose,
}: AnniversaryModalProps) {
  const { colors, typography, radii, spacing, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const formattedDate = tempDate.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // No Android o seletor é um diálogo do sistema: abri-lo como JSX dentro do Modal colide as janelas.
  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: tempDate,
      mode: 'date',
      maximumDate: new Date(),
      onValueChange: (_event, selectedDate) => onDateChange(selectedDate),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !savingDate && onClose()}
    >
      <View accessibilityViewIsModal style={styles.overlay}>
        {/* Fundo: scrim de vidro que desfoca suavemente a interface */}
        <LiquidGlassView variant="scrim" borderRadius={0} style={StyleSheet.absoluteFill} />

        <Animated.View
          entering={reducedMotion ? FadeIn.duration(150) : SlideInDown.duration(280).easing(Easing.out(Easing.cubic))}
        >
          <LiquidGlassView
            variant="hero"
            readable
            borderRadius={0}
            corners={{ borderTopLeftRadius: radii.lg + 8, borderTopRightRadius: radii.lg + 8 }}
            style={[
              styles.sheet,
              {
                paddingHorizontal: spacing[20],
                paddingBottom: insets.bottom + spacing[24],
                maxHeight: windowHeight * 0.9,
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            {/* Só o conteúdo rola; as ações ficam num rodapé fixo, sempre visível (o spinner do iOS é alto). */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing[16] }}
            >
              <View style={[styles.headerRow, { gap: spacing[12] }]}>
                <View style={[styles.iconBadge, { backgroundColor: colors.primarySoft }]}>
                  <Feather name="calendar" size={22} color={colors.primaryText} />
                </View>
                <View style={styles.headerText}>
                  <Text
                    accessibilityRole="header"
                    style={[styles.title, { color: colors.textPrimary, ...typography.font.black }]}
                  >
                    Início da nossa história
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary, ...typography.font.regular }]}>
                    Essa data alimenta o contador da tela Início e a jornada de vocês.
                  </Text>
                </View>
              </View>

              {Platform.OS === 'android' && (
                <PressableScale
                  onPress={openAndroidPicker}
                  accessibilityRole="button"
                  accessibilityLabel={`Data de início: ${formattedDate}. Toque para alterar`}
                >
                  <View style={[styles.dateButton, { backgroundColor: colors.primarySoft, borderRadius: radii.md }]}>
                    <Feather name="calendar" size={20} color={colors.primaryText} />
                    <Text style={[styles.dateText, { color: colors.textPrimary, ...typography.font.bold }]}>
                      {formattedDate}
                    </Text>
                  </View>
                </PressableScale>
              )}

              {Platform.OS === 'ios' && (
                // Sem animação de entrada: a roda nativa mede o próprio tamanho e piscava ao ser animada.
                <View style={styles.pickerBox}>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    locale="pt-BR"
                    themeVariant={isDark ? 'dark' : 'light'}
                    maximumDate={new Date()}
                    onValueChange={(_event, selectedDate) => {
                      if (selectedDate) onDateChange(selectedDate);
                    }}
                    textColor={colors.textPrimary}
                    style={styles.iosPicker}
                  />
                </View>
              )}

              {Platform.OS === 'web' && (
                <WebDatePicker
                  value={tempDate}
                  onChange={onDateChange}
                  mode="date"
                />
              )}
            </ScrollView>

            <View style={[styles.actions, { gap: spacing[12], marginTop: spacing[16] }]}>
              <View style={styles.actionCancel}>
                <Button variant="secondary" onPress={onClose} disabled={savingDate}>
                  Cancelar
                </Button>
              </View>
              <View style={styles.actionSave}>
                <Button variant="primary" onPress={onSave} loading={savingDate}>
                  Salvar data
                </Button>
              </View>
            </View>
          </LiquidGlassView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  content: {
    flexShrink: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  dateText: {
    fontSize: 15,
    flexShrink: 1,
  },
  pickerBox: {
    alignItems: 'center',
  },
  // A roda do iOS precisa de largura e altura definidas, senão colapsa ou estoura o ScrollView.
  iosPicker: {
    width: '100%',
    height: 216,
  },
  actions: {
    flexDirection: 'row',
  },
  actionCancel: {
    flex: 1,
  },
  actionSave: {
    flex: 1.4,
  },
});
