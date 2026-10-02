import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from '@/components/ui';
import { useTheme } from '@/theme';

interface MemoryFABProps {
  onPress: () => void;
  tabBarHeight: number;
}

export function MemoryFAB({ onPress, tabBarHeight }: MemoryFABProps) {
  const { colors, typography, radii, shadows } = useTheme();

  return (
    <View
      style={[
        styles.floatingButtonWrapper,
        {
          bottom: tabBarHeight + 16,
          ...shadows.medium,
        },
      ]}
    >
      <PressableScale
        onPress={onPress}
        accessibilityLabel="Adicionar nova memória"
      >
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.floatingButtonGradient, { borderRadius: radii.pill }]}
        >
          <Feather name="camera" size={18} color="#FFFFFF" />
          <Text style={[styles.floatingButtonText, { fontFamily: typography.fontFamily.bold }]}>Adicionar Memória</Text>
        </LinearGradient>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingButtonWrapper: {
    position: 'absolute',
    right: 20,
    zIndex: 30,
    borderRadius: 999,
  },
  floatingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderWidth: 1,
    overflow: 'hidden',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  floatingButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
