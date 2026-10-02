import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from './PressableScale';
import { useTheme } from '@/theme';

export function UpdateBanner() {
  const { colors, typography, shadows, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setHasUpdate(true);
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setHasUpdate(true);
          }
        });
      });
    }).catch((err) => {
      // Falha silenciosa de registro de Service Worker em desenvolvimento
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const handleReload = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  if (!hasUpdate) return null;

  return (
    <View
      style={[
        styles.bannerContainer,
        {
          top: insets.top > 0 ? insets.top + 8 : 12,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.md,
          ...shadows.medium,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
          <Feather name="refresh-cw" size={15} color={colors.primary} />
        </View>

        <View style={styles.textColumn}>
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
            Nova versão disponível
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
            Atualize para carregar as melhorias
          </Text>
        </View>

        <PressableScale
          style={[styles.reloadButton, { backgroundColor: colors.primary, borderRadius: radii.sm }]}
          onPress={handleReload}
        >
          <Text style={[styles.reloadText, { fontFamily: typography.fontFamily.bold, color: colors.surface }]}>
            Recarregar
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderWidth: 1,
    zIndex: 9999,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  reloadButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reloadText: {
    fontSize: 12,
  },
});
