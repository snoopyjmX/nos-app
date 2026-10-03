export const spacing = {
  0: 0,
  2: 2,
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20, // Padding padrão de tela
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  64: 64,
} as const;

export const radii = {
  none: 0,
  sm: 12,
  md: 20,
  lg: 28, // Cards principais usam lg
  pill: 999, // Botões e avatares redondos
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiiToken = keyof typeof radii;

// Largura máxima da coluna de conteúdo e da dock em telas largas (iPad, desktop, Safari largo).
export const MAX_CONTENT_WIDTH = 560;
