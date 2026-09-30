import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const tabOrder = ['/', '/messages', '/memories', '/dates', '/profile'];

  const handleSwipeLeft = () => {
    const currentIndex = tabOrder.indexOf(pathname);
    if (currentIndex >= 0 && currentIndex < tabOrder.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.navigate(tabOrder[currentIndex + 1] as any);
    }
  };

  const handleSwipeRight = () => {
    const currentIndex = tabOrder.indexOf(pathname);
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      <View style={{ flex: 1 }}>
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
      </View>
    </GestureDetector>
  );
}
