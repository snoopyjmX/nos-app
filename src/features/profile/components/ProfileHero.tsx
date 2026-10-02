import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { PressableScale } from '@/components/ui/PressableScale';
import { usePathname } from 'expo-router';
import { useTheme } from '@/theme';
import { ProfileData } from '../types';
import { getFirstName } from '../utils/formatting';

interface ProfileHeroProps {
  myProfile: ProfileData | null;
  partnerProfile: ProfileData | null;
  myName: string;
  partnerName: string;
  uploadingAvatar: boolean;
  onPickAvatar: () => void;
}

export function ProfileHero({
  myProfile,
  partnerProfile,
  myName,
  partnerName,
  uploadingAvatar,
  onPickAvatar,
}: ProfileHeroProps) {
  const pathname = usePathname();
  const isFocused = pathname.includes('/profile');
  const reducedMotion = useReducedMotion();
  const heartScale = useSharedValue(1);
  const { colors, typography, isDark } = useTheme();

  useEffect(() => {
    if (!isFocused || reducedMotion) {
      cancelAnimation(heartScale);
      heartScale.value = 1;
      return;
    }

    heartScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(heartScale);
    };
  }, [isFocused, reducedMotion]);

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  return (
    <View style={styles.heroCardContainer}>
      <View
        style={[
          styles.coupleHeroCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.avatarsRow}>
          {/* Avatar do Usuário Logado */}
          <PressableScale
            style={styles.avatarWrapper}
            onPress={onPickAvatar}
            disabled={uploadingAvatar}
            accessibilityLabel="Alterar minha foto de perfil"
          >
            <View style={styles.avatarGradientRingWrapper}>
              <LinearGradient
                colors={['#7C6FE0', '#F58FA8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradientRing}
              >
                <View style={[styles.avatarInnerContainer, { backgroundColor: isDark ? '#15122A' : '#FFFFFF' }]}>
                  {uploadingAvatar ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : myProfile?.displayAvatarUrl ? (
                    <Image
                      source={{ uri: myProfile.displayAvatarUrl }}
                      style={styles.avatarImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <Feather name="user" size={32} color={colors.primary} />
                  )}
                </View>
              </LinearGradient>
              <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
                <Feather name="camera" size={12} color="#FFFFFF" />
              </View>
            </View>

            <Text style={[styles.avatarLabel, { color: colors.textPrimary, fontFamily: typography.fontFamily.black }]} numberOfLines={2}>
              {getFirstName(myName)}
            </Text>
            <Text style={[styles.avatarSubLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily.bold }]}>Você</Text>
          </PressableScale>

          {/* Conector Central */}
          <View style={styles.connectorCenter}>
            <View style={[styles.connectorLine, { backgroundColor: colors.border }]} />
            <Animated.View style={[styles.heartCircleContainer, animatedHeartStyle]}>
              <LinearGradient
                colors={['#7C6FE0', '#F58FA8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heartCircle}
              >
                <Feather name="heart" size={16} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
            <View style={[styles.connectorLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Avatar do Parceiro/Parceira */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarGradientRingWrapper}>
              <LinearGradient
                colors={['#F58FA8', '#7C6FE0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradientRing}
              >
                <View style={[styles.avatarInnerContainer, { backgroundColor: isDark ? '#15122A' : '#FFFFFF' }]}>
                  {partnerProfile?.displayAvatarUrl ? (
                    <Image
                      source={{ uri: partnerProfile.displayAvatarUrl }}
                      style={styles.avatarImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <Feather name="user" size={32} color={colors.primary} />
                  )}
                </View>
              </LinearGradient>
            </View>

            <Text style={[styles.avatarLabel, { color: colors.textPrimary, fontFamily: typography.fontFamily.black }]} numberOfLines={2}>
              {getFirstName(partnerName)}
            </Text>
            <Text style={[styles.avatarSubLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily.bold }]}>Parceiro(a)</Text>
          </View>
        </View>

        {/* Badge de Sincronização Ativa */}
        <View
          style={[
            styles.syncStatusBadge,
            {
              backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.10)',
              borderColor: isDark ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.20)',
            },
          ]}
        >
          <View style={styles.greenPulseDot} />
          <Text style={[styles.syncStatusText, { color: isDark ? '#4ADE80' : '#15803D', fontFamily: typography.fontFamily.bold }]}>
            Espaço Compartilhado Sincronizado
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCardContainer: {
    marginBottom: 20,
  },
  coupleHeroCard: {
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  avatarWrapper: {
    alignItems: 'center',
    minWidth: 96,
    maxWidth: 120,
    paddingHorizontal: 4,
  },
  avatarGradientRingWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGradientRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 37,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 2,
  },
  avatarLabel: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  avatarSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  connectorCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  connectorLine: {
    width: 14,
    height: 2,
  },
  heartCircleContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heartCircle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22C55E',
  },
  syncStatusText: {
    fontSize: 11,
  },
});
