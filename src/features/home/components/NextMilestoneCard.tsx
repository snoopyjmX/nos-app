import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui';
import { NextMilestone } from '../types';
import { useTheme } from '@/theme';

interface NextMilestoneCardProps {
  nextMilestone: NextMilestone | null;
  handleOpenDates: () => void;
  shouldAnimateCascade: boolean;
}

export function NextMilestoneCard({
  nextMilestone,
  handleOpenDates,
  shouldAnimateCascade,
}: NextMilestoneCardProps) {
  const { colors, typography, radii, shadows } = useTheme();

  if (!nextMilestone) return null;

  return (
    <Animated.View
      entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(120) : undefined}
    >
      <PressableScale
        style={[
          styles.milestoneCard,
          {
            backgroundColor: colors.surface,
            borderRadius: radii.md,
            borderWidth: 0,
            ...shadows.soft,
          },
        ]}
        onPress={handleOpenDates}
      >
        <View
          style={[
            styles.milestoneIconBox,
            {
              backgroundColor: colors.primarySoft,
            },
          ]}
        >
          <Feather name="star" size={20} color={colors.primary} />
        </View>

        <View style={styles.milestoneContent}>
          <Text style={[styles.milestoneLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily.bold }]}>
            PRÓXIMO MOMENTO
          </Text>
          <Text
            style={[styles.milestoneTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}
            numberOfLines={2}
          >
            {nextMilestone.title}
          </Text>
        </View>

        <View
          style={[
            styles.milestoneChip,
            {
              backgroundColor: colors.primarySoft,
              borderRadius: radii.pill,
            },
          ]}
        >
          <Text style={[styles.milestoneChipText, { color: colors.primary, fontFamily: typography.fontFamily.bold }]}>
            {nextMilestone.daysRemaining === 0
              ? 'É hoje!'
              : `em ${nextMilestone.daysRemaining}d`}
          </Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  milestoneIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  milestoneContent: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  milestoneLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  milestoneTitle: {
    fontSize: 16,
    letterSpacing: -0.3,
  },
  milestoneChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneChipText: {
    fontSize: 12,
  },
});
