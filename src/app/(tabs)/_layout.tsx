import React from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { TabBar } from '@/components/layout/TabBar';
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { View, Platform } from 'react-native';
import { useTheme } from '@/theme';
import { MAX_CONTENT_WIDTH } from '@/theme/spacing';
import * as Haptics from 'expo-haptics';

export default function TabsLayout() {
  const router = useRouter();
  const { colors } = useTheme();
  const pathname = usePathname();

  const tabOrder = ['/', '/messages', '/memories', '/dates', '/profile'];

  // Normaliza o pathname para coincidir com tabOrder ('/index', '/(tabs)', etc.)
  const normalizedPath = React.useMemo(() => {
    if (!pathname || pathname === '/' || pathname === '/index' || pathname === '/(tabs)' || pathname === '/(tabs)/index') {
      return '/';
    }
    const clean = pathname.replace('/(tabs)', '');
    return clean.startsWith('/') ? clean : `/${clean}`;
  }, [pathname]);

  const handleSwipeLeft = () => {
    const currentIndex = tabOrder.indexOf(normalizedPath);
    if (currentIndex >= 0 && currentIndex < tabOrder.length - 1) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      }
      router.navigate(tabOrder[currentIndex + 1] as any);
    }
  };

  const handleSwipeRight = () => {
    const currentIndex = tabOrder.indexOf(normalizedPath);
    if (currentIndex > 0) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      }
      router.navigate(tabOrder[currentIndex - 1] as any);
    }
  };

  const flingLeft = Gesture.Fling().direction(Directions.LEFT).onEnd(() => {
    runOnJS(handleSwipeLeft)();
  });

  const flingRight = Gesture.Fling().direction(Directions.RIGHT).onEnd(() => {
    runOnJS(handleSwipeRight)();
  });

  const swipeGesture = Gesture.Exclusive(flingLeft, flingRight);

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.background }}>
        <View style={{ flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH }}>
        <Tabs
          tabBar={(props) => <TabBar {...props} />}
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
        </View>
      </View>
    </GestureDetector>
  );
}
