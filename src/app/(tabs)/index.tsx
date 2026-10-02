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
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { Screen, Skeleton, IconButton } from '@/components/ui';
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
  const { colors, typography, radii, shadows, isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { coupleId } = useCouple();

  const reducedMotion = useReducedMotion();
  const [shouldAnimateCascade] = useState(() => !hasPlayedHomeEntranceInSession && !reducedMotion);

  useEffect(() => {
    hasPlayedHomeEntranceInSession = true;
  }, []);

  const {
    coupleTitle,
    ownerFirstName,
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
      return `Bom dia${nameSuffix} ☀️`;
    }
    if (hour >= 12 && hour < 18) {
      return `Boa tarde${nameSuffix} 🌤️`;
    }
    return `Boa noite${nameSuffix} 🌙`;
  }, [ownerFirstName, user]);

  const heroImageUri = recentMemory?.displayUrl || recentMemory?.image_url;

  const handleOpenMemories = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/memories');
  };

  const handleOpenMessages = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/messages');
  };

  const handleOpenDates = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/dates');
  };

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      {/* Header Inline */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
            {coupleTitle || 'nós.'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <IconButton 
            icon="settings" 
            variant="ghost" 
            onPress={() => router.push('/(tabs)/profile')}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
            <Skeleton width="100%" height={245} borderRadius={radii.lg} />
            <Skeleton width="100%" height={52} borderRadius={radii.md} />
            <Skeleton width="100%" height={80} borderRadius={radii.md} />
          </View>
        ) : (
          <View>
            <View style={styles.greetingContainer}>
              <Text style={[styles.greetingText, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
                {contextualGreeting}
              </Text>
            </View>

            {celebration ? (
              <Animated.View
                entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(0) : undefined}
                style={styles.celebrationWrapper}
              >
                <View
                  style={[
                    styles.celebrationCard,
                    {
                      backgroundColor: colors.accentSoft,
                      borderColor: 'transparent',
                      borderRadius: radii.md,
                      ...shadows.soft,
                    },
                  ]}
                >
                  <View style={styles.celebrationHeader}>
                    <View
                      style={[
                        styles.celebrationBadge,
                        {
                          backgroundColor: isDark ? 'rgba(245, 143, 168, 0.22)' : 'rgba(245, 143, 168, 0.16)',
                        },
                      ]}
                    >
                      <Feather name="star" size={13} color={colors.accent} />
                      <Text style={[styles.celebrationBadgeText, { color: colors.accent, fontFamily: typography.fontFamily.bold }]}>
                        {celebration.badge}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.celebrationTitle,
                      { color: colors.textPrimary, fontFamily: typography.fontFamily.bold },
                    ]}
                  >
                    {celebration.title}
                  </Text>
                  <Text
                    style={[
                      styles.celebrationSubtitle,
                      { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
                    ]}
                  >
                    {celebration.subtitle}
                  </Text>
                </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  greetingContainer: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 22,
    letterSpacing: -0.4,
  },
  celebrationWrapper: {
    marginBottom: 20,
  },
  celebrationCard: {
    padding: 20,
    borderWidth: 1,
  },
  celebrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  celebrationBadge: {
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
    marginBottom: 4,
  },
  celebrationSubtitle: {
    fontSize: 15,
  },
});
