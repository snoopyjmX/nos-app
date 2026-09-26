import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Canvas, Circle, BlurMask, LinearGradient, vec } from '@shopify/react-native-skia';
import { useAppTheme } from '../../context/ThemeContext';
import { COLORS, DARK_COLORS } from '../../constants/theme';

export function AtmosphereBackground() {
  const { width, height } = useWindowDimensions();
  const { isDark } = useAppTheme();

  const themeTokens = isDark ? DARK_COLORS : COLORS;

  return (
    <View style={[styles.container, { backgroundColor: themeTokens.background }]}>
      <Canvas style={{ width, height }}>
        <Circle cx={width} cy={0} r={width * 0.8}>
          <LinearGradient
            start={vec(width, 0)}
            end={vec(width * 0.2, height * 0.4)}
            colors={[
              themeTokens.orbLavender,
              isDark ? 'rgba(76, 58, 140, 0)' : 'rgba(221, 214, 254, 0)',
            ]}
          />
          <BlurMask blur={isDark ? 90 : 80} style="normal" />
        </Circle>

        <Circle cx={0} cy={height} r={width * 0.7}>
          <LinearGradient
            start={vec(0, height)}
            end={vec(width * 0.8, height * 0.6)}
            colors={[
              themeTokens.orbPink,
              isDark ? 'rgba(58, 42, 77, 0)' : 'rgba(252, 231, 243, 0)',
            ]}
          />
          <BlurMask blur={isDark ? 100 : 90} style="normal" />
        </Circle>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...(StyleSheet.absoluteFill as object),
  },
});
