import { useState, useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => sub.remove();
  }, []);

  return reducedMotion;
}

export function useReducedTransparency() {
  const [reducedTransparency, setReducedTransparency] = useState(false);

  useEffect(() => {
    // Web/PWA: react-native-web não implementa isReduceTransparencyEnabled.
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.matchMedia) return;
      const query = window.matchMedia('(prefers-reduced-transparency: reduce)');
      setReducedTransparency(query.matches);
      const onChange = (e: MediaQueryListEvent) => setReducedTransparency(e.matches);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }

    AccessibilityInfo.isReduceTransparencyEnabled().then(setReducedTransparency);
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReducedTransparency);
    return () => sub.remove();
  }, []);

  return reducedTransparency;
}
