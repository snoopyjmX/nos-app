import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from '@/design/ui/PressableScale';

interface MemoryFABProps {
  onPress: () => void;
  tabBarHeight: number;
}

export function MemoryFAB({ onPress, tabBarHeight }: MemoryFABProps) {
  return (
    <View
      style={[
        styles.floatingButtonWrapper,
        {
          bottom: tabBarHeight + 16,
        },
      ]}
    >
      <PressableScale
        onPress={onPress}
        activeOpacity={0.88}
        accessibilityLabel="Adicionar nova memória"
      >
        <LinearGradient
          colors={['#7C6FE0', '#F58FA8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.floatingButtonGradient}
        >
          <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
          <Text style={styles.floatingButtonText}>Adicionar Memória</Text>
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  floatingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderWidth: 1,
    overflow: 'hidden',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  floatingButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
