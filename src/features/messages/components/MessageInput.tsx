import React from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassSurface } from '@/design/ui/GlassSurface';
import { PressableScale } from '@/design/ui/PressableScale';

interface MessageInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  sending: boolean;
  onSend: () => void;
  isDark: boolean;
  themeTokens: any;
  isKeyboardVisible: boolean;
  visualKeyboardHeight: number;
  tabBarHeight: number;
}

export function MessageInput({
  inputText,
  setInputText,
  sending,
  onSend,
  isDark,
  themeTokens,
  isKeyboardVisible,
  visualKeyboardHeight,
  tabBarHeight,
}: MessageInputProps) {
  return (
    <View
      style={[
        styles.blurredInputContainer,
        {
          paddingBottom: isKeyboardVisible
            ? (Platform.OS === 'ios' ? 10 : 12)
            : tabBarHeight + 10,
          marginBottom: Platform.OS === 'web' ? visualKeyboardHeight : 0,
        },
      ]}
    >
      <GlassSurface
        intensity={Platform.OS === 'ios' ? 80 : 100}
        tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark ? 'rgba(21, 18, 42, 0.75)' : 'rgba(248, 246, 254, 0.80)',
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
          },
        ]}
      />
      <View style={styles.inputInnerRow}>
        <View
          style={[
            styles.textInputPill,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : '#FFFFFF',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.14)'
                : 'rgba(124, 111, 224, 0.20)',
            },
          ]}
        >
          <TextInput
            style={[styles.textInput, { color: themeTokens.textPrimary }]}
            placeholder="Escreva um recado com carinho..."
            placeholderTextColor={themeTokens.textMuted}
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
            (!inputText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={onSend}
          disabled={!inputText.trim() || sending}
          accessibilityLabel="Enviar bilhete"
        >
          <LinearGradient
            colors={
              !inputText.trim() || sending
                ? [isDark ? '#2A2545' : '#EFECFC', isDark ? '#2A2545' : '#EFECFC']
                : ['#7C6FE0', '#F58FA8']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons
            name="paper-plane"
            size={16}
            color={!inputText.trim() || sending ? (isDark ? '#5B5675' : '#AAA5B8') : '#FFFFFF'}
            style={{ marginLeft: 2 }}
          />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blurredInputContainer: {
    zIndex: 20,
    overflow: 'hidden',
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  textInputPill: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    paddingVertical: 8,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C6FE0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
});
