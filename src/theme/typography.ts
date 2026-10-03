import { Platform } from 'react-native';

// Plus Jakarta Sans na web/PWA (carregada em +html.tsx) e San Francisco (System) no nativo.
const FONT_STACK = Platform.select({
  web: '"Plus Jakarta Sans", -apple-system, sans-serif',
  default: 'System',
}) as string;

const fontFamily = {
  regular: FONT_STACK,
  medium: FONT_STACK,
  bold: FONT_STACK,
  black: FONT_STACK,
} as const;

// A família é a mesma nos quatro pesos, então o peso viaja junto: use `...typography.font.bold`.
const font = {
  regular: { fontFamily: fontFamily.regular, fontWeight: '400' },
  medium: { fontFamily: fontFamily.medium, fontWeight: '600' },
  bold: { fontFamily: fontFamily.bold, fontWeight: '700' },
  black: { fontFamily: fontFamily.black, fontWeight: '800' },
  // Códigos (ex.: vínculo do casal): caracteres de largura fixa
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', web: 'ui-monospace, Menlo, monospace', default: 'monospace' }) as string,
    fontWeight: '700',
  },
} as const;

export const typography = {
  fontFamily,
  font,
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    display: 44,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export type TypographyTheme = typeof typography;
