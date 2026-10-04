import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Platform,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolateColor,
  runOnJS,
  useDerivedValue,
  SharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { MAX_CONTENT_WIDTH } from '@/theme/spacing';
import { motion } from '@/theme/motion';
import { DOCK_HEIGHT, WEB_DOCK_GAP } from '@/lib/hooks/useDockInset';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useReducedMotion } from '@/lib/hooks/useAccessibility';
import { Image } from 'expo-image';
import { useAuth } from '@/lib/context/AuthContext';
import { supabase } from '@/lib/core/supabase';
import { clamp, lensIndexAt, lensXAt, stretchAt, tabIndexAt } from './dockGeometry';

const TAB_CONFIG: Record<string, { label: string; icon: keyof typeof Feather.glyphMap }> = {
  index: { label: 'Início', icon: 'home' },
  messages: { label: 'Mensagens', icon: 'message-circle' },
  memories: { label: 'Memórias', icon: 'camera' },
  dates: { label: 'Datas', icon: 'calendar' },
  profile: { label: 'Perfil', icon: 'user' },
};

const DOCK_SPRING = motion.easing.springDock;
// Seguir o dedo e agarrar/soltar o indicador usam as molas de toque, mais curtas que a da dock.
const FOLLOW_SPRING = motion.easing.springShort;
const PRESS_IN_SPRING = motion.easing.springPressIn;
const PRESS_OUT_SPRING = motion.easing.springPressOut;
const REDUCED_SETTLE_MS = 120;
const REDUCED_PRESS_OPACITY = 0.7;
const FADE_EASING = Easing.out(Easing.cubic);

// Ícone e rótulo trocam de estado na mesma faixa de distância do indicador (0 = sob ele).
const STATE_RANGE = 0.6;
const ICON_ACTIVE_SCALE = 1.08;
const TAB_PRESS_SCALE = 0.96;
const LENS_GRAB_SCALE = 1.05;
const LENS_STRETCH_MAX = 0.15;
// Compressão vertical em fração do alongamento: o indicador "líquido" conserva volume.
const LENS_SQUASH = 0.4;
const LENS_SHADOW_REST = { opacity: 0.1, radius: 6, offsetY: 2 };
const LENS_SHADOW_GRAB = { opacity: 0.22, radius: 12, offsetY: 5 };

// Move o indicador e os ícones: spring elástico, ou fade curto com Reduce Motion.
function settle(value: number, reducedMotion: boolean) {
  'worklet';
  if (reducedMotion) {
    return withTiming(value, { duration: REDUCED_SETTLE_MS, easing: FADE_EASING });
  }
  return withSpring(value, DOCK_SPRING);
}

const DOCK_MARGIN = 16;
const INDICATOR_PADDING = 8;
// Sem folga lateral: o indicador ocupa a aba inteira para cobrir o rótulo mais largo ("Mensagens").
const INDICATOR_INSET_X = 0;
const IS_WEB = Platform.OS === 'web';
// Rótulos longos ("Mensagens", "Memórias") usam 11px para caber dentro da curva do indicador.
const LONG_LABEL_LENGTH = 7;

interface TabIconProps {
  routeName: string;
  index: number;
  activeIndex: SharedValue<number>;
  pressedIndex: SharedValue<number>;
  isCurrent: boolean;
  reducedMotion: boolean;
  avatarUrl?: string | null;
  onSelect: (index: number) => void;
}

