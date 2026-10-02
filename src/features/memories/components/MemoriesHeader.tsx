import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { GlassSurface } from '@/design/ui/GlassSurface';
import { AppHeader } from '@/design/components/AppHeader';

interface MemoriesHeaderProps {
  isDark: boolean;
  insets: any;
}

export function MemoriesHeader({ isDark, insets }: MemoriesHeaderProps) {
  return (
    <View style={[styles.blurredHeaderContainer, { paddingTop: insets.top }]}>
      <GlassSurface
        intensity={Platform.OS === 'ios' ? 80 : 100}
        tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark ? 'rgba(15, 13, 24, 0.65)' : 'rgba(248, 249, 252, 0.70)',
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.60)',
          },
        ]}
      />
      <View style={styles.headerInnerRow}>
        <AppHeader
          sectionTitle="nós."
          coupleSubtitle="Nossos momentos eternizados"
          containerStyle={{ marginBottom: 0, paddingTop: 6, paddingBottom: 6 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blurredHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    overflow: 'hidden',
  },
  headerInnerRow: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
});
