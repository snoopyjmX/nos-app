import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from '@/design/ui/PressableScale';
import { NextMilestone } from '../types';

interface NextMilestoneCardProps {
  nextMilestone: NextMilestone | null;
  handleOpenDates: () => void;
  shouldAnimateCascade: boolean;
  isDark: boolean;
  themeTokens: any;
}

export function NextMilestoneCard({
  nextMilestone,
  handleOpenDates,
  shouldAnimateCascade,
  isDark,
  themeTokens,
}: NextMilestoneCardProps) {
  if (!nextMilestone) return null;

  return (
    <Animated.View
      entering={shouldAnimateCascade ? FadeInDown.duration(350).delay(120) : undefined}
    >
      <PressableScale
        style={[
          styles.milestoneCard,
          {
            backgroundColor: isDark ? '#1F1B3A' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
          },
        ]}
        onPress={handleOpenDates}
      >
        <View
          style={[
            styles.milestoneIconBox,
            {
              backgroundColor: isDark ? 'rgba(157, 146, 240, 0.16)' : '#EFECFC',
            },
          ]}
        >
          <Ionicons name="sparkles" size={20} color={themeTokens.primary} />
        </View>

        <View style={styles.milestoneContent}>
          <Text style={[styles.milestoneLabel, { color: isDark ? '#AAA5B8' : '#7E7699' }]}>
            PRÓXIMO MOMENTO
          </Text>
          <Text
            style={[styles.milestoneTitle, { color: isDark ? '#F3F1FB' : '#1E1A33' }]}
            numberOfLines={2}
          >
            {nextMilestone.title}
          </Text>
        </View>

        <View
          style={[
            styles.milestoneChip,
            {
              backgroundColor: isDark ? 'rgba(157, 146, 240, 0.20)' : '#F3E8FF',
            },
          ]}
        >
          <Text style={[styles.milestoneChipText, { color: isDark ? '#C4B5FD' : '#7C3AED' }]}>
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
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
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
    paddingRight: 8,
  },
  milestoneLabel: {
    fontSize: 10,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  milestoneTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    lineHeight: 18,
  },
  milestoneChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  milestoneChipText: {
    fontSize: 12,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
  },
});
