import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  withBottomTabBar?: boolean;
}

export function Screen({
  children,
  style,
}: ScreenProps) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: (Platform.OS === 'web' ? 'env(safe-area-inset-top, 0px)' : insets.top) as any,
          paddingLeft: Math.max(insets.left, spacing[12]),
          paddingRight: Math.max(insets.right, spacing[12]),
          // paddingBottom is handled by useDockInset() in ScrollViews to avoid double padding
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
