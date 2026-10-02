import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Skeleton } from '@/components/ui';
import { useTheme } from '@/theme';

interface MessagesSkeletonProps {
  insets: any;
}

export function MessagesSkeleton({ insets }: MessagesSkeletonProps) {
  const { radii } = useTheme();
  
  return (
    <View style={[styles.skeletonChat, { paddingTop: insets.top + (Platform.OS === 'ios' ? 70 : 66) }]}>
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
            style={s.align === 'left' ? { borderBottomLeftRadius: 4 } : { borderBottomRightRadius: 4 }}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonChat: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 14,
  },
  alignLeft: {
    alignSelf: 'flex-start',
  },
  alignRight: {
    alignSelf: 'flex-end',
  },
});
