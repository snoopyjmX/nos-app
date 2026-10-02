import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { IconButton } from '@/components/ui';
import { useTheme } from '@/theme';

interface MessagesHeaderProps {
  insets: any;
  onGoBack: () => void;
}

export function MessagesHeader({ insets, onGoBack }: MessagesHeaderProps) {
  const { colors, typography, shadows } = useTheme();

  return (
    <View 
      style={[
        styles.headerContainer, 
        { 
          paddingTop: insets.top,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          ...shadows.soft,
        }
      ]}
    >
      <View style={styles.headerContentRow}>
        <IconButton 
          icon="arrow-left" 
          variant="secondary" 
          onPress={onGoBack} 
          accessibilityLabel="Voltar"
        />

        <View style={styles.headerBrandWrapper}>
          <Text style={[styles.headerBrandTitle, { color: colors.primary, fontFamily: typography.fontFamily.bold }]}>nós.</Text>
          <Text
            style={[styles.headerCoupleSubtitle, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}
            numberOfLines={1}
          >
            Bilhetes carinhosos do casal
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 12,
    gap: 12,
  },
  headerBrandWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  headerBrandTitle: {
    fontSize: 27,
    letterSpacing: -0.8,
  },
  headerCoupleSubtitle: {
    fontSize: 13,
    marginTop: -2,
  },
});
