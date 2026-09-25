import React, { useEffect } from 'react';
import { Platform, StyleSheet, View, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedIcon = ({ name, focused, color }: { name: any; focused: boolean; color: any }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { damping: 12, stiffness: 200 });
    opacity.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPillStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.focusPill, animatedPillStyle]} />
      <Animated.View style={animatedIconStyle}>
        <Ionicons name={name} size={22} color={focused ? '#fff' : color} />
      </Animated.View>
    </View>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8E7CE8',
        tabBarInactiveTintColor: '#686578',
        tabBarStyle: styles.dockContainer,
        tabBarShowLabel: false,
        tabBarBackground: () => (
          <View style={styles.blurContainer}>
            <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />
          ),
          tabBarButton: (props) => (
            <Pressable
              {...(props as any)}
              onPress={(e) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onPress?.(e);
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mensagens',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} focused={focused} color={color} />
          ),
          tabBarButton: (props) => (
            <Pressable
              {...(props as any)}
              onPress={(e) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onPress?.(e);
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: 'Memórias',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon name={focused ? 'camera' : 'camera-outline'} focused={focused} color={color} />
          ),
          tabBarButton: (props) => (
            <Pressable
              {...(props as any)}
              onPress={(e) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onPress?.(e);
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dates"
        options={{
          title: 'Datas',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} color={color} />
          ),
          tabBarButton: (props) => (
            <Pressable
              {...(props as any)}
              onPress={(e) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onPress?.(e);
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} />
          ),
          tabBarButton: (props) => (
            <Pressable
              {...(props as any)}
              onPress={(e) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onPress?.(e);
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 18,
    left: 20,
    right: 20,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    shadowColor: '#635380',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    borderTopWidth: 1, // override default React Navigation top border
    backgroundColor: 'transparent',
  },
  blurContainer: {
    ...StyleSheet.absoluteFill,
    borderRadius: 34,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusPill: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8E7CE8',
  },
});
