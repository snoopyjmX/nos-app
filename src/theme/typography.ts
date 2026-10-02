export const typography = {
  fontFamily: {
    regular: 'Nunito_400Regular',
    medium: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    black: 'Nunito_800ExtraBold',
    display: 'Fraunces_700Bold', // Ou Quicksand_700Bold dependendo do que estiver instalado
  },
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
