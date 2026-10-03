import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useDockInset() {
  const insets = useSafeAreaInsets();
  // dock 64 + margem 20 + safe area inferior + respiro 24, mínimo 140
  const calculated = 64 + 20 + insets.bottom + 24;
  return Math.max(calculated, 150);
}

// Distância da base da tela até o topo da dock (mesma posição usada pelo TabBar).
export function useDockTop() {
  const insets = useSafeAreaInsets();
  const bottom =
    Platform.OS === 'web' ? insets.bottom + 20 : insets.bottom > 0 ? insets.bottom + 4 : 20;
  return bottom + 64;
}
