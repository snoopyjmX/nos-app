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
import Ionicons from '@expo/vector-icons/Ionicons';
import { useToast } from '../../context/ToastContext';
import { useAppTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../constants/theme';
import { PressableScale } from './PressableScale';

export function Toast() {
  const { toast, hideToast } = useToast();
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
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
        return <Ionicons name="heart" size={18} color={themeTokens.accent} />;
      case 'error':
        return <Ionicons name="alert-circle" size={18} color="#E05D52" />;
      default:
        return <Ionicons name="sparkles" size={18} color={themeTokens.primary} />;
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
          bottom: Math.max(insets.bottom, 16) + 76,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.toastCard,
          {
            backgroundColor: isDark ? 'rgba(31, 27, 58, 0.96)' : 'rgba(255, 255, 255, 0.97)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(124, 111, 224, 0.18)',
            shadowColor: '#7C6FE0',
          },
        ]}
      >
        <View style={styles.iconBox}>{getIcon()}</View>

        <Text
          style={[styles.messageText, { color: themeTokens.textPrimary }]}
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
                backgroundColor: isDark
                  ? 'rgba(245, 143, 168, 0.18)'
                  : 'rgba(245, 143, 168, 0.15)',
              },
            ]}
            accessibilityLabel={toast.actionLabel}
          >
            <Text style={[styles.actionButtonText, { color: themeTokens.accent }]}>
              {toast.actionLabel}
            </Text>
          </PressableScale>
        )}

        <PressableScale
          onPress={() => hideToast(toast.id)}
          style={styles.closeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Fechar notificação"
        >
          <Ionicons
            name="close"
            size={16}
            color={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(30, 26, 51, 0.45)'}
          />
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
    zIndex: 9999,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 480,
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
  iconBox: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Nunito', android: 'Nunito', default: 'sans-serif' }),
    lineHeight: 19,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
    marginRight: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Nunito', android: 'Nunito', default: 'sans-serif' }),
  },
  closeButton: {
    marginLeft: 6,
    padding: 4,
  },
});
