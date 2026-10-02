import React, { useState, useEffect } from 'react';
import { StyleSheet, AppState, AppStateStatus, AccessibilityInfo } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { usePathname } from 'expo-router';

export function Floating3DHeart() {
  const pathname = usePathname();
  const isFocused = pathname.includes('dates') || pathname === '/';
  const [reducedMotion, setReducedMotion] = useState(false);
  const [appActive, setAppActive] = useState(true);
  const translateY = useSharedValue(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      setAppActive(state === 'active');
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reducedMotion || !isFocused || !appActive) {
      cancelAnimation(translateY);
      translateY.value = 0;
      return;
    }

    translateY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(4, { duration: 2000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(translateY);
    };
  }, [isFocused, reducedMotion, appActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.heroHeartContainer, animatedStyle]}>
      <Image
        source={require('../../../../assets/images/heart-3d.webp')}
        style={styles.heroHeartImage}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  heroHeartContainer: {
    position: 'absolute',
    right: -10,
    top: -12,
    width: 140,
    height: 140,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeartImage: {
    width: 135,
    height: 135,
  },
});
