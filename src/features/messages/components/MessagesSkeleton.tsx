import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface MessagesSkeletonProps {
  insets: any;
  isDark: boolean;
  themeTokens: any;
}

export function MessagesSkeleton({ insets, isDark, themeTokens }: MessagesSkeletonProps) {
  return (
    <View style={[styles.skeletonChat, { paddingTop: insets.top + (Platform.OS === 'ios' ? 70 : 66) }]}>
      {[
        { align: 'left' as const, w: '65%' },
        { align: 'right' as const, w: '60%' },
        { align: 'left' as const, w: '55%' },
        { align: 'right' as const, w: '70%' },
      ].map((s, i) => (
        <View
          key={i}
          style={[
            s.align === 'left' ? styles.skeletonLeft : styles.skeletonRight,
            {
              width: s.w as any,
              backgroundColor:
                s.align === 'right'
                  ? isDark
                    ? 'rgba(167,151,255,0.15)'
                    : 'rgba(142,124,232,0.2)'
                  : isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(255,255,255,0.55)',
              borderColor: isDark
                ? themeTokens.glassBorder
                : 'rgba(255,255,255,0.7)',
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonChat: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 14,
  },
  skeletonLeft: {
    height: 48,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  skeletonRight: {
    height: 48,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
    borderWidth: 1,
  },
});
