import React, { createElement } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/theme';

interface WebDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time';
}

export function WebDatePicker({ value, onChange, mode = 'date' }: WebDatePickerProps) {
  const { colors, typography } = useTheme();

  if (Platform.OS !== 'web') return null;

  const handleChange = (e: any) => {
    if (!e?.target?.value) return;
    
    if (mode === 'time') {
      const [hours, minutes] = e.target.value.split(':');
      const newDate = new Date(value);
      newDate.setHours(parseInt(hours, 10));
      newDate.setMinutes(parseInt(minutes, 10));
      onChange(newDate);
    } else {
      const [year, month, day] = e.target.value.split('-');
      const newDate = new Date(value);
      newDate.setFullYear(parseInt(year, 10));
      newDate.setMonth(parseInt(month, 10) - 1);
      newDate.setDate(parseInt(day, 10));
      onChange(newDate);
    }
  };

  const getFormattedValue = () => {
    if (mode === 'time') {
      return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
    }
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <View style={styles.container}>
      {createElement('input', {
        type: mode,
        value: getFormattedValue(),
        onChange: handleChange,
        style: {
          padding: '10px 16px',
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
          color: colors.textPrimary,
          fontSize: '16px',
          fontFamily: typography.fontFamily.semiBold,
          outline: 'none',
          width: '100%',
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
});
