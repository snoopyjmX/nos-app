import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
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
import { WEB_DOCK_GAP } from '@/lib/hooks/useDockInset';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { AnimatedIcon } from '@/components/ui/AnimatedIcon';
import { useReducedMotion } from '@/lib/hooks/useAccessibility';
import { Image } from 'expo-image';
import { useAuth } from '@/lib/context/AuthContext';
import { supabase } from '@/lib/core/supabase';

const TAB_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Feather.glyphMap; focusedIcon: keyof typeof Feather.glyphMap }
> = {
  index: { label: 'Início', icon: 'home', focusedIcon: 'home' },
  messages: { label: 'Mensagens', icon: 'message-circle', focusedIcon: 'message-circle' },
  memories: { label: 'Memórias', icon: 'camera', focusedIcon: 'camera' },
  dates: { label: 'Datas', icon: 'calendar', focusedIcon: 'calendar' },
  profile: { label: 'Perfil', icon: 'user', focusedIcon: 'user' },
};

const DOCK_SPRING = motion.easing.springDock;
const REDUCED_SETTLE_MS = 120;

// Move o indicador e os ícones: spring elástico, ou fade curto com Reduce Motion.
function settle(value: number, reducedMotion: boolean) {
  'worklet';
  if (reducedMotion) {
    return withTiming(value, { duration: REDUCED_SETTLE_MS, easing: Easing.out(Easing.cubic) });
  }
  return withSpring(value, DOCK_SPRING);
}

const DOCK_MARGIN = 16;
const DOCK_HEIGHT = 64;
const INDICATOR_PADDING = 5;

interface TabIconProps {
  routeName: string;
  index: number;
  activeIndex: SharedValue<number>;
  isCurrent: boolean;
  reducedMotion: boolean;
  avatarUrl?: string | null;
}

