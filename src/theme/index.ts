import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { colors, ColorTheme } from './colors';
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

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
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
