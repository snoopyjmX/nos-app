import React from 'react';
import { View, Text, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppTheme } from '@/lib/context/ThemeContext';
import { getThemeTokens } from '@/design/tokens/theme';
import { PressableScale } from '@/design/ui/PressableScale';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  compact = false,
  style,
}: EmptyStateProps) {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);

  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      <View
        style={[
          styles.iconBadge,
          compact && styles.iconBadgeCompact,
          {
            backgroundColor: isDark
              ? 'rgba(157, 146, 240, 0.12)'
              : 'rgba(124, 111, 224, 0.08)',
            borderColor: isDark
              ? 'rgba(157, 146, 240, 0.20)'
              : 'rgba(124, 111, 224, 0.14)',
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={compact ? 24 : 34}
          color={themeTokens.primary}
        />
      </View>

      <Text
        style={[
          styles.title,
          compact && styles.titleCompact,
          { color: themeTokens.textPrimary },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.subtitle,
          compact && styles.subtitleCompact,
          { color: themeTokens.textSecondary },
        ]}
      >
        {subtitle}
      </Text>

      {actionLabel && onAction && (
        <PressableScale
          onPress={onAction}
          style={[
            styles.actionButton,
            compact && styles.actionButtonCompact,
            {
              backgroundColor: isDark
                ? 'rgba(157, 146, 240, 0.18)'
                : 'rgba(124, 111, 224, 0.12)',
              borderColor: isDark
                ? 'rgba(157, 146, 240, 0.30)'
                : 'rgba(124, 111, 224, 0.22)',
            },
          ]}
          accessibilityLabel={actionLabel}
        >
          <Ionicons
            name="add"
            size={compact ? 15 : 18}
            color={themeTokens.primary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.actionButtonText,
              compact && styles.actionButtonTextCompact,
              { color: themeTokens.primary },
            ]}
          >
            {actionLabel}
          </Text>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  containerCompact: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconBadgeCompact: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Nunito', android: 'Nunito', default: 'sans-serif' }),
    textAlign: 'center',
    marginBottom: 6,
  },
  titleCompact: {
    fontSize: 15,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: Platform.select({ ios: 'Nunito', android: 'Nunito', default: 'sans-serif' }),
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  subtitleCompact: {
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 260,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 18,
    minHeight: 44,
  },
  actionButtonCompact: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
    minHeight: 38,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Nunito', android: 'Nunito', default: 'sans-serif' }),
  },
  actionButtonTextCompact: {
    fontSize: 13,
  },
});
