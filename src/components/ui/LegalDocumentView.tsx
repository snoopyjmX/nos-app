import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components/ui/IconButton';
import { useTheme } from '@/theme';

interface LegalDocumentViewProps {
  title: string;
  text: string;
}

export function LegalDocumentView({ title, text }: LegalDocumentViewProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography } = useTheme();

  const renderText = () => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('## ')) {
        return (
          <Text key={index} accessibilityRole="header" style={[styles.h2, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
            {line.replace('## ', '')}
          </Text>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <Text key={index} accessibilityRole="header" style={[styles.h1, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
            {line.replace('# ', '')}
          </Text>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <Text key={index} style={[styles.listItem, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
            • {line.replace('- ', '')}
          </Text>
        );
      }
      if (line.trim() === '') {
        return <View key={index} style={styles.spacer} />;
      }
      return (
        <Text key={index} style={[styles.paragraph, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
          {line}
        </Text>
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          variant="ghost" 
          onPress={() => router.back()} 
          accessibilityLabel="Voltar"
        />
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: typography.fontFamily.bold }]}>
          {title}
        </Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        {renderText()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 16 },
  headerTitle: { fontSize: 18 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 16 },
  h1: { fontSize: 24, marginBottom: 24, marginTop: 12 },
  h2: { fontSize: 18, marginBottom: 12, marginTop: 24 },
  paragraph: { fontSize: 16, lineHeight: 24, marginBottom: 12 },
  listItem: { fontSize: 16, lineHeight: 24, marginBottom: 8, paddingLeft: 8 },
  spacer: { height: 12 },
});
