import React, { useEffect } from 'react';
import { Platform, StyleSheet, View, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface AnimatedIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focusedName: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color?: any;
}

const AnimatedTabIcon = ({ name, focusedName, focused }: AnimatedIconProps) => {
  const scale = useSharedValue(1);
  const pillOpacity = useSharedValue(0);
  const dotScale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { damping: 12, stiffness: 260 });
    pillOpacity.value = withTiming(focused ? 1 : 0, { duration: 180 });
    dotScale.value = withSpring(focused ? 1 : 0, { damping: 14, stiffness: 300 });
  }, [focused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ scale: withSpring(focused ? 1 : 0.85, { damping: 12 }) }],
  }));

  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  return (
    <View style={styles.iconContainer}>
      {/* Frosted glowing glass pill behind active icon */}
      <Animated.View style={[styles.activeGlassPill, animatedPillStyle]} />

      {/* Animated icon */}
      <Animated.View style={animatedIconStyle}>
        <Ionicons
          name={focused ? focusedName : name}
          size={22}
          color={focused ? '#8E7CE8' : '#8A879A'}
        />
      </Animated.View>

      {/* Subtle indicator dot below icon */}
      <Animated.View style={[styles.activeDot, animatedDotStyle]} />
    </View>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.dockContainer,
        tabBarBackground: () => (
          <View style={styles.blurWrapper}>
            <View style={styles.glassBackgroundTint} />
            <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="home-outline"
              focusedName="home"
              focused={focused}
              color={color}
            />
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
            <AnimatedTabIcon
              name="chatbubble-ellipses-outline"
              focusedName="chatbubble-ellipses"
              focused={focused}
              color={color}
            />
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
            <AnimatedTabIcon
              name="camera-outline"
              focusedName="camera"
              focused={focused}
              color={color}
            />
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
            <AnimatedTabIcon
              name="calendar-outline"
              focusedName="calendar"
              focused={focused}
              color={color}
            />
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
            <AnimatedTabIcon
              name="person-outline"
              focusedName="person"
              focused={focused}
              color={color}
            />
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
    bottom: Platform.OS === 'ios' ? 28 : 18,
    left: 18,
    right: 18,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.85)',
    backgroundColor: 'transparent',
    shadowColor: '#7C67B8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 14,
    paddingHorizontal: 6,
  },
  blurWrapper: {
    ...StyleSheet.absoluteFill,
    borderRadius: 34,
    overflow: 'hidden',
  },
  glassBackgroundTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeGlassPill: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(142, 124, 232, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.32)',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8E7CE8',
  },
});
