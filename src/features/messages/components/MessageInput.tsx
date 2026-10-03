import React, { useEffect, useState } from 'react';
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

  const [sendPulse, setSendPulse] = useState(0);
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
        style={[styles.capsule, { gap: spacing[8], padding: spacing[8], paddingLeft: spacing[16] }]}
      >
        <TextInput
          style={[
            styles.textInput,
            { color: colors.textPrimary, ...typography.font.regular },
            Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
          ]}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          textAlignVertical="center"
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
    zIndex: 20,
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 12,
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
