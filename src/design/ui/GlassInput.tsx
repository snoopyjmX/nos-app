import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  TextInputProps,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppTheme } from '@/lib/context/ThemeContext';
import { getThemeTokens } from '@/design/tokens/theme';

export interface GlassInputProps extends TextInputProps {
  label?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function GlassInput({
  label,
  iconName,
  error,
  containerStyle,
  secureTextEntry,
  style,
  ...props
}: GlassInputProps) {
  const { isDark } = useAppTheme();
  const theme = getThemeTokens(isDark);

  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = Boolean(secureTextEntry);
  const showTextAsSecure = isPassword && !isPasswordVisible;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.06)'
              : 'rgba(255, 255, 255, 0.85)',
            borderColor: error
              ? theme.error
              : isFocused
              ? theme.primary
              : isDark
              ? 'rgba(255, 255, 255, 0.14)'
              : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        {iconName ? (
          <Ionicons
            name={iconName}
            size={20}
            color={isFocused ? theme.primary : theme.textSecondary}
            style={styles.leadingIcon}
          />
        ) : null}

        <TextInput
          {...props}
          style={[
            styles.input,
            {
              color: isDark ? '#F7F5FF' : theme.textPrimary,
              ...(Platform.OS === 'web'
                ? ({
                    color: isDark ? '#F7F5FF' : theme.textPrimary,
                    WebkitTextFillColor: isDark ? '#F7F5FF' : theme.textPrimary,
                    outlineStyle: 'none',
                  } as any)
                : {}),
            },
            style,
          ]}
          placeholderTextColor={isDark ? 'rgba(247, 245, 255, 0.45)' : theme.textMuted}
          selectionColor={isDark ? '#A797FF' : theme.primary}
          cursorColor={isDark ? '#A797FF' : theme.primary}
          secureTextEntry={showTextAsSecure}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setIsPasswordVisible((prev) => !prev)}
            hitSlop={8}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Ver senha'}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
    letterSpacing: -0.1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  leadingIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
});
