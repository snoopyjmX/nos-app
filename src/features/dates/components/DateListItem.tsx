import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown, SlideOutRight } from 'react-native-reanimated';
import { PressableScale } from '@/design/ui/PressableScale';
import { SpecialDate } from '../types';
import { getCategoryMeta, formatListItemDateTime } from '../utils/formatting';
import { useAppTheme } from '@/lib/context/ThemeContext';
import { getThemeTokens } from '@/design/tokens/theme';

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
  const { isDark } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const styles = useMemo(() => getStyles(themeTokens, isDark), [themeTokens, isDark]);

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
        style={styles.listItemCard}
        onPress={() => onEdit(item)}
      >
        <View style={[styles.listIconBox, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon as any} size={22} color={meta.color} />
        </View>

        <View style={styles.listContent}>
          <Text style={styles.listTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.listMetaRow}>
            <Text style={styles.listCategory}>{meta.label}</Text>
            <View style={styles.listDot} />
            <Text style={[styles.listDate, isPast && styles.pastListDate]}>
              {formatListItemDateTime(item.event_date)}
            </Text>
          </View>
        </View>

        <PressableScale
          style={[styles.deleteButton, confirmDelete && styles.deleteButtonConfirm]}
          onPress={handleDeletePress}
          hitSlop={10}
        >
          <Ionicons
            name={confirmDelete ? 'trash' : 'trash-outline'}
            size={16}
            color={confirmDelete ? '#FFFFFF' : '#F58FA8'}
          />
        </PressableScale>
      </PressableScale>
    </Animated.View>
  );
});

const getStyles = (themeTokens: any, isDark: boolean) => StyleSheet.create({
  listItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.12)',
    padding: 16,
    borderRadius: 24,
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
    paddingRight: 8,
  },
  listTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    color: themeTokens.textPrimary,
    marginBottom: 4,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  listCategory: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
    color: themeTokens.textSecondary,
  },
  listDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: themeTokens.textMuted,
    marginHorizontal: 6,
  },
  listDate: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
    color: themeTokens.primary,
  },
  pastListDate: {
    color: themeTokens.textSecondary,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? 'rgba(245, 143, 168, 0.12)' : 'rgba(245, 143, 168, 0.1)',
  },
  deleteButtonConfirm: {
    backgroundColor: '#F58FA8',
  },
});
