export const shadows = {
  light: {
    soft: {
      shadowColor: 'rgba(124,111,224,0.12)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 2,
    },
    medium: {
      shadowColor: 'rgba(124,111,224,0.18)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 5,
    },
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  },
  dark: {
    // No modo escuro as sombras costumam ser mais sutis ou mais escuras
    soft: {
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 2,
    },
    medium: {
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 5,
    },
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  },
} as const;
