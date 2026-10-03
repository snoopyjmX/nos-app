import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { useTheme } from '@/theme';

type IconName = keyof typeof Feather.glyphMap;

const BORDER_WIDTH = 0.8;

interface GlassFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon: IconName;
}

// Campo de formulário em vidro: ícone à esquerda, borda fina e, em senhas, botão de mostrar/ocultar.
export function GlassField({ label, icon, secureTextEntry, ...inputProps }: GlassFieldProps) {
  const { colors, typography, radii, spacing } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isPassword = !!secureTextEntry;

  return (
    <View style={{ gap: spacing[8] }}>
      <Text style={[styles.label, { color: colors.textSecondary, ...typography.font.bold }]}>{label}</Text>
      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.glassSurface,
            borderColor: focused ? colors.primary : colors.border,
            borderRadius: radii.md,
            paddingHorizontal: spacing[16],
            gap: spacing[12],
          },
        ]}
      >
        <Feather name={icon} size={20} color={focused ? colors.primaryText : colors.textSecondary} />
        <TextInput
          {...inputProps}
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
          >
            <Feather name={revealed ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
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
