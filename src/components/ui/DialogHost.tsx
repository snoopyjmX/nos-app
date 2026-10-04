import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { DialogRequest, subscribeToDialogs } from '@/lib/core/dialog';
import { Button } from './Button';

// Substitui o alert() do navegador na web: modal acessível, com botões do app e foco preso.
export function DialogHost() {
  const { colors, typography, radii, spacing } = useTheme();
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const current = queue[0];

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    return subscribeToDialogs((request) => setQueue((items) => [...items, request]));
  }, []);

  const close = useCallback((index?: number) => {
    const request = queue[0];
    setQueue((items) => items.slice(1));
    if (request && index !== undefined) request.buttons[index]?.onPress?.();
  }, [queue]);

  if (!current) return null;

  const cancelIndex = current.buttons.findIndex((b) => b.style === 'cancel');

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={() => close(cancelIndex >= 0 ? cancelIndex : undefined)}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlayMedium, padding: spacing[20] }]}>
        <View
          accessibilityViewIsModal
          style={[
            styles.card,
            {
              padding: spacing[20],
              gap: spacing[16],
              borderRadius: radii.lg,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: colors.textPrimary, ...typography.font.bold }]}
          >
            {current.title}
          </Text>
          {current.message ? (
            <Text style={[styles.message, { color: colors.textSecondary, ...typography.font.regular }]}>
              {current.message}
            </Text>
          ) : null}
          <View style={{ gap: spacing[8] }}>
            {current.buttons.map((button, index) => (
              <Button
                key={`${button.text}-${index}`}
                variant={
                  button.style === 'destructive' ? 'danger' : button.style === 'cancel' ? 'secondary' : 'primary'
                }
                onPress={() => close(index)}
              >
                {button.text ?? 'OK'}
              </Button>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 380 },
  title: { fontSize: 18, textAlign: 'center' },
  message: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
