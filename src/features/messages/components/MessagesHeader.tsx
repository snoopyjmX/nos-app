import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { IconButton } from '@/components/ui';
import { useTheme } from '@/theme';

interface MessagesHeaderProps {
  insets: any;
  onGoBack: () => void;
  partnerName?: string;
  presenceText?: string;
}

export function MessagesHeader({ insets, onGoBack, partnerName, presenceText }: MessagesHeaderProps) {
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
          <Text style={[styles.headerBrandTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
            {partnerName || 'nós.'}
          </Text>
          <Text
            style={[styles.headerCoupleSubtitle, { color: colors.primary, fontFamily: typography.fontFamily.medium }]}
            numberOfLines={1}
          >
            {presenceText || 'Bilhetes carinhosos'}
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
    fontSize: 20,
    letterSpacing: -0.4,
  },
  headerCoupleSubtitle: {
    fontSize: 13,
    marginTop: -2,
  },
});
