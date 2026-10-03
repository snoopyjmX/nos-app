import { useAppTheme } from '@/lib/context/ThemeContext';
import { colors } from './colors';
import { typography } from './typography';
import { spacing, radii } from './spacing';
import { shadows } from './shadows';
import { motion } from './motion';

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  motion,
} as const;

export function getThemeColors(isDark: boolean) {
  return isDark ? colors.dark : colors.light;
}

export function useTheme() {
  // Fonte única do tema: a preferência do usuário (ou do sistema) guardada no ThemeContext.
  const { isDark } = useAppTheme();

  return {
    colors: isDark ? colors.dark : colors.light,
    typography: theme.typography,
    spacing: theme.spacing,
    radii: theme.radii,
    shadows: isDark ? shadows.dark : shadows.light,
    motion: theme.motion,
    isDark,
  };
}

export type Theme = ReturnType<typeof useTheme>;
