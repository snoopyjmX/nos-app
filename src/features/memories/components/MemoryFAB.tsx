import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from '@/components/ui';
import { useDockTop } from '@/lib/hooks/useDockInset';
import { useTheme } from '@/theme';

const FAB_SIZE = 56;
const DOCK_GAP = 16;

interface MemoryFABProps {
  onPress: () => void;
}

export function MemoryFAB({ onPress }: MemoryFABProps) {
  const { colors, radii, shadows, spacing } = useTheme();
  const dockTop = useDockTop();

  return (
    // Camada externa: posição e sombra. A interna recorta o gradiente.
    <View
      style={[
        styles.wrapper,
        { bottom: dockTop + DOCK_GAP, right: spacing[20], borderRadius: radii.pill },
        shadows.medium,
      ]}
      pointerEvents="box-none"
    >
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Adicionar nova memória"
      >
        <LinearGradient
          colors={[colors.glow, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, { borderRadius: radii.pill }]}
        >
          <Feather name="camera" size={22} color={colors.onPrimary} />
        </LinearGradient>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 30,
  },
  button: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