function TabIcon({
  routeName,
  index,
  activeIndex,
  pressedIndex,
  isCurrent,
  reducedMotion,
  avatarUrl,
  onSelect,
}: TabIconProps) {
  const config = TAB_CONFIG[routeName] || { label: routeName, icon: 'circle' as const };
  const theme = useTheme();
  // Ícone ativo em destaque de marca; rótulo ativo em textPrimary, o único que passa AA (≥4,5:1) sobre a lente.
  const activeColor = theme.colors.primaryText;
  const activeLabelColor = theme.colors.textPrimary;
  const inactiveColor = theme.colors.textSecondary;

  // Distância (em abas) entre o indicador e esta aba: 0 = indicador exatamente sob ela.
  const proximity = useDerivedValue(() => Math.abs(activeIndex.value - index));

  // Resposta imediata ao toque, antes de o dedo subir: mola de toque (ou só opacidade com Reduce Motion).
  const press = useDerivedValue(() => {
    const target = pressedIndex.value === index ? 1 : 0;
    if (reducedMotion) {
      return withTiming(target, { duration: REDUCED_SETTLE_MS, easing: FADE_EASING });
    }
    return withSpring(target, target ? PRESS_IN_SPRING : PRESS_OUT_SPRING);
  });

  const contentStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      return { opacity: 1 - (1 - REDUCED_PRESS_OPACITY) * press.value };
    }
    return { transform: [{ scale: 1 - (1 - TAB_PRESS_SCALE) * press.value }] };
  });

  // O ícone cresce conforme o indicador se aproxima, no ritmo do arrasto (sem esperar a navegação).
  const iconStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      return { opacity: proximity.value < 0.5 ? 1 : 0.65 };
    }
    return {
      transform: [
        { scale: interpolate(proximity.value, [0, 1], [ICON_ACTIVE_SCALE, 1], Extrapolation.CLAMP) },
      ],
    };
  });

  const activeLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(proximity.value, [0, STATE_RANGE], [1, 0], Extrapolation.CLAMP),
    position: 'absolute' as const,
  }));
  const inactiveLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(proximity.value, [0, STATE_RANGE], [0, 1], Extrapolation.CLAMP),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(proximity.value, [0, STATE_RANGE], [activeLabelColor, inactiveColor]),
  }));

  const avatarRingStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      proximity.value,
      [0, STATE_RANGE],
      [activeColor, theme.colors.avatarBorder]
    ),
  }));

  const isProfile = routeName === 'profile';

  return (
    // O toque/arrasto é tratado pelo gesto da dock; este Pressable existe para teclado e leitor de tela.
    <Pressable
      style={styles.tabButton}
      pointerEvents="none"
      focusable
      accessibilityRole="tab"
      accessibilityLabel={config.label}
      aria-selected={isCurrent}
      onPress={() => onSelect(index)}
      onAccessibilityTap={() => onSelect(index)}
    >
      <Animated.View style={[styles.tabContent, contentStyle]}>
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          {isProfile && avatarUrl ? (
            <Animated.View style={[styles.avatarRing, avatarRingStyle]}>
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" cachePolicy="memory-disk" />
            </Animated.View>
          ) : (
            <>
              <Animated.View style={inactiveLayerStyle}>
                <Feather name={config.icon} size={21} color={inactiveColor} />
              </Animated.View>
              <Animated.View style={activeLayerStyle}>
                <Feather name={config.icon} size={21} color={activeColor} />
              </Animated.View>
            </>
          )}
        </Animated.View>
        <Animated.Text style={[styles.tabLabel, config.label.length > LONG_LABEL_LENGTH && styles.tabLabelCompact, labelStyle]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {config.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const theme = useTheme();
  const { user } = useAuth();
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setProfileAvatar(null);
      return;
    }
    const currentUserId = user.id;
    const currentMetaAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;

    let isMounted = true;
    async function loadAvatar(userId: string, metaAvatar?: string | null) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', userId)
          .maybeSingle();

        const raw = data?.avatar_url || metaAvatar;
        if (!raw) return;

        if ((raw.startsWith('http://') || raw.startsWith('https://')) && !raw.includes('/avatars/')) {
          if (isMounted) setProfileAvatar(raw);
          return;
        }

        let cleanPath = raw;
        if (cleanPath.includes('/avatars/')) {
          cleanPath = cleanPath.split('/avatars/')[1].split('?')[0];
        }
        cleanPath = cleanPath.replace(/^\/+/, '');

        const { data: signedData } = await supabase.storage.from('avatars').createSignedUrl(cleanPath, 60 * 60 * 24);
        if (isMounted && signedData?.signedUrl) {
          setProfileAvatar(signedData.signedUrl);
        } else {
          const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(cleanPath);
          if (isMounted && publicData?.publicUrl) {
            setProfileAvatar(publicData.publicUrl);
          }
        }
      } catch {
        // Ignora silenciosamente
      }
    }
    loadAvatar(currentUserId, currentMetaAvatar);
    return () => {
      isMounted = false;
    };
  }, [user]);

  const tabCount = state.routes.length;
  const dockWidth = Math.min(screenWidth, MAX_CONTENT_WIDTH) - DOCK_MARGIN * 2;
  const tabItemWidth = dockWidth / tabCount;

  const reducedMotion = useReducedMotion();

  const indicatorX = useSharedValue(state.index * tabItemWidth);
  const activeIndex = useSharedValue(state.index);
  const selectedIndex = useSharedValue(state.index);
  const hapticIndex = useSharedValue(state.index);
  const pressedIndex = useSharedValue(-1);
  const isDragging = useSharedValue(false);
  const indicatorScaleX = useSharedValue(1);
  const lift = useSharedValue(0);
  const opacityVal = useSharedValue(1);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      opacityVal.value = withTiming(0, { duration: motion.duration.micro, easing: FADE_EASING });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      opacityVal.value = withTiming(1, { duration: motion.duration.micro, easing: FADE_EASING });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    selectedIndex.value = state.index;
    hapticIndex.value = state.index;
    if (!isDragging.value) {
      indicatorX.value = settle(state.index * tabItemWidth, reducedMotion);
      activeIndex.value = settle(state.index, reducedMotion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, tabItemWidth, reducedMotion]);

  const fireHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch {}
    }
  }, []);

  const navigateToTab = useCallback(
    (index: number, haptic = false) => {
      const route = state.routes[index];
      if (!route) return;

      // Um toque leve a cada troca real de aba (o arrasto já vibra ao cruzar cada ícone).
      if (haptic && index !== state.index) fireHaptic();

      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    },
    [state.routes, state.index, navigation, fireHaptic]
  );

  // O indicador acompanha o dedo por molas curtas (sem saltar na ativação); com Reduce Motion, direto.
  const followFinger = (x: number) => {
    'worklet';
    const targetX = lensXAt(x, tabItemWidth, tabCount);
    const targetIndex = lensIndexAt(x, tabItemWidth, tabCount);
    if (reducedMotion) {
      indicatorX.value = targetX;
      activeIndex.value = targetIndex;
    } else {
      indicatorX.value = withSpring(targetX, FOLLOW_SPRING);
      activeIndex.value = withSpring(targetIndex, FOLLOW_SPRING);
    }

    const hovered = tabIndexAt(x, tabItemWidth, tabCount);
    if (hovered !== hapticIndex.value) {
      hapticIndex.value = hovered;
      runOnJS(fireHaptic)();
    }
  };

  const settleTo = (index: number) => {
    'worklet';
    indicatorX.value = settle(index * tabItemWidth, reducedMotion);
    activeIndex.value = settle(index, reducedMotion);
    indicatorScaleX.value = settle(1, reducedMotion);
  };

  const tapGesture = Gesture.Tap()
    .onBegin((e) => {
      'worklet';
      pressedIndex.value = tabIndexAt(e.x, tabItemWidth, tabCount);
    })
    .onEnd((e, success) => {
      'worklet';
      if (!success) return;
      const tappedIndex = tabIndexAt(e.x, tabItemWidth, tabCount);
      settleTo(tappedIndex);
      runOnJS(navigateToTab)(tappedIndex, true);
    })
    .onFinalize(() => {
      'worklet';
      pressedIndex.value = -1;
    });

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(120)
    .onStart((e) => {
      'worklet';
      isDragging.value = true;
      pressedIndex.value = -1;
      hapticIndex.value = selectedIndex.value;
      if (!reducedMotion) lift.value = withSpring(1, PRESS_IN_SPRING);
      followFinger(e.x);
    })
    .onUpdate((e) => {
      'worklet';
      followFinger(e.x);
      if (!reducedMotion) {
        indicatorScaleX.value = withSpring(stretchAt(e.velocityX, LENS_STRETCH_MAX), FOLLOW_SPRING);
      }
    })
    .onEnd((e, success) => {
      'worklet';
      if (!success) {
        settleTo(selectedIndex.value);
        return;
      }
      const targetIndex = tabIndexAt(e.x, tabItemWidth, tabCount);
      settleTo(targetIndex);
      runOnJS(navigateToTab)(targetIndex);
    })
    .onFinalize(() => {
      'worklet';
      isDragging.value = false;
      lift.value = reducedMotion ? 0 : withSpring(0, PRESS_OUT_SPRING);
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const indicatorStyle = useAnimatedStyle(() => {
    const x = clamp(indicatorX.value, 0, dockWidth - tabItemWidth);
    const stretch = indicatorScaleX.value;
    const grab = 1 + (LENS_GRAB_SCALE - 1) * lift.value;
    return {
      transform: [
        { translateX: x },
        { scaleX: stretch * grab },
        { scaleY: (1 - (stretch - 1) * LENS_SQUASH) * grab },
      ],
      width: tabItemWidth,
    };
  });

  // A sombra cresce quando o indicador é agarrado: ele "sobe" do vidro da dock.
  const lensShadowColor = theme.colors.primary;
  const lensShadowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(lift.value, [0, 1], [LENS_SHADOW_REST.opacity, LENS_SHADOW_GRAB.opacity]);
    const radius = interpolate(lift.value, [0, 1], [LENS_SHADOW_REST.radius, LENS_SHADOW_GRAB.radius]);
    const offsetY = interpolate(lift.value, [0, 1], [LENS_SHADOW_REST.offsetY, LENS_SHADOW_GRAB.offsetY]);
    // react-native-web não converte shadow* animado (a sombra ficava fixa e preta); lá usamos boxShadow.
    if (IS_WEB) {
      return {
        boxShadow: `0px ${offsetY}px ${radius}px color-mix(in srgb, ${lensShadowColor} ${opacity * 100}%, transparent)`,
      };
    }
    return {
      shadowColor: lensShadowColor,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: offsetY },
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacityVal.value,
  }));

  if (keyboardVisible) return null;

  const bottomPosition = IS_WEB ? `calc(env(safe-area-inset-bottom, 0px) + ${WEB_DOCK_GAP}px)` : (insets.bottom > 0 ? insets.bottom + 4 : 20);

  return (
    <>
      {/* Fade em gradiente suave sob a barra flutuante */}
      <LinearGradient
        colors={theme.colors.dockFade}
        style={[
          styles.dockFadeGradient,
          IS_WEB && styles.webFixed,
          {
            height: (IS_WEB ? `calc(env(safe-area-inset-bottom, 0px) + ${DOCK_HEIGHT + WEB_DOCK_GAP + 28}px)` : DOCK_HEIGHT + (bottomPosition as number) + 16) as any,
          },
        ]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          styles.dockContainer,
          IS_WEB
            ? [styles.webFixed, styles.webDock, { bottom: bottomPosition as any }]
            : { bottom: bottomPosition as any, left: DOCK_MARGIN, right: DOCK_MARGIN },
          containerAnimatedStyle,
        ]}
      >
        {/* Vidro canônico: sombra na camada externa, blur/borda/reflexo na interna */}
        <LiquidGlassView
          variant="hero"
          readable
          borderRadius={theme.radii.pill}
          style={styles.dockGlass}
        >
      {/* Indicador Liquid Glass: view externa = sombra e raio; interna = recorte, borda e reflexo */}
      <Animated.View style={[styles.slidingIndicator, indicatorStyle]} pointerEvents="none">
        <Animated.View style={[styles.indicatorShadow, lensShadowStyle]}>
          <View style={[styles.indicatorInner, { borderColor: theme.colors.dockIndicatorBorder }]}>
            <LinearGradient
              colors={theme.colors.dockIndicator}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={theme.colors.dockIndicatorGlint}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.7 }}
              style={styles.indicatorGlint}
              pointerEvents="none"
            />
          </View>
        </Animated.View>
      </Animated.View>

      {/* Abas com detector de gestos */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.tabsRow} accessibilityRole="tablist">
          {state.routes.map((route: any, index: number) => (
            <TabIcon
              key={route.key}
              routeName={route.name}
              index={index}
              activeIndex={activeIndex}
              pressedIndex={pressedIndex}
              isCurrent={state.index === index}
              reducedMotion={reducedMotion}
              avatarUrl={route.name === 'profile' ? profileAvatar : undefined}
              onSelect={navigateToTab}
            />
          ))}
        </Animated.View>
      </GestureDetector>
        </LiquidGlassView>
      </Animated.View>
    </>
  );
}

export default TabBar;

const styles = StyleSheet.create({
  // Web/PWA: ancora na viewport (não na coluna do app), para a dock nunca depender da altura do contêiner
  webFixed: {
    position: 'fixed' as 'absolute',
  },
  webDock: {
    left: 0,
    right: 0,
    marginHorizontal: 'auto',
    width: `min(calc(100% - ${DOCK_MARGIN * 2}px), ${MAX_CONTENT_WIDTH - DOCK_MARGIN * 2}px)` as unknown as number,
  },
  dockFadeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
  },
  dockContainer: {
    position: 'absolute',
    height: DOCK_HEIGHT,
    zIndex: 100,
  },
  dockGlass: {
    flex: 1,
    justifyContent: 'center',
  },
  slidingIndicator: {
    position: 'absolute',
    top: INDICATOR_PADDING,
    bottom: INDICATOR_PADDING,
    paddingHorizontal: INDICATOR_INSET_X,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorShadow: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  indicatorInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  indicatorGlint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderRadius: 999,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    zIndex: 10,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: 'center',
    gap: 3,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  tabLabel: {
    fontSize: 12,
    letterSpacing: -0.1,
    fontWeight: '500',
  },
  tabLabelCompact: {
    fontSize: 11,
  },
  avatarRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});
