import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

const DOCK_HEIGHT = 64;

export interface TabBarHeightInfo {
  dockHeight: number;
  bottomPosition: number;
  tabBarHeight: number;
  paddingBottom: number;
}

/**
 * Hook para obter a altura real do LiquidTabBar flutuante + safe area do dispositivo.
 * Garante que o conteúdo rolável nunca fique coberto pela tab bar.
 */
export function useTabBarHeight(): TabBarHeightInfo {
  const insets = useSafeAreaInsets();

  // Cálculo idêntico ao LiquidTabBar
  const bottomPosition = insets.bottom > 0 ? insets.bottom + 4 : 20;
  const tabBarHeight = DOCK_HEIGHT + bottomPosition;

  // Padding inferior recomendado para listas e scrolls (altura da barra + 20px de respiro)
  const paddingBottom = tabBarHeight + (Platform.OS === 'ios' ? 20 : 16);

  return {
    dockHeight: DOCK_HEIGHT,
    bottomPosition,
    tabBarHeight,
    paddingBottom,
  };
}

export default useTabBarHeight;
