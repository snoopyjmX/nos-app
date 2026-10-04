import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from './PressableScale';
import { LiquidGlassView } from './LiquidGlassView';
import { AnimatedIcon } from './AnimatedIcon';
import { BorderBeam } from './BorderBeam';
import { useTheme } from '@/theme';

type IconName = keyof typeof Feather.glyphMap;

interface LiquidGlassButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  /** `accent` adiciona um feixe sutil percorrendo o contorno. */
  variant?: 'glass' | 'accent';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// Pílula de vidro líquido: háptico leve, glint especular na metade superior e, no accent, feixe de borda.
export function LiquidGlassButton({
  label,
  onPress,
  icon,
  variant = 'glass',
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: LiquidGlassButtonProps) {
  const { colors, typography, radii, spacing } = useTheme();
  const [pulse, setPulse] = React.useState(0);

  const inactive = disabled || loading;
  const accent = variant === 'accent';
  const tone = accent ? colors.accentText : colors.primaryText;

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <PressableScale
      onPress={handlePress}
      onPressIn={() => setPulse((value) => value + 1)}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={disabled ? styles.disabled : undefined}
    >
      <LiquidGlassView
        variant="control"
        readable
        borderRadius={radii.pill}
        style={[styles.pill, { gap: spacing[8], paddingHorizontal: spacing[24] }]}
      >
        {/* Glint especular: recorte próprio, para não misturar sombra e overflow na mesma view. */}
        <View style={[styles.glint, { borderTopLeftRadius: radii.pill, borderTopRightRadius: radii.pill }]} pointerEvents="none">
          <LinearGradient colors={colors.dockIndicatorGlint} style={StyleSheet.absoluteFill} />
        </View>

        {accent ? <BorderBeam radius={radii.pill} color={colors.accentText} /> : null}

        {loading ? (
          <ActivityIndicator color={tone} size="small" />
        ) : (
          <>
            {icon ? <AnimatedIcon name={icon} size={18} color={tone} pulseKey={pulse} /> : null}
            <Text style={[styles.label, { color: tone, ...typography.font.bold }]}>{label}</Text>
          </>
        )}
      </LiquidGlassView>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    overflow: 'hidden',
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
