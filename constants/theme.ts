// Paleta oficial de tokens conforme AGENTS.md (Seção 5 e 6)
export const COLORS = {
  primary: '#8E7CE8',
  primaryDark: '#7C3AED',
  amethyst: '#7C3AED',

  background: '#F8F9FC',

  glassSurface: 'rgba(255,255,255,0.70)',
  glassBorder: 'rgba(255,255,255,0.65)',

  textPrimary: '#16151E',
  textSecondary: '#686578',
  textMuted: '#8A879A',

  glow: '#A797FF',
  white: '#FFFFFF',

  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  shadow: '#5B4294',

  orbLavender: '#DDD6FE',
  orbPink: '#FCE7F3',
};

export const DARK_COLORS = {
  background: '#0F0D18',

  primary: '#A797FF',
  primaryDark: '#8B5CF6',
  amethyst: '#8B5CF6',

  glassSurface: 'rgba(30,28,42,0.55)',
  glassBorder: 'rgba(255,255,255,0.12)',

  textPrimary: '#F7F5FF',
  textSecondary: '#AAA5B8',
  textMuted: '#7E7A8E',

  glow: '#A797FF',
  white: '#FFFFFF',

  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  shadow: '#1F1535',

  orbLavender: '#4C3A8C',
  orbPink: '#3A2A4D',
};

export function getThemeTokens(isDark: boolean) {
  return isDark ? DARK_COLORS : COLORS;
}

export const THEME = {
  colors: COLORS,
  shadows: {
    glass: {
      shadowColor: '#5B4294',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 5,
    },
    card: {
      shadowColor: '#5B4294',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 3,
    },
    pill: {
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 2,
    },
  },
};
