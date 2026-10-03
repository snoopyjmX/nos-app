import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme';

interface AvatarProps {
  url?: string | null;
  name: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({ url, name, size = 48, style }: AvatarProps) {
  const { colors, typography } = useTheme();
  
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primarySoft,
        },
        style,
      ]}
    >
      {url ? (
        <Image
          source={{ uri: url }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              color: colors.primary,
              ...typography.font.bold,
              fontSize: size * 0.4,
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {},
});
