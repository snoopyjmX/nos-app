import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedTouchable } from '../AnimatedTouchable';
import { useAppTheme } from '../../context/ThemeContext';
import { getThemeTokens } from '../../constants/theme';

export function UpdateBanner() {
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const insets = useSafeAreaInsets();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // 1. Já existe um worker esperando para ativar
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setHasUpdate(true);
      }

      // 2. Novo worker detectado durante o ciclo de vida
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
          backgroundColor: isDark ? 'rgba(35, 29, 62, 0.95)' : 'rgba(255, 255, 255, 0.96)',
          borderColor: isDark ? 'rgba(167, 151, 255, 0.35)' : 'rgba(124, 111, 224, 0.25)',
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(167,151,255,0.18)' : '#EFECFC' }]}>
          <Ionicons name="sparkles" size={15} color={themeTokens.primary} />
        </View>

        <View style={styles.textColumn}>
          <Text style={[styles.title, { color: themeTokens.textPrimary }]}>
            Nova versão disponível
          </Text>
          <Text style={[styles.subtitle, { color: themeTokens.textSecondary }]}>
            Atualize para carregar as melhorias
          </Text>
        </View>

        <AnimatedTouchable
          style={[styles.reloadButton, { backgroundColor: themeTokens.primary }]}
          onPress={handleReload}
          activeOpacity={0.85}
        >
          <Text style={styles.reloadText}>Recarregar</Text>
        </AnimatedTouchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  reloadButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reloadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
