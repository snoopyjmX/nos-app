import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

export const motion = {
  duration: {
    micro: 150, // 120-180ms
    normal: 300, // 250-400ms
    celebration: 1000, // até 1200ms
  },
  easing: {
    // Valores para Easing.bezier do react-native-reanimated
    easeOut: [0.25, 1, 0.5, 1], // Aproximação de ease-out
    springShort: {
      damping: 15,
      stiffness: 200,
      mass: 0.5,
    },
    springBounce: {
      damping: 10,
      stiffness: 100,
      mass: 1,
    },
  },
} as const;
