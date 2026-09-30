// Design System Oficial — nós. (AGENTS.md Seção 3)

export const COLORS = {
  // Identidade roxo/lilás
  primary: '#7C6FE0',
  primaryDark: '#6D28D9',
  primarySoft: '#EFECFC',
  amethyst: '#7C3AED',

  // Acento quente (afeto, coração, celebrações)
  accent: '#F58FA8',
  accentSoft: '#FDEEF2',

  // Fundo e superfícies
  background: '#F8F6FE',
  surface: '#FFFFFF',
  surfaceSubtle: '#F4F1FD',

  // Vidro / Glass
  glassSurface: 'rgba(255,255,255,0.70)',
  glassBorder: 'rgba(255,255,255,0.65)',

  // Tipografia (Contraste AA)
  textPrimary: '#1E1A33',
  textSecondary: '#5B5675',
  textMuted: '#8A879A',

  // Brilhos e orbs
  glow: '#A797FF',
  white: '#FFFFFF',
  orbLavender: '#DDD6FE',
  orbPink: '#FCE7F3',

  // Estados
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Sombra
  shadow: 'rgba(124,111,224,0.12)',
};

export const DARK_COLORS = {
  // Identidade roxo/lilás (modo escuro)
  primary: '#9D92F0',
  primaryDark: '#8B5CF6',
  primarySoft: '#2A2545',
  amethyst: '#8B5CF6',

  // Acento quente (afeto, coração, celebrações)
  accent: '#F7A6BB',
  accentSoft: '#3A2634',

  // Fundo e superfícies (roxo-noite, sem preto puro)
  background: '#15122A',
  surface: '#1F1B3A',
  surfaceSubtle: '#262145',

  // Vidro / Glass
  glassSurface: 'rgba(31,27,58,0.65)',
  glassBorder: 'rgba(255,255,255,0.10)',

  // Tipografia (Contraste AA)
  textPrimary: '#F3F1FB',
  textSecondary: '#B7B2D0',
  textMuted: '#85809E',

  // Brilhos e orbs
  glow: '#9D92F0',
  white: '#FFFFFF',
  orbLavender: '#4C3A8C',
  orbPink: '#3A2A4D',

  // Estados
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Sombra
  shadow: 'rgba(0,0,0,0.40)',
};

export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screenPadding: 20,
};

export const RADII = {
  xs: 8,
  sm: 12,
  md: 20,
  lg: 28,
  pill: 999,
};

export const TYPOGRAPHY = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  display: 44,
};

export const SHADOWS = {
  soft: {
    shadowColor: '#7C6FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
  medium: {
    shadowColor: '#7C6FE0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 4,
  },
};

export const MOTION = {
  duration: {
    micro: 150,
    standard: 300,
    celebration: 900,
  },
};

export function getThemeTokens(isDark: boolean) {
  return isDark ? DARK_COLORS : COLORS;
}

export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  radii: RADII,
  typography: TYPOGRAPHY,
  shadows: {
    ...SHADOWS,
    // Manutenção de retrocompatibilidade
    glass: SHADOWS.medium,
    card: SHADOWS.soft,
    pill: {
      shadowColor: '#7C6FE0',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 2,
    },
  },
  motion: MOTION,
};
