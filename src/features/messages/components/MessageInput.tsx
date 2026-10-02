import React from 'react';
import { View, TextInput, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from '@/components/ui';
import { useTheme } from '@/theme';

interface MessageInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  sending: boolean;
  onSend: () => void;
  isKeyboardVisible: boolean;
  visualKeyboardHeight: number;
  dockInset: number;
}

export function MessageInput({
  inputText,
  setInputText,
  sending,
  onSend,
  isKeyboardVisible,
  visualKeyboardHeight,
  dockInset,
}: MessageInputProps) {
  const { colors, typography, radii, shadows } = useTheme();

  return (
    <View
      style={[
        styles.inputContainer,
        {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: isKeyboardVisible
            ? (Platform.OS === 'ios' ? 10 : 12)
            : dockInset,
          marginBottom: Platform.OS === 'web' ? visualKeyboardHeight : 0,
        },
      ]}
    >
      <View style={styles.inputInnerRow}>
        <View
          style={[
            styles.textInputPill,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radii.lg,
            },
          ]}
        >
          <TextInput
            style={[styles.textInput, { color: colors.textPrimary, fontFamily: typography.fontFamily.regular }]}
            placeholder="Escreva um recado com carinho..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            textAlignVertical="center"
          />
        </View>

        <PressableScale
          style={[
            styles.sendButton,
            { borderRadius: radii.pill },
            (!inputText.trim() || sending) && { opacity: 0.6 },
          ]}
          onPress={onSend}
          disabled={!inputText.trim() || sending}
          accessibilityLabel="Enviar bilhete"
        >
          <LinearGradient
            colors={
              !inputText.trim() || sending
                ? [colors.primarySoft, colors.primarySoft]
                : [colors.primary, colors.accent]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sendButtonGradient}
          >
            {sending ? (
              <ActivityIndicator color={(!inputText.trim() || sending) ? colors.textSecondary : '#FFF'} size="small" />
            ) : (
              <Feather
                name="send"
                size={18}
                color={(!inputText.trim() || sending) ? colors.primary : '#FFF'}
                style={{ marginLeft: -2, marginTop: 2 }}
              />
            )}
          </LinearGradient>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInputPill: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 100,
  },
  sendButton: {
    width: 46,
    height: 46,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