function TabIcon({ routeName, index, activeIndex, isCurrent, reducedMotion, avatarUrl }: TabIconProps) {
  const config = TAB_CONFIG[routeName] || {
    label: routeName,
    icon: 'circle' as const,
    focusedIcon: 'circle' as const,
  };

  const theme = useTheme();

  const proximity = useDerivedValue(() => {
    return Math.abs(activeIndex.value - index);
  });

  // A escala e o balanço ficam no AnimatedIcon; com Reduce Motion só o destaque por opacidade.
  const animatedIconStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      return { opacity: proximity.value < 0.5 ? 1 : 0.65 };
    }
    return {};
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(proximity.value, [0, 0.6], [1, 0.7], Extrapolation.CLAMP);
    return { opacity };
  });

  const activeColor = theme.colors.primary;
  const inactiveColor = theme.colors.textSecondary;

  const isFocused = useDerivedValue(() => proximity.value < 0.5);

  const focusedIconOpacity = useAnimatedStyle(() => ({
    opacity: isFocused.value ? 1 : 0,
    position: 'absolute' as const,
  }));
  const unfocusedIconOpacity = useAnimatedStyle(() => ({
    opacity: isFocused.value ? 0 : 1,
  }));

  const animatedColorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      proximity.value,
      [0, 1],
      [activeColor, inactiveColor]
    );
    return { color };
  });

  const isProfile = routeName === 'profile';

  return (
    <View style={styles.tabButton} pointerEvents="none">
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        {isProfile && avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={[
              styles.avatarIcon,
              { borderColor: theme.colors.avatarBorder },
            ]}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <>
            <Animated.View style={unfocusedIconOpacity}>
              <AnimatedIcon name={config.icon} size={21} color={inactiveColor} active={isCurrent} />
            </Animated.View>
            <Animated.View style={focusedIconOpacity}>
              <AnimatedIcon name={config.focusedIcon} size={21} color={activeColor} active={isCurrent} />
            </Animated.View>
          </>
        )}
      </Animated.View>
      <Animated.Text
        style={[
          styles.tabLabel,
          animatedTextStyle,
          animatedColorStyle,
        ]}
        numberOfLines={1}
      >
        {config.label}
      </Animated.Text>
    </View>
  );
}

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function TabBar({ state, descriptors, navigation }: TabBarProps) {
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
  const isDragging = useSharedValue(false);
  const indicatorScaleX = useSharedValue(1);
  const opacityVal = useSharedValue(1);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const lastHapticIndex = useRef(state.index);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      opacityVal.value = withTiming(0, { duration: 150 });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      opacityVal.value = withTiming(1, { duration: 220 });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!isDragging.value) {
      indicatorX.value = settle(state.index * tabItemWidth, reducedMotion);
      activeIndex.value = settle(state.index, reducedMotion);
    }
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

  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      'worklet';
      const tappedIndex = Math.floor(e.x / tabItemWidth);
      const clampedIndex = Math.max(0, Math.min(tappedIndex, tabCount - 1));

      indicatorX.value = settle(clampedIndex * tabItemWidth, reducedMotion);
      activeIndex.value = settle(clampedIndex, reducedMotion);
      indicatorScaleX.value = settle(1, reducedMotion);

      runOnJS(navigateToTab)(clampedIndex, true);
    });

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(120)
    .onStart(() => {
      'worklet';
      isDragging.value = true;
    })
    .onUpdate((e) => {
      'worklet';
      const clampedX = Math.max(0, Math.min(e.x, dockWidth - tabItemWidth));
      indicatorX.value = clampedX;

      const rawIndex = e.x / tabItemWidth;
      activeIndex.value = rawIndex;

      if (!reducedMotion) {
        const velocityFactor = Math.abs(e.velocityX) / 3000;
        const stretchAmount = 1 + Math.min(velocityFactor, 0.15);
        indicatorScaleX.value = stretchAmount;
      }

      const nearestIndex = Math.round(clampedX / tabItemWidth);
      if (nearestIndex !== lastHapticIndex.current) {
        lastHapticIndex.current = nearestIndex;
        runOnJS(fireHaptic)();
      }
    })
    .onEnd((e) => {
      'worklet';
      isDragging.value = false;

      const targetIndex = Math.max(
        0,
        Math.min(Math.round(e.x / tabItemWidth), tabCount - 1)
      );

      indicatorX.value = settle(targetIndex * tabItemWidth, reducedMotion);
      activeIndex.value = settle(targetIndex, reducedMotion);
      indicatorScaleX.value = settle(1, reducedMotion);

      runOnJS(navigateToTab)(targetIndex);
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const indicatorStyle = useAnimatedStyle(() => {
    const maxTranslate = dockWidth - tabItemWidth;
    const clampedX = Math.max(0, Math.min(indicatorX.value, maxTranslate));
    return {
      transform: [
        { translateX: clampedX },
        { scaleX: indicatorScaleX.value },
      ],
      width: tabItemWidth,
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacityVal.value,
  }));

  if (keyboardVisible) return null;

  const isWeb = Platform.OS === 'web';
  const bottomPosition = isWeb ? `calc(env(safe-area-inset-bottom, 0px) + ${WEB_DOCK_GAP}px)` : (insets.bottom > 0 ? insets.bottom + 4 : 20);

  return (
    <>
      {/* Fade em gradiente suave sob a barra flutuante */}
      <LinearGradient
        colors={theme.colors.dockFade}
        style={[
          styles.dockFadeGradient,
          isWeb && styles.webFixed,
          {
            height: (isWeb ? `calc(env(safe-area-inset-bottom, 0px) + ${DOCK_HEIGHT + WEB_DOCK_GAP + 28}px)` : DOCK_HEIGHT + (bottomPosition as number) + 16) as any,
          },
        ]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          styles.dockContainer,
          isWeb
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
      {/* Indicador Deslizante Liquid Glass */}
      <Animated.View style={[styles.slidingIndicator, indicatorStyle]}>
        <View
          style={[
            styles.indicatorInner,
            {
              borderColor: theme.colors.dockIndicatorBorder,
              shadowColor: theme.colors.primary,
            },
          ]}
        >
          <LinearGradient
            colors={theme.colors.dockIndicator}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
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

      {/* Abas com detector de gestos */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.tabsRow}>
          {state.routes.map((route: any, index: number) => (
            <TabIcon
              key={route.key}
              routeName={route.name}
              index={index}
              activeIndex={activeIndex}
              isCurrent={state.index === index}
              reducedMotion={reducedMotion}
              avatarUrl={route.name === 'profile' ? profileAvatar : undefined}
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
    paddingHorizontal: INDICATOR_PADDING,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorInner: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
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
    gap: 3,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.1,
    fontWeight: '500',
  },
  avatarIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
  },
});
