import { Platform, StyleSheet } from 'react-native';

// Mapeia a intensidade do BlurView (0-100) para px de blur (design.md: até 24).
const MAX_BLUR_PX = 24;

export function supportsBackdropFilter(): boolean {
  if (Platform.OS !== 'web' || typeof CSS === 'undefined' || !CSS.supports) return false;
  return (
    CSS.supports('backdrop-filter', 'blur(1px)') ||
    CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
  );
}

// Safari/iOS PWA ainda exige o prefixo -webkit-; os dois são declarados via StyleSheet.
export function webBackdropStyle(intensity: number) {
  const filter = `blur(${Math.round((intensity / 100) * MAX_BLUR_PX)}px) saturate(160%)`;
  return StyleSheet.create({
    backdrop: {
      backdropFilter: filter,
      WebkitBackdropFilter: filter,
    } as object,
  }).backdrop;
}
