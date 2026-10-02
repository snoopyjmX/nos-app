export const colors = {
  light: {
    primary: '#7C6FE0',
    primarySoft: '#EFECFC',
    accent: '#F58FA8',
    accentSoft: '#FDEEF2',
    background: '#F8F6FE',
    surface: '#FFFFFF',
    textPrimary: '#1E1A33',
    textSecondary: '#5B5675',
    success: '#34C759',
    danger: '#FF3B30',
    border: '#EFECFC',
  },
  dark: {
    primary: '#9D92F0',
    primarySoft: '#2A2545',
    accent: '#F7A6BB',
    accentSoft: '#3A2634',
    background: '#15122A',
    surface: '#1F1B3A',
    textPrimary: '#F3F1FB',
    textSecondary: '#B7B2D0',
    success: '#30D158',
    danger: '#FF453A',
    border: '#2A2545',
  },
} as const;

export type ColorTheme = typeof colors.light;
export type ColorToken = keyof ColorTheme;
