import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/components/ui';
import { useTheme } from '@/theme';

interface MessagesSkeletonProps {
  topInset: number;
}

export function MessagesSkeleton({ topInset }: MessagesSkeletonProps) {
  const { radii } = useTheme();

  return (
    <View style={[styles.skeletonChat, { paddingTop: topInset + 12 }]}>
      {[
        { align: 'left' as const, w: '65%' },
        { align: 'right' as const, w: '60%' },
        { align: 'left' as const, w: '55%' },
        { align: 'right' as const, w: '70%' },
      ].map((s, i) => (
        <View key={i} style={[s.align === 'left' ? styles.alignLeft : styles.alignRight, { width: s.w as any }]}>
          <Skeleton
            width="100%"
            height={48}
            borderRadius={radii.md}
            style={s.align === 'left' ? { borderBottomLeftRadius: 6 } : { borderBottomRightRadius: 6 }}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonChat: {
    paddingHorizontal: 16,
    gap: 14,
  },
  alignLeft: {
    alignSelf: 'flex-start',
  },
  alignRight: {
    alignSelf: 'flex-end',
  },
});
