import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  Keyboard,
  useWindowDimensions,
  useColorScheme,
} from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SPRING } from '../../constants/motion';
import { getThemeTokens } from '../../constants/theme';

const TAB_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; focusedIcon: keyof typeof Ionicons.glyphMap }
> = {
  index: {
    label: 'Início',
    icon: 'home-outline',
    focusedIcon: 'home',
  },
  messages: {
    label: 'Mensagens',
    icon: 'chatbubble-ellipses-outline',
    focusedIcon: 'chatbubble-ellipses',
  },
  memories: {
    label: 'Memórias',
    icon: 'camera-outline',
    focusedIcon: 'camera',
  },
  dates: {
    label: 'Datas',
    icon: 'calendar-outline',
    focusedIcon: 'calendar',
  },
  profile: {
    label: 'Perfil',
    icon: 'person-outline',
    focusedIcon: 'person',
  },
};

function TabButton({
  route,
  index,
  isFocused,
  onPress,
  isDark,
}: {
  route: any;
  index: number;
  isFocused: boolean;
  onPress: () => void;
  isDark: boolean;
}) {
  const config = TAB_CONFIG[route.name] || {
    label: route.name,
    icon: 'ellipse-outline' as const,
    focusedIcon: 'ellipse' as const,
  };

  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.08 : 1, SPRING.snappy);
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const themeTokens = getThemeTokens(isDark);
  const activeColor = themeTokens.primary;
  const inactiveColor = themeTokens.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.94, SPRING.snappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(isFocused ? 1.08 : 1, SPRING.snappy);
      }}
      style={styles.tabButton}
      android_ripple={{ borderless: true, color: 'transparent' }}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={config.label}
    >
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <Ionicons
          name={isFocused ? config.focusedIcon : config.icon}
          size={21}
          color={isFocused ? activeColor : inactiveColor}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? activeColor : inactiveColor,
            fontWeight: isFocused ? '600' : '500',
          },
        ]}
        numberOfLines={1}
      >
        {config.label}
      </Text>
    </Pressable>
  );
}

import { useAppTheme } from '../../context/ThemeContext';
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);

  const DOCK_MARGIN = 16;
  const DOCK_WIDTH = width - DOCK_MARGIN * 2;
  const tabItemWidth = DOCK_WIDTH / state.routes.length;

  const translateX = useSharedValue(state.index * tabItemWidth);
  const opacityVal = useSharedValue(1);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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
    translateX.value = withSpring(state.index * tabItemWidth, SPRING.gentle);
  }, [state.index, tabItemWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: tabItemWidth,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacityVal.value,
  }));

  if (keyboardVisible) {
    return null;
  }

  const bottomPosition = insets.bottom > 0 ? insets.bottom + 4 : 20;

  return (
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
        },
        containerAnimatedStyle,
      ]}
    >
      {/* Layer 1: Blur View Ultra Thin Material */}
      <View style={styles.blurWrapper}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 88 : 100}
          tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Layer 2: Frosted Glass Tint Fill */}
      <View
        style={[
          styles.tintLayer,
          {
            backgroundColor: themeTokens.glassSurface,
          },
        ]}
      />

      {/* Layer 3: Specular Highlight Gradient (Apple-Grade Reflection) */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.02)', 'transparent']
            : ['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0.15)', 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.65 }}
        style={styles.specularHighlight}
        pointerEvents="none"
      />

      {/* Indicador Deslizante Liquid Glass (Morphing Active-Tab Indicator) */}
      <Animated.View style={[styles.slidingIndicator, indicatorStyle]}>
        <View
          style={[
            styles.indicatorInner,
            {
              backgroundColor: isDark
                ? 'rgba(167, 151, 255, 0.20)'
                : 'rgba(142, 124, 232, 0.15)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.28)'
                : 'rgba(255, 255, 255, 0.85)',
              shadowColor: themeTokens.primary,
            },
          ]}
        >
          {/* Specular Inner Glint on the Active Capsule */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255, 255, 255, 0.18)', 'transparent']
                : ['rgba(255, 255, 255, 0.60)', 'transparent']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.7 }}
            style={styles.indicatorGlint}
            pointerEvents="none"
          />
        </View>
      </Animated.View>

      {/* Abas */}
      <View style={styles.tabsRow}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={route.key}
              route={route}
              index={index}
              isFocused={isFocused}
              onPress={onPress}
              isDark={isDark}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="messages" options={{ title: 'Mensagens' }} />
      <Tabs.Screen name="memories" options={{ title: 'Memórias' }} />
      <Tabs.Screen name="dates" options={{ title: 'Datas' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
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
    top: 5,
    bottom: 5,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorInner: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  indicatorGlint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    borderRadius: 24,
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
    gap: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: -0.2,
  },
});
