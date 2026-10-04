import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, SlideOutRight } from 'react-native-reanimated';
import { AnimatedIcon, PressableScale } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { SpecialDate } from '../types';
import { getCategoryMeta, formatEventBadge, formatLongDatePTBR } from '../utils/formatting';
import { useTheme } from '@/theme';

interface DateListItemProps {
  item: SpecialDate;
  index: number;
  reducedMotion?: boolean;
  onEdit: (item: SpecialDate) => void;
  onDelete: (item: SpecialDate) => void;
}

export const DateListItem = React.memo(function DateListItem({
  item,
  index,
  reducedMotion,
  onEdit,
  onDelete,
}: DateListItemProps) {
  const { colors, typography, radii, spacing } = useTheme();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pulse, setPulse] = useState(0);
  const meta = getCategoryMeta(item.category);
  const badge = formatEventBadge(item.event_date);
  const longDate = formatLongDatePTBR(item.event_date);

  const handleDeletePress = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    } else {
      onDelete(item);
    }
  };

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(300).delay(index * 50)}
      exiting={reducedMotion ? undefined : SlideOutRight.duration(300)}
      style={{ marginBottom: spacing[12] }}
    >
      <PressableScale
        onPress={() => onEdit(item)}
        onPressIn={() => setPulse((value) => value + 1)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${meta.label}, ${badge}, ${longDate}`}
        accessibilityHint="Toque para editar esta data"
      >
        <LiquidGlassView variant="card" readable borderRadius={radii.md} style={[styles.card, { gap: spacing[12], padding: spacing[16] }]}>
          <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
            <AnimatedIcon name={meta.icon} size={22} color={meta.color} pulseKey={pulse} />
          </View>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.textPrimary, ...typography.font.bold }]}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.badgeText, { color: colors.primaryText, ...typography.font.medium }]}>{badge}</Text>
              </View>
            </View>
            <Text style={[styles.date, { color: colors.textSecondary, ...typography.font.regular }]}>{longDate}</Text>
            <View style={styles.categoryRow}>
              <Feather name={meta.icon} size={12} color={colors.textSecondary} />
              <Text style={[styles.category, { color: colors.textSecondary, ...typography.font.medium }]}>
                {meta.label}
              </Text>
            </View>
          </View>

          <PressableScale
            style={[styles.deleteButton, { backgroundColor: confirmDelete ? colors.danger : colors.primarySoft }]}
            onPress={handleDeletePress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={confirmDelete ? `Confirmar exclusão de ${item.title}` : `Excluir ${item.title}`}
            accessibilityHint={confirmDelete ? undefined : 'Toque duas vezes para excluir'}
          >
            <Feather name="trash-2" size={16} color={confirmDelete ? colors.white : colors.danger} />
          </PressableScale>
        </LiquidGlassView>
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 8,
    rowGap: 4,
  },
  title: {
    fontSize: 16,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
  },
  date: {
    fontSize: 13,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  category: {
    fontSize: 12,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
