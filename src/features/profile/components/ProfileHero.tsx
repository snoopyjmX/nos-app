import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { AnimatedIcon, PressableScale } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useTheme } from '@/theme';
import { ProfileData } from '../types';
import { getFirstName } from '../utils/formatting';

const AVATAR_SIZE = 84;
const RING_GAP = 3;

interface ProfileHeroProps {
  myProfile: ProfileData | null;
  partnerProfile: ProfileData | null;
  myName: string;
  partnerName: string;
  uploadingAvatar: boolean;
  onPickAvatar: () => void;
}

interface AvatarRingProps {
  uri?: string | null;
  loading?: boolean;
}

// Anel luminoso de 1px ao redor da foto.
function AvatarRing({ uri, loading = false }: AvatarRingProps) {
  const { colors, radii } = useTheme();

  return (
    <View style={[styles.ring, { borderColor: colors.glow, borderRadius: radii.pill, padding: RING_GAP }]}>
      <View style={[styles.avatarInner, { backgroundColor: colors.primarySoft, borderRadius: radii.pill }]}>
        {loading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : uri ? (
          <Image
            source={{ uri }}
            style={styles.avatarImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        ) : (
          <Feather name="user" size={32} color={colors.primaryText} />
        )}
      </View>
    </View>
  );
}

export function ProfileHero({
  myProfile,
  partnerProfile,
  myName,
  partnerName,
  uploadingAvatar,
  onPickAvatar,
}: ProfileHeroProps) {
  const { colors, typography, radii, spacing } = useTheme();
  const [cameraPulse, setCameraPulse] = useState(0);

  return (
    <View style={{ marginBottom: spacing[20] }}>
      <LiquidGlassView
        variant="hero"
        borderRadius={radii.lg}
        style={[styles.card, { padding: spacing[20], gap: spacing[16] }]}
      >
        <View style={[styles.avatarsRow, { gap: spacing[12] }]}>
          {/* Eu: toque para alterar a foto */}
          <PressableScale
            style={styles.person}
            onPress={onPickAvatar}
            onPressIn={() => setCameraPulse((value) => value + 1)}
            disabled={uploadingAvatar}
            accessibilityRole="button"
            accessibilityLabel="Alterar minha foto de perfil"
          >
            <View>
              <AvatarRing uri={myProfile?.displayAvatarUrl} loading={uploadingAvatar} />
              <View style={[styles.cameraBadge, { backgroundColor: colors.glow, borderColor: colors.surface }]}>
                <AnimatedIcon name="camera" size={13} color={colors.onPrimary} pulseKey={cameraPulse} />
              </View>
            </View>
            <Text style={[styles.name, { color: colors.textPrimary, ...typography.font.black }]} numberOfLines={2}>
              {getFirstName(myName)}
            </Text>
            <Text style={[styles.role, { color: colors.textSecondary, ...typography.font.bold }]}>Você</Text>
          </PressableScale>

          {/* Conector estático: nada pulsa em loop */}
          <View style={[styles.connector, { backgroundColor: colors.primarySoft }]}>
            <Feather name="heart" size={16} color={colors.accentText} />
          </View>

          <View style={styles.person} accessible accessibilityLabel={`Parceiro: ${getFirstName(partnerName)}`}>
            <AvatarRing uri={partnerProfile?.displayAvatarUrl} />
            <Text style={[styles.name, { color: colors.textPrimary, ...typography.font.black }]} numberOfLines={2}>
              {getFirstName(partnerName)}
            </Text>
            <Text style={[styles.role, { color: colors.textSecondary, ...typography.font.bold }]}>Parceiro(a)</Text>
          </View>
        </View>

        <LiquidGlassView variant="pill" disableBlur readable borderRadius={radii.pill} style={styles.badge}>
          <Text style={[styles.badgeText, { color: colors.textSecondary, ...typography.font.medium }]}>
            Espaço privado do casal
          </Text>
        </LiquidGlassView>
      </LiquidGlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
  },
  person: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    maxWidth: 130,
  },
  ring: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderWidth: 1,
  },
  avatarInner: {
    flex: 1,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  role: {
    fontSize: 12,
    marginTop: 2,
  },
  connector: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: AVATAR_SIZE / 2 - 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
  },
});
