import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../constants/theme';

interface LiquidThemeSelectorProps {
  currentMode: 'light' | 'dark';
  onChangeMode: (mode: 'light' | 'dark') => void;
}

export function LiquidThemeSelector({ currentMode, onChangeMode }: LiquidThemeSelectorProps) {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const { width } = useWindowDimensions();

  // Container width inside theme card
  const containerPadding = 4;
  const isLight = currentMode === 'light';

  const translateX = useSharedValue(isLight ? 0 : 1);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);

  useEffect(() => {
    // Viscous fluid stretch when sliding
    scaleX.value = withSequence(
      withTiming(1.22, { duration: 90, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 13, stiffness: 200 })
    );
    scaleY.value = withSequence(
      withTiming(0.88, { duration: 90, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 13, stiffness: 200 })
    );
    translateX.value = withSpring(currentMode === 'light' ? 0 : 1, {
      damping: 14,
      stiffness: 180,
    });
  }, [currentMode]);

  const animatedBlobStyle = useAnimatedStyle(() => {
    // 0 = left (Claro), 1 = right (Escuro)
    // Usamos porcentagem para responsividade
    return {
      left: `${translateX.value * 50}%`,
      transform: [
        { scaleX: scaleX.value },
        { scaleY: scaleY.value },
      ],
    };
  });

  const handleSelect = (mode: 'light' | 'dark') => {
    if (mode !== currentMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChangeMode(mode);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(142, 124, 232, 0.08)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(142, 124, 232, 0.18)',
        },
      ]}
    >
      {/* Pílula Deslizante Líquida */}
      <Animated.View
        style={[
          styles.liquidBlob,
          {
            backgroundColor: themeTokens.primary,
            shadowColor: themeTokens.primary,
          },
          animatedBlobStyle,
        ]}
      />

      {/* Botão Claro */}
      <TouchableOpacity
        style={styles.tabButton}
        activeOpacity={0.85}
        onPress={() => handleSelect('light')}
      >
        <Ionicons
          name="sunny"
          size={16}
          color={isLight ? '#FFFFFF' : themeTokens.textSecondary}
        />
        <Text
          style={[
            styles.tabText,
            { color: isLight ? '#FFFFFF' : themeTokens.textSecondary, fontWeight: isLight ? '700' : '500' },
          ]}
        >
          Claro
        </Text>
      </TouchableOpacity>

      {/* Botão Escuro */}
      <TouchableOpacity
        style={styles.tabButton}
        activeOpacity={0.85}
        onPress={() => handleSelect('dark')}
      >
        <Ionicons
          name="moon"
          size={15}
          color={!isLight ? '#FFFFFF' : themeTokens.textSecondary}
        />
        <Text
          style={[
            styles.tabText,
            { color: !isLight ? '#FFFFFF' : themeTokens.textSecondary, fontWeight: !isLight ? '700' : '500' },
          ]}
        >
          Escuro
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  liquidBlob: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '50%',
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 2,
  },
  tabText: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
});
