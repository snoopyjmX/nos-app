import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export function LiquidGlassBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base clean background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F8F9FC' }]} />

      {/* Top right ambient glow orb (Lavender) */}
      <LinearGradient
        colors={['rgba(216, 180, 254, 0.45)', 'rgba(237, 233, 254, 0.15)', 'transparent']}
        style={[
          styles.glowOrb,
          {
            top: -60,
            right: -60,
            width: width * 0.8,
            height: width * 0.8,
          },
        ]}
      />

      {/* Center left ambient glow orb (Peach/Rose) */}
      <LinearGradient
        colors={['rgba(254, 215, 226, 0.4)', 'rgba(252, 231, 243, 0.12)', 'transparent']}
        style={[
          styles.glowOrb,
          {
            top: '32%',
            left: -80,
            width: width * 0.75,
            height: width * 0.75,
          },
        ]}
      />

      {/* Bottom ambient glow orb (Lilac) under the floating dock */}
      <LinearGradient
        colors={['rgba(196, 181, 253, 0.45)', 'rgba(224, 231, 255, 0.15)', 'transparent']}
        style={[
          styles.glowOrb,
          {
            bottom: -40,
            right: 20,
            width: width * 0.85,
            height: width * 0.85,
          },
        ]}
      />

      {/* Diffuse blur overlay to melt everything into liquid glass atmosphere */}
      <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
});
