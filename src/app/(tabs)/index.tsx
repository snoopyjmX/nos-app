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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AtmosphereBackground } from '@/design/ui/AtmosphereBackground';
import { GlassSurface } from '@/design/ui/GlassSurface';
import { AppHeader } from '@/design/components/AppHeader';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useAuth } from '@/lib/context/AuthContext';
import { useCouple } from '@/lib/context/CoupleContext';
import { useAppTheme } from '@/lib/context/ThemeContext';
import { getThemeTokens } from '@/design/tokens/theme';
import { useTabBarHeight } from '@/lib/hooks/useTabBarHeight';
import { ConfettiView } from '@/design/ui/ConfettiView';
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
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const router = useRouter();
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const insets = useSafeAreaInsets();
  const { paddingBottom: tabBarPaddingBottom } = useTabBarHeight();

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

  const [showConfetti, setShowConfetti] = useState(false);

  const celebration = useMemo(
    () => checkTodayCelebration(effectiveStartDateStr),
    [effectiveStartDateStr]
  );

  useEffect(() => {
    if (celebration && !reducedMotion) {
      setShowConfetti(true);
    }
  }, [celebration, reducedMotion]);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/memories');
  };

  const handleOpenMessages = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/messages');
  };

  const handleOpenDates = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/dates');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeTokens.background }]}>
      <AtmosphereBackground />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 88 : 82),
            paddingBottom: tabBarPaddingBottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeTokens.primary}
            colors={[themeTokens.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.skeletonContainer}>
            <View
              style={[
                styles.skeletonHeroCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.6)',
                  borderColor: isDark
                    ? themeTokens.glassBorder
                    : 'rgba(255,255,255,0.8)',
                },
              ]}
            >
              <View
                style={[
                  styles.skeletonImage,
                  {
                    backgroundColor: isDark
                      ? 'rgba(167,151,255,0.08)'
                      : 'rgba(142,124,232,0.1)',
                  },
                ]}
              />
              <View
                style={[
                  styles.skeletonPill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(167,151,255,0.1)'
                      : 'rgba(142,124,232,0.12)',
                  },
                ]}
              />
            </View>
            <View
              style={[
                styles.skeletonRowCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.6)',
                  borderColor: isDark
                    ? themeTokens.glassBorder
                    : 'rgba(255,255,255,0.8)',
                },
              ]}
            />
          </View>
        ) : (
          <View>
            <View style={styles.greetingContainer}>
              <Text style={[styles.greetingText, { color: isDark ? '#F3F1FB' : '#1E1A33' }]}>
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
                      backgroundColor: isDark ? '#261F45' : '#FFF5F8',
                      borderColor: isDark ? 'rgba(245, 143, 168, 0.35)' : 'rgba(245, 143, 168, 0.45)',
                      shadowColor: '#F58FA8',
                    },
                  ]}
                >
                  {showConfetti && <ConfettiView onComplete={() => setShowConfetti(false)} />}
                  <View style={styles.celebrationHeader}>
                    <View
                      style={[
                        styles.celebrationBadge,
                        {
                          backgroundColor: isDark
                            ? 'rgba(245, 143, 168, 0.22)'
                            : 'rgba(245, 143, 168, 0.16)',
                        },
                      ]}
                    >
                      <Ionicons name="sparkles" size={13} color={themeTokens.accent} />
                      <Text style={[styles.celebrationBadgeText, { color: themeTokens.accent }]}>
                        {celebration.badge}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.celebrationTitle,
                      { color: isDark ? '#FFFFFF' : '#1E1A33' },
                    ]}
                  >
                    {celebration.title}
                  </Text>
                  <Text
                    style={[
                      styles.celebrationSubtitle,
                      { color: isDark ? '#DDD6FE' : '#5B5675' },
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
              isDark={isDark}
              themeTokens={themeTokens}
            />

            <ShortcutsRow
              handleOpenMessages={handleOpenMessages}
              handleOpenMemories={handleOpenMemories}
              handleOpenDates={handleOpenDates}
              shouldAnimateCascade={shouldAnimateCascade}
              isDark={isDark}
              themeTokens={themeTokens}
            />

            <NextMilestoneCard
              nextMilestone={nextMilestone}
              handleOpenDates={handleOpenDates}
              shouldAnimateCascade={shouldAnimateCascade}
              isDark={isDark}
              themeTokens={themeTokens}
            />

            <RecentMemoryCard
              recentMemory={recentMemory}
              handleOpenMemories={handleOpenMemories}
              shouldAnimateCascade={shouldAnimateCascade}
              isDark={isDark}
              themeTokens={themeTokens}
            />

            <ThrowbackMemoryCard
              throwbackMemory={throwbackMemory}
              handleOpenMemories={handleOpenMemories}
              shouldAnimateCascade={shouldAnimateCascade}
              isDark={isDark}
              themeTokens={themeTokens}
            />
          </View>
        )}
      </ScrollView>

      <View style={[styles.blurredHeaderContainer, { paddingTop: insets.top }]}>
        <GlassSurface
          intensity={Platform.OS === 'ios' ? 70 : 85}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? 'rgba(15, 13, 24, 0.45)' : 'rgba(248, 249, 252, 0.50)',
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        />
        <View style={styles.headerInnerRow}>
          <AppHeader
            coupleSubtitle={coupleTitle}
            showNotification={true}
            containerStyle={{ marginBottom: 0, paddingTop: 4, paddingBottom: 8 }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurredHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    overflow: 'hidden',
  },
  headerInnerRow: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  skeletonContainer: {
    paddingTop: 10,
    gap: 16,
  },
  skeletonHeroCard: {
    width: '100%',
    height: 245,
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  skeletonImage: {
    width: '100%',
    height: 130,
    borderRadius: 18,
  },
  skeletonPill: {
    width: '65%',
    height: 38,
    borderRadius: 19,
    alignSelf: 'flex-start',
  },
  skeletonRowCard: {
    width: '100%',
    height: 80,
    borderRadius: 20,
    borderWidth: 1,
  },
  greetingContainer: {
    paddingTop: 4,
    paddingBottom: 12,
  },
  greetingText: {
    fontSize: 20,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  celebrationWrapper: {
    marginBottom: 16,
  },
  celebrationCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  celebrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  celebrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  celebrationBadgeText: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  celebrationTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  celebrationSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    fontWeight: '500',
    lineHeight: 18,
  },
});
