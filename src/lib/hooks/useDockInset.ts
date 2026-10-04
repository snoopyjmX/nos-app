import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Altura da dock: fonte única para a TabBar e para as compensações abaixo.
export const DOCK_HEIGHT = 76;

// Na web a dock fica fixa na viewport, logo acima da área do indicador de início do iPhone.
export const WEB_DOCK_GAP = 8;

export function useDockInset() {
  const insets = useSafeAreaInsets();
  // dock + margem 20 + safe area inferior + respiro 24, mínimo 150
  const calculated = DOCK_HEIGHT + 20 + insets.bottom + 24;
  return Math.max(calculated, 150);
}

// Distância da base da tela até o topo da dock (mesma posição usada pelo TabBar).
export function useDockTop() {
  const insets = useSafeAreaInsets();
  const bottom =
    Platform.OS === 'web' ? insets.bottom + WEB_DOCK_GAP : insets.bottom > 0 ? insets.bottom + 4 : 20;
  return bottom + DOCK_HEIGHT;
}
