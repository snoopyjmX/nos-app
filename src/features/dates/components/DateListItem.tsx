import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, SlideOutRight } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui';
import { SpecialDate } from '../types';
import { getCategoryMeta, formatListItemDateTime } from '../utils/formatting';
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
  const { colors, typography, radii, shadows } = useTheme();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const meta = getCategoryMeta(item.category);
  const isPast = new Date(item.event_date).getTime() < Date.now();

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
    >
      <PressableScale
        style={[
          styles.listItemCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.md,
            ...shadows.soft,
          }
        ]}
        onPress={() => onEdit(item)}
      >
        <View style={[styles.listIconBox, { backgroundColor: meta.bg }]}>
          <Feather name={meta.icon as any} size={22} color={meta.color} />
        </View>

        <View style={styles.listContent}>
          <Text style={[styles.listTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.listMetaRow}>
            <Text style={[styles.listCategory, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>{meta.label}</Text>
            <View style={[styles.listDot, { backgroundColor: colors.border }]} />
            <Text style={[styles.listDate, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }, isPast && { color: colors.danger }]}>
              {formatListItemDateTime(item.event_date)}
            </Text>
          </View>
        </View>

        <PressableScale
          style={[
            styles.deleteButton,
            { backgroundColor: colors.primarySoft },
            confirmDelete && { backgroundColor: colors.danger },
          ]}
          onPress={handleDeletePress}
          hitSlop={10}
        >
          <Feather
            name="trash-2"
            size={16}
            color={confirmDelete ? '#FFFFFF' : colors.danger}
          />
        </PressableScale>
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  listItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  listIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  listContent: {
    flex: 1,
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listCategory: {
    fontSize: 13,
  },
  listDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
  },
  listDate: {
    fontSize: 13,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
