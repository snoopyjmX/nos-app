import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useDockInset() {
  const insets = useSafeAreaInsets();
  // dock 64 + margem 20 + safe area inferior + respiro 24, mínimo 140
  const calculated = 64 + 20 + insets.bottom + 24;
  return Math.max(calculated, 150);
}
