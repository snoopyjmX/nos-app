import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from '@/design/ui/GlassSurface';
import { PressableScale } from '@/design/ui/PressableScale';

interface MessagesHeaderProps {
  isDark: boolean;
  themeTokens: any;
  insets: any;
  onGoBack: () => void;
}

export function MessagesHeader({ isDark, themeTokens, insets, onGoBack }: MessagesHeaderProps) {
  return (
    <View style={[styles.blurredHeaderContainer, { paddingTop: insets.top }]}>
      <GlassSurface
        intensity={Platform.OS === 'ios' ? 80 : 100}
        tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark ? 'rgba(21, 18, 42, 0.72)' : 'rgba(248, 246, 254, 0.75)',
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
          },
        ]}
      />
      <View style={styles.headerContentRow}>
        <PressableScale
          style={[
            styles.headerBackButton,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.08)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(124, 111, 224, 0.15)',
            },
          ]}
          onPress={onGoBack}
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={20} color={themeTokens.textPrimary} />
        </PressableScale>

        <View style={styles.headerBrandWrapper}>
          <Text style={[styles.headerBrandTitle, { color: themeTokens.primary }]}>nós.</Text>
          <Text
            style={[styles.headerCoupleSubtitle, { color: themeTokens.textSecondary }]}
            numberOfLines={2}
          >
            Bilhetes carinhosos do casal
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blurredHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    overflow: 'hidden',
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 12,
    gap: 12,
  },
  headerBackButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  headerBrandWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  headerBrandTitle: {
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  headerCoupleSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
});
