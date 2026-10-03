import React, { forwardRef, useState } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { useTheme } from '@/theme';

type IconName = keyof typeof Feather.glyphMap;

const BORDER_WIDTH = 0.8;

interface GlassFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon: IconName;
  /** Mensagem de erro exibida abaixo do campo; também marca o campo como inválido. */
  error?: string | null;
}

// Campo de formulário em vidro: ícone à esquerda, borda fina e, em senhas, botão de mostrar/ocultar.
export const GlassField = forwardRef<TextInput, GlassFieldProps>(function GlassField(
  { label, icon, error, secureTextEntry, ...inputProps },
  ref
) {
  const { colors, typography, radii, spacing } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isPassword = !!secureTextEntry;
  const hasError = !!error;
  const ringColor = hasError ? colors.dangerText : colors.primary;
  const focusRing = focused
    ? ({ boxShadow: `0 0 0 2px ${ringColor}` } as object)
    : null;

  return (
    <View style={{ gap: spacing[8] }}>
      <Text style={[styles.label, { color: colors.textSecondary, ...typography.font.bold }]}>{label}</Text>
      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.glassSurface,
            borderColor: hasError ? colors.dangerText : focused ? colors.primary : colors.fieldBorder,
            borderRadius: radii.md,
            paddingHorizontal: spacing[16],
            gap: spacing[12],
          },
          focusRing,
        ]}
      >
        <Feather name={icon} size={20} color={focused ? colors.primaryText : colors.textSecondary} />
        <TextInput
          {...inputProps}
          ref={ref}
          aria-invalid={hasError || undefined}
          secureTextEntry={isPassword && !revealed}
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          style={[
            styles.input,
            { color: colors.textPrimary, ...typography.font.medium },
            Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
          ]}
        />
        {isPassword ? (
          <PressableScale
            onPress={() => setRevealed((value) => !value)}
            style={styles.reveal}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            accessibilityState={{ expanded: revealed }}
          >
            <Feather name={revealed ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
          </PressableScale>
        ) : null}
      </View>
      {hasError ? (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[styles.error, { color: colors.dangerText, ...typography.font.medium }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    marginLeft: 4,
  },
  error: {
    fontSize: 13,
    marginLeft: 4,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderWidth: BORDER_WIDTH,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    paddingVertical: 12,
  },
  reveal: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -12,
  },
});
