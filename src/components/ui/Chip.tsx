import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme';

type IconName = keyof typeof Feather.glyphMap;

interface ChipProps {
  label: string;
  icon?: IconName;
  active?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, icon, active = false, style }: ChipProps) {
  const { colors, radii, spacing, typography } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: active ? colors.primary : colors.primarySoft,
          borderRadius: radii.pill,
          paddingVertical: spacing[8],
          paddingHorizontal: spacing[16],
        },
        style,
      ]}
    >
      {icon && (
        <Feather
          name={icon}
          size={16}
          color={active ? colors.surface : colors.primary}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: active ? colors.surface : colors.primary,
            fontFamily: typography.fontFamily.bold,
            fontSize: typography.fontSize.sm,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 6,
  },
  text: {},
});
