import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/lib/context/ThemeContext';
import { getThemeTokens } from '@/design/tokens/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface LiquidThemeSelectorProps {
  currentMode: 'light' | 'dark';
  onChangeMode: (mode: 'light' | 'dark') => void;
}

const SPRING_CONFIG = { damping: 18, stiffness: 220, mass: 0.8 };

export function LiquidThemeSelector({ currentMode, onChangeMode }: LiquidThemeSelectorProps) {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const reducedMotion = useReducedMotion();
  const [containerWidth, setContainerWidth] = useState(0);

  const isLight = currentMode === 'light';
  const progress = useSharedValue(isLight ? 0 : 1);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = currentMode === 'light' ? 0 : 1;
    } else {
      progress.value = withSpring(currentMode === 'light' ? 0 : 1, SPRING_CONFIG);
    }
  }, [currentMode, reducedMotion, progress]);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  // Largura de cada metade (descontando 4px de padding em cada lado = 8px)
  const pillWidth = containerWidth > 0 ? (containerWidth - 8) / 2 : 0;

  const animatedBlobStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: progress.value * pillWidth },
      ],
    };
  });

  const handleSelect = (mode: 'light' | 'dark') => {
    if (mode !== currentMode) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      }
      onChangeMode(mode);
    }
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(124, 111, 224, 0.08)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(124, 111, 224, 0.18)',
        },
      ]}
    >
      {/* Pílula Deslizante com cantos arredondados perfeitos */}
      {pillWidth > 0 && (
        <Animated.View
          style={[
            styles.liquidBlob,
            { width: pillWidth },
            animatedBlobStyle,
          ]}
        >
          <LinearGradient
            colors={['#7C6FE0', '#F58FA8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />
        </Animated.View>
      )}

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
            { color: isLight ? '#FFFFFF' : themeTokens.textSecondary, fontWeight: isLight ? '700' : '600' },
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
            { color: !isLight ? '#FFFFFF' : themeTokens.textSecondary, fontWeight: !isLight ? '700' : '600' },
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
    left: 4,
    bottom: 4,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#7C6FE0',
    shadowOffset: { width: 0, height: 3 },
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
    fontFamily: Platform.select({ ios: 'Nunito', android: 'Nunito', default: 'sans-serif' }),
  },
});
