import React, { useEffect, useRef, useState } from 'react';
import {
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedIcon, PressableScale } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useReducedMotion } from '@/lib/hooks/useAccessibility';
import { useTheme } from '@/theme';

const FLOAT_GAP = 12;
const KEYBOARD_GAP = 8;

interface MessageInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  sending: boolean;
  onSend: () => void;
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  dockTop: number;
  /** Modo bilhete: o próximo envio vira o Bilhete do Dia. */
  isNoteMode: boolean;
  onToggleNoteMode: () => void;
  /** Incrementar pede foco no campo (abre o teclado). */
  focusSignal?: number;
  onLayout?: (event: LayoutChangeEvent) => void;
}

// Distância da base da tela até a base do input: 12px acima da dock, ou colado ao teclado.
export function getInputOffset(isKeyboardVisible: boolean, keyboardHeight: number, dockTop: number) {
  return isKeyboardVisible ? keyboardHeight + KEYBOARD_GAP : dockTop + FLOAT_GAP;
}

export function MessageInput({
  inputText,
  setInputText,
  sending,
  onSend,
  isKeyboardVisible,
  keyboardHeight,
  dockTop,
  isNoteMode,
  onToggleNoteMode,
  focusSignal = 0,
  onLayout,
}: MessageInputProps) {
  const { colors, typography, radii, spacing, motion } = useTheme();
  const reducedMotion = useReducedMotion();

  const offset = getInputOffset(isKeyboardVisible, keyboardHeight, dockTop);
  const lift = useSharedValue(offset);

  useEffect(() => {
    lift.value = reducedMotion
      ? withTiming(offset, { duration: 120, easing: Easing.out(Easing.cubic) })
      : withSpring(offset, motion.easing.springDock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, reducedMotion]);

  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -lift.value }],
  }));

  const inputRef = useRef<TextInput>(null);
  const [notePulse, setNotePulse] = useState(0);
  const [sendPulse, setSendPulse] = useState(0);

  useEffect(() => {
    if (focusSignal > 0) inputRef.current?.focus();
  }, [focusSignal]);

  const canSend = inputText.trim().length > 0 && !sending;

  return (
    <Animated.View
      style={[styles.wrapper, { paddingHorizontal: spacing[16] }, liftStyle]}
      onLayout={onLayout}
      pointerEvents="box-none"
    >
      <LiquidGlassView
        variant="hero"
        borderRadius={radii.lg}
        style={[styles.capsule, { gap: spacing[8], padding: spacing[8] }]}
      >
        <PressableScale
          style={[styles.noteButton, isNoteMode && { backgroundColor: colors.accentGlass }]}
          onPress={onToggleNoteMode}
          onPressIn={() => setNotePulse((value) => value + 1)}
          accessibilityRole="button"
          accessibilityLabel="Escrever como bilhete especial"
          accessibilityHint="Ativa ou desativa o modo bilhete para o próximo envio"
          accessibilityState={{ selected: isNoteMode }}
        >
          <AnimatedIcon
            name="feather"
            size={18}
            color={isNoteMode ? colors.accentText : colors.textSecondary}
            active={isNoteMode}
            pulseKey={notePulse}
          />
        </PressableScale>

        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            { color: colors.textPrimary, ...typography.font.regular },
            Platform.OS === 'web'
              ? [
                  styles.textInputWeb,
                  {
                    backgroundColor: colors.transparent,
                    color: colors.textPrimary,
                    // O index.html fixa -webkit-text-fill-color nos campos; sem repeti-lo com a cor do tema, `color` não pinta o texto.
                    WebkitTextFillColor: colors.textPrimary,
                    caretColor: colors.primary,
                  } as object,
                ]
              : null,
          ]}
          // react-native-web deixa o <textarea> com 2 linhas por padrão; 1 linha só na web
          // (no Android, numberOfLines limitaria o campo a uma linha mesmo com texto longo).
          numberOfLines={Platform.OS === 'web' ? 1 : undefined}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          placeholder={isNoteMode ? 'Escrever um bilhete especial...' : 'Digite sua mensagem...'}
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          textAlignVertical={Platform.OS === 'web' ? undefined : 'center'}
          accessibilityLabel="Escrever recado"
        />

        <PressableScale
          style={[styles.sendButton, !canSend && styles.sendDisabled]}
          onPress={onSend}
          onPressIn={() => setSendPulse((value) => value + 1)}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Enviar recado"
          accessibilityState={{ disabled: !canSend }}
        >
          <LinearGradient
            colors={canSend ? [colors.glow, colors.primary] : [colors.primarySoft, colors.primarySoft]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sendGradient}
          >
            {sending ? (
              <ActivityIndicator color={colors.textSecondary} size="small" />
            ) : (
              <AnimatedIcon
                name="send"
                size={18}
                color={canSend ? colors.onPrimary : colors.textSecondary}
                pulseKey={canSend ? sendPulse : 0}
                style={styles.sendIcon}
              />
            )}
          </LinearGradient>
        </PressableScale>
      </LiquidGlassView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 120,
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    maxHeight: 120,
    fontSize: 16,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'web' ? 8 : 10,
  },
  textInputWeb: {
    ...({ outlineStyle: 'none', resize: 'none' } as object),
    borderWidth: 0,
    // O <textarea> é static e pinta abaixo das camadas absolutas do vidro (tinta e reflexo), que
    // apagam o texto no tema claro. Posicionado, ele entra na ordem de pintura e fica por cima.
    position: 'relative',
  },
  noteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  sendDisabled: {
    opacity: 0.7,
  },
  sendGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    marginRight: 2,
    marginTop: 1,
  },
});
