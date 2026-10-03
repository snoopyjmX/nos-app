import React from 'react';
import { Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { LiquidGlassView } from './LiquidGlassView';
import { AnimatedIcon } from './AnimatedIcon';
import { useTheme } from '@/theme';

type IconName = keyof typeof Feather.glyphMap;

interface GlassButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// Botão secundário em pílula de vidro translúcido.
export function GlassButton({
  label,
  onPress,
  icon,
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: GlassButtonProps) {
  const { colors, typography, radii, spacing } = useTheme();
  const [pulse, setPulse] = React.useState(0);

  return (
    <PressableScale
      onPress={onPress}
      onPressIn={() => setPulse((value) => value + 1)}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={disabled ? styles.disabled : undefined}
    >
      <LiquidGlassView variant="control" readable borderRadius={radii.pill} style={[styles.pill, { gap: spacing[8], paddingHorizontal: spacing[24] }]}>
        {loading ? (
          <ActivityIndicator color={colors.primaryText} size="small" />
        ) : (
          <>
            {icon ? <AnimatedIcon name={icon} size={18} color={colors.primaryText} pulseKey={pulse} /> : null}
            <Text style={[styles.label, { color: colors.primaryText, ...typography.font.bold }]}>{label}</Text>
          </>
        )}
      </LiquidGlassView>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    flexShrink: 1,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
});
