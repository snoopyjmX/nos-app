import React from 'react';
import { Tabs } from 'expo-router';
import { LiquidTabBar } from '../../components/LiquidTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <LiquidTabBar {...props} />}
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
