import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedTouchable } from './AnimatedTouchable';

interface AppHeaderProps {
  sectionTitle?: string;
  coupleSubtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function AppHeader({
  sectionTitle,
  coupleSubtitle,
  showBack = false,
  onBack,
  rightAction,
}: AppHeaderProps) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(withTiming(1.6, { duration: 1600 }), -1, true);
    pulseOpacity.value = withRepeat(withTiming(0.35, { duration: 1600 }), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {showBack && onBack && (
          <AnimatedTouchable style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color="#16151E" />
          </AnimatedTouchable>
        )}

        <View style={styles.brandWrapper}>
          <View style={styles.logoRow}>
            <Text style={styles.brandTitle}>
              nós<Text style={styles.brandDot}>.</Text>
            </Text>
            {sectionTitle ? (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{sectionTitle}</Text>
              </View>
            ) : null}
          </View>

          {coupleSubtitle ? (
            <Text style={styles.coupleSubtitle} numberOfLines={1}>
              {coupleSubtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightContainer}>
        {rightAction ? (
          rightAction
        ) : (
          <View style={styles.connectedPill}>
            <View style={styles.pulseDotContainer}>
              <Animated.View style={[styles.pulseDotRing, pulseStyle]} />
              <View style={styles.pulseDotCore} />
            </View>
            <Text style={styles.connectedText}>Conectados</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#635380',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  brandWrapper: {
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16151E',
    letterSpacing: -1.5,
  },
  brandDot: {
    color: '#8E7CE8',
  },
  sectionBadge: {
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.25)',
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E7CE8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  coupleSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#686578',
    marginTop: 2,
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  connectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#635380',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  pulseDotContainer: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  pulseDotRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
  },
  pulseDotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  connectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16151E',
  },
});
