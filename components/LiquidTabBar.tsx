import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  Keyboard,
  useWindowDimensions,
  AccessibilityInfo,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
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
import { getThemeTokens } from '../constants/theme';
import { useAppTheme } from '../context/ThemeContext';

const TAB_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; focusedIcon: keyof typeof Ionicons.glyphMap }
> = {
  index: { label: 'Início', icon: 'home-outline', focusedIcon: 'home' },
  messages: { label: 'Mensagens', icon: 'chatbubble-ellipses-outline', focusedIcon: 'chatbubble-ellipses' },
  memories: { label: 'Memórias', icon: 'camera-outline', focusedIcon: 'camera' },
  dates: { label: 'Datas', icon: 'calendar-outline', focusedIcon: 'calendar' },
  profile: { label: 'Perfil', icon: 'person-outline', focusedIcon: 'person' },
};

const INDICATOR_SPRING = { damping: 15, stiffness: 150, overshootClamping: true };
const ICON_SPRING = { damping: 16, stiffness: 200, overshootClamping: true };

const DOCK_MARGIN = 16;
const DOCK_HEIGHT = 64;
const DOCK_RADIUS = 32;
const INDICATOR_PADDING = 5;

import { Image } from 'expo-image';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface TabIconProps {
  routeName: string;
  index: number;
  activeIndex: SharedValue<number>;
  isDark: boolean;
  reducedMotion: boolean;
  avatarUrl?: string | null;
}

function TabIcon({ routeName, index, activeIndex, isDark, reducedMotion, avatarUrl }: TabIconProps) {
  const config = TAB_CONFIG[routeName] || {
    label: routeName,
    icon: 'ellipse-outline' as const,
    focusedIcon: 'ellipse' as const,
  };

  const themeTokens = getThemeTokens(isDark);

  const proximity = useDerivedValue(() => {
    return Math.abs(activeIndex.value - index);
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      const opacity = proximity.value < 0.5 ? 1 : 0.65;
      return { opacity };
    }
    const scale = interpolate(proximity.value, [0, 1], [1.15, 1], Extrapolation.CLAMP);
    const translateY = interpolate(proximity.value, [0, 1], [-2, 0], Extrapolation.CLAMP);
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(proximity.value, [0, 0.6], [1, 0.7], Extrapolation.CLAMP);
    return { opacity };
  });

  const activeColor = themeTokens.primary;
  const inactiveColor = themeTokens.textSecondary;

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
              { borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' },
            ]}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <>
            <Animated.View style={unfocusedIconOpacity}>
              <Ionicons name={config.icon} size={21} color={inactiveColor} />
            </Animated.View>
            <Animated.View style={focusedIconOpacity}>
              <Ionicons name={config.focusedIcon} size={21} color={activeColor} />
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

interface LiquidTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function LiquidTabBar({ state, descriptors, navigation }: LiquidTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
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
  const dockWidth = screenWidth - DOCK_MARGIN * 2;
  const tabItemWidth = dockWidth / tabCount;

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => sub.remove();
  }, []);

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
      indicatorX.value = withSpring(state.index * tabItemWidth, INDICATOR_SPRING);
      activeIndex.value = withSpring(state.index, ICON_SPRING);
    }
  }, [state.index, tabItemWidth]);

  const navigateToTab = useCallback(
    (index: number) => {
      const route = state.routes[index];
      if (!route) return;

      requestAnimationFrame(() => {
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (!event.defaultPrevented) {
          navigation.navigate(route.name);
        }
      });
    },
    [state.routes, navigation]
  );

  const fireHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch {}
    }
  }, []);

  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      'worklet';
      const tappedIndex = Math.floor(e.x / tabItemWidth);
      const clampedIndex = Math.max(0, Math.min(tappedIndex, tabCount - 1));

      indicatorX.value = withSpring(clampedIndex * tabItemWidth, INDICATOR_SPRING);
      activeIndex.value = withSpring(clampedIndex, ICON_SPRING);
      indicatorScaleX.value = withSpring(1, INDICATOR_SPRING);

      runOnJS(fireHaptic)();
      runOnJS(navigateToTab)(clampedIndex);
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

      indicatorX.value = withSpring(targetIndex * tabItemWidth, INDICATOR_SPRING);
      activeIndex.value = withSpring(targetIndex, ICON_SPRING);
      indicatorScaleX.value = withSpring(1, INDICATOR_SPRING);

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

  const bottomPosition = insets.bottom > 0 ? insets.bottom + 4 : 20;

  return (
    <>
      {/* Fade em gradiente suave sob a barra flutuante */}
      <LinearGradient
        colors={[
          'transparent',
          isDark ? 'rgba(21, 18, 42, 0.60)' : 'rgba(248, 246, 254, 0.65)',
          isDark ? 'rgba(21, 18, 42, 0.94)' : 'rgba(248, 246, 254, 0.96)',
        ]}
        style={[
          styles.dockFadeGradient,
          {
            height: DOCK_HEIGHT + bottomPosition + 16,
          },
        ]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          styles.dockContainer,
          {
            bottom: bottomPosition,
            left: DOCK_MARGIN,
            right: DOCK_MARGIN,
            shadowColor: themeTokens.shadow,
            borderColor: themeTokens.glassBorder,
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.95)',
            zIndex: 100,
          },
          containerAnimatedStyle,
        ]}
      >
      {/* Camada 1: Blur View Ultra Thin Material */}
      <View style={styles.blurWrapper}>
        {Platform.OS === 'web' ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(21, 18, 42, 0.92)' : 'rgba(248, 246, 254, 0.94)' }]} />
        ) : (
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 85}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>

      {/* Camada 2: Frosted Glass Tint Fill */}
      <View
        style={[
          styles.tintLayer,
          {
            backgroundColor: isDark
              ? 'rgba(15, 13, 24, 0.45)'
              : 'rgba(248, 249, 252, 0.50)',
          },
        ]}
      />

      {/* Camada 3: Reflexo Especular Superior */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.02)', 'transparent']
            : ['rgba(255, 255, 255, 0.70)', 'rgba(255, 255, 255, 0.12)', 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.65 }}
        style={styles.specularHighlight}
        pointerEvents="none"
      />

      {/* Indicador Deslizante Liquid Glass */}
      <Animated.View style={[styles.slidingIndicator, indicatorStyle]}>
        <View
          style={[
            styles.indicatorInner,
            {
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.24)'
                : 'rgba(255, 255, 255, 0.85)',
              shadowColor: themeTokens.primary,
            },
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(167, 151, 255, 0.40)', 'rgba(139, 92, 246, 0.30)', 'rgba(139, 92, 246, 0.25)']
                : ['rgba(142, 124, 232, 0.35)', 'rgba(124, 58, 237, 0.25)', 'rgba(124, 58, 237, 0.20)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
          />
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255, 255, 255, 0.10)', 'transparent']
                : ['rgba(255, 255, 255, 0.40)', 'transparent']
            }
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
              isDark={isDark}
              reducedMotion={reducedMotion}
              avatarUrl={route.name === 'profile' ? profileAvatar : undefined}
            />
          ))}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
    </>
  );
}

export default LiquidTabBar;

const styles = StyleSheet.create({
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
    borderRadius: 999,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  blurWrapper: {
    ...StyleSheet.absoluteFill,
  },
  tintLayer: {
    ...StyleSheet.absoluteFill,
  },
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '65%',
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
