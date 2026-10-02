import { Easing } from 'react-native-reanimated';

export const SPRING = {
  gentle: { damping: 18, stiffness: 180 }, // entradas de tela, cards
  snappy: { damping: 14, stiffness: 260 }, // toques em botões, toggles
  bouncy: { damping: 10, stiffness: 200 }, // celebrações, sucesso
};

export const DURATION = {
  fast: 150,  // feedback de toque
  base: 300,  // transições padrão
  slow: 500,  // transições de tela inteira
};

export const EASING = {
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  decelerate: Easing.out(Easing.cubic),
  accelerate: Easing.in(Easing.cubic),
};
