import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutDown,
  FadeIn,
  FadeOut,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useToast } from '@/lib/context/ToastContext';
import { useTheme } from '@/theme';
import { PressableScale } from './PressableScale';

export function Toast() {
  const { toast, hideToast } = useToast();
  const { colors, typography, spacing, radii, shadows, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  if (!toast) return null;

  const handleAction = () => {
    if (toast.onAction) {
      toast.onAction();
    }
    hideToast(toast.id);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <Feather name="heart" size={18} color={colors.accent} />;
      case 'error':
        return <Feather name="alert-circle" size={18} color={colors.danger} />;
      default:
        return <Feather name="info" size={18} color={colors.primary} />;
    }
  };

  return (
    <Animated.View
      key={toast.id}
      entering={
        reducedMotion
          ? FadeIn.duration(150)
          : FadeInDown.duration(240).springify().damping(18)
      }
      exiting={reducedMotion ? FadeOut.duration(150) : FadeOutDown.duration(180)}
      style={[
        styles.toastWrapper,
        {
          bottom: Math.max(insets.bottom, 16) + 76, // Acima da tab bar
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.toastCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.md,
            ...shadows.medium,
          },
        ]}
      >
        <View style={styles.iconBox}>{getIcon()}</View>

        <Text
          style={[
            styles.messageText,
            { 
              color: colors.textPrimary,
              fontFamily: typography.fontFamily.medium,
              fontSize: typography.fontSize.sm,
            }
          ]}
          numberOfLines={2}
        >
          {toast.message}
        </Text>

        {toast.actionLabel && (
          <PressableScale
            onPress={handleAction}
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.accentSoft,
                borderRadius: radii.sm,
              },
            ]}
            accessibilityLabel={toast.actionLabel}
          >
            <Text 
              style={[
                styles.actionButtonText, 
                { 
                  color: colors.accent,
                  fontFamily: typography.fontFamily.bold,
                }
              ]}
            >
              {toast.actionLabel}
            </Text>
          </PressableScale>
        )}

        <PressableScale
          onPress={() => hideToast(toast.id)}
          style={styles.closeButton}
          hitSlop={12}
          accessibilityLabel="Fechar notificação"
        >
          <Feather name="x" size={18} color={colors.textSecondary} />
        </PressableScale>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    maxWidth: 400,
    width: '100%',
  },
  iconBox: {
    marginRight: 12,
  },
  messageText: {
    flex: 1,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 13,
  },
  closeButton: {
    paddingLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
