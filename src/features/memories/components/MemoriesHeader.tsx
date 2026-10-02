import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { useTheme } from '@/theme';

interface MemoriesHeaderProps {
  insets: any;
}

export function MemoriesHeader({ insets }: MemoriesHeaderProps) {
  const { colors, typography, shadows } = useTheme();

  return (
    <View 
      style={[
        styles.headerContainer, 
        { 
          paddingTop: insets.top,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          ...shadows.soft,
        }
      ]}
    >
      <View style={styles.headerInnerRow}>
        <Text style={[styles.headerBrandTitle, { color: colors.primary, fontFamily: typography.fontFamily.bold }]}>nós.</Text>
        <Text
          style={[styles.headerCoupleSubtitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}
          numberOfLines={1}
        >
          Nossos momentos eternizados
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  headerInnerRow: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 12,
  },
  headerBrandTitle: {
    fontSize: 27,
    letterSpacing: -0.8,
  },
  headerCoupleSubtitle: {
    fontSize: 13,
    marginTop: -2,
  },
});
