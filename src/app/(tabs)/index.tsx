import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { Screen, Skeleton } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useDockInset } from '@/lib/hooks/useDockInset';
import { useAuth } from '@/lib/context/AuthContext';
import { useCouple } from '@/lib/context/CoupleContext';
import { useTheme } from '@/theme';
import { checkTodayCelebration } from '@/lib/milestones';

import { useHomeData } from '@/features/home/api/useHomeData';
import { getFirstName } from '@/features/profile/utils/formatting';
import { HeroCard } from '@/features/home/components/HeroCard';
import { ShortcutsRow } from '@/features/home/components/ShortcutsRow';
import { NextMilestoneCard } from '@/features/home/components/NextMilestoneCard';
import { RecentMemoryCard } from '@/features/home/components/RecentMemoryCard';
import { ThrowbackMemoryCard } from '@/features/home/components/ThrowbackMemoryCard';

let hasPlayedHomeEntranceInSession = false;

export default function HomeScreen() {
  const { colors, typography, radii, spacing } = useTheme();
  const router = useRouter();
  const dockInset = useDockInset();
  const { user } = useAuth();
  const { coupleId } = useCouple();

  const reducedMotion = useReducedMotion();
  const [shouldAnimateCascade] = useState(() => !hasPlayedHomeEntranceInSession && !reducedMotion);

  useEffect(() => {
    hasPlayedHomeEntranceInSession = true;
  }, []);

  const {
    ownerFirstName,
    partnerFirstName,
    effectiveStartDateStr,
    recentMemory,
    throwbackMemory,
    nextMilestone,
    loading,
    refreshing,
    onRefresh,
  } = useHomeData(coupleId, user);

  const celebration = useMemo(
    () => checkTodayCelebration(effectiveStartDateStr),
    [effectiveStartDateStr]
  );

  const contextualGreeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = ownerFirstName?.trim() || getFirstName(user?.user_metadata?.display_name) || '';
    const nameSuffix = name && name.toLowerCase() !== 'você' ? `, ${name}` : '';
    if (hour >= 5 && hour < 12) {
      return `Bom dia${nameSuffix}`;
    }
    if (hour >= 12 && hour < 18) {
      return `Boa tarde${nameSuffix}`;
    }
    return `Boa noite${nameSuffix}`;
  }, [ownerFirstName, user]);

  const heroImageUri = recentMemory?.displayUrl || recentMemory?.image_url;

  const goTo = (route: '/(tabs)/memories' | '/(tabs)/messages' | '/(tabs)/dates') => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route);
  };

  const handleOpenMemories = () => goTo('/(tabs)/memories');
  const handleOpenMessages = () => goTo('/(tabs)/messages');
  const handleOpenDates = () => goTo('/(tabs)/dates');

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      {/* Topo: o Screen já soma o inset superior (insets.top ou env(safe-area-inset-top)); aqui entram os 12px de respiro */}
      <View style={[styles.header, { paddingTop: spacing[12], paddingHorizontal: spacing[16] }]}>
        <Text
          accessibilityRole="header"
          style={[styles.greeting, { color: colors.textPrimary, ...typography.font.black }]}
        >
          {contextualGreeting}
        </Text>
        {partnerFirstName ? (
          <LiquidGlassView variant="pill" readable borderRadius={radii.pill} style={styles.partnerBadge}>
            <Feather name="heart" size={12} color={colors.accentText} />
            <Text
              style={[styles.partnerBadgeText, { color: colors.textSecondary, ...typography.font.bold }]}
              numberOfLines={1}
            >
              Com {partnerFirstName}
            </Text>
          </LiquidGlassView>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(dockInset, 160) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <View style={{ gap: 16 }}>
            <Skeleton width="100%" height={420} borderRadius={radii.lg} />
            <Skeleton width="100%" height={48} borderRadius={radii.pill} />
            <Skeleton width="100%" height={80} borderRadius={radii.md} />
          </View>
        ) : (
          <View>
            {celebration ? (
              <Animated.View
                entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(0) : undefined}
                style={styles.celebrationWrapper}
              >
                <LiquidGlassView variant="card" readable borderRadius={radii.md} style={styles.celebrationCard}>
                  <LinearGradient
                    colors={colors.celebrationGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: radii.md }]}
                    pointerEvents="none"
                  />
                  <View style={[styles.celebrationBadge, { backgroundColor: colors.accentGlass }]}>
                    <Feather name="star" size={13} color={colors.accentText} />
                    <Text style={[styles.celebrationBadgeText, { color: colors.accentText, ...typography.font.bold }]}>
                      {celebration.badge}
                    </Text>
                  </View>
                  <Text
                    accessibilityRole="header"
                    style={[styles.celebrationTitle, { color: colors.textPrimary, ...typography.font.bold }]}
                  >
                    {celebration.title}
                  </Text>
                  <Text style={[styles.celebrationSubtitle, { color: colors.textSecondary, ...typography.font.regular }]}>
                    {celebration.subtitle}
                  </Text>
                </LiquidGlassView>
              </Animated.View>
            ) : null}

            <HeroCard
              heroImageUri={heroImageUri}
              effectiveStartDateStr={effectiveStartDateStr}
              handleOpenMemories={handleOpenMemories}
              shouldAnimateCascade={shouldAnimateCascade}
            />

            <ShortcutsRow
              handleOpenMessages={handleOpenMessages}
              handleOpenMemories={handleOpenMemories}
              handleOpenDates={handleOpenDates}
              shouldAnimateCascade={shouldAnimateCascade}
            />

            <NextMilestoneCard
              nextMilestone={nextMilestone}
              handleOpenDates={handleOpenDates}
              shouldAnimateCascade={shouldAnimateCascade}
            />

            <RecentMemoryCard
              recentMemory={recentMemory}
              handleOpenMemories={handleOpenMemories}
              shouldAnimateCascade={shouldAnimateCascade}
            />

            <ThrowbackMemoryCard
              throwbackMemory={throwbackMemory}
              handleOpenMemories={handleOpenMemories}
              shouldAnimateCascade={shouldAnimateCascade}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    flexShrink: 1,
    minWidth: 0,
  },
  partnerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 28,
  },
  partnerBadgeText: {
    fontSize: 13,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  celebrationWrapper: {
    marginBottom: 16,
  },
  celebrationCard: {
    padding: 20,
    gap: 8,
  },
  celebrationBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  celebrationBadgeText: {
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  celebrationTitle: {
    fontSize: 24,
    letterSpacing: -0.5,
  },
  celebrationSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
});
