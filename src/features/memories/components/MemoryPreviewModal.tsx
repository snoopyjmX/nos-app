import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/ui';
import { LiquidGlassView } from '@/components/ui/LiquidGlassView';
import { useTheme } from '@/theme';
import { MemoryItem, MemberProfile } from '../types';
import { formatFullDatePTBR, formatSavedAtDateTime } from '../utils/formatting';

const ACTION_SIZE = 48;

interface MemoryPreviewModalProps {
  previewMemory: MemoryItem | null;
  onClose: () => void;
  onDelete: (item: MemoryItem) => void;
  user: any;
  profileMap: Map<string, MemberProfile>;
}

export function MemoryPreviewModal({
  previewMemory,
  onClose,
  onDelete,
  user,
  profileMap,
}: MemoryPreviewModalProps) {
  const { colors, typography, radii, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const authorName = previewMemory
    ? previewMemory.created_by === user?.id
      ? 'Você'
      : profileMap.get(previewMemory.created_by || '')?.name || 'Parceiro(a)'
    : '';

  return (
    <Modal visible={!!previewMemory} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.overlayDark }]}>
        {/* Desfoque suave da interface atrás da foto */}
        <LiquidGlassView variant="scrim" borderRadius={0} style={StyleSheet.absoluteFill} />

        {previewMemory && (
          <>
            {/* Foto imersiva, em tela cheia, sem cortes */}
            <Image
              source={{ uri: previewMemory.displayUrl || previewMemory.image_url }}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
              transition={300}
              cachePolicy="memory-disk"
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              accessibilityLabel={`Foto da memória ${previewMemory.title}`}
            />

            <View
              style={[
                styles.actionsRow,
                { top: insets.top + spacing[12], paddingHorizontal: spacing[16] },
              ]}
              pointerEvents="box-none"
            >
              <PressableScale
                onPress={() => onDelete(previewMemory)}
                accessibilityRole="button"
                accessibilityLabel="Remover memória"
              >
                <LiquidGlassView variant="control" tintColor={colors.photoBadge} borderRadius={radii.pill} style={styles.action}>
                  <Feather name="trash-2" size={18} color={colors.white} />
                </LiquidGlassView>
              </PressableScale>

              <PressableScale
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Fechar visualização"
              >
                <LiquidGlassView variant="control" tintColor={colors.photoBadge} borderRadius={radii.pill} style={styles.action}>
                  <Feather name="x" size={22} color={colors.white} />
                </LiquidGlassView>
              </PressableScale>
            </View>

            <View
              style={[styles.infoWrapper, { bottom: insets.bottom + spacing[16], paddingHorizontal: spacing[16] }]}
              pointerEvents="box-none"
            >
              <LiquidGlassView
                variant="card"
                tintColor={colors.photoInfo}
                borderRadius={radii.md}
                style={[styles.info, { padding: spacing[20], gap: spacing[8] }]}
              >
                <Text
                  accessibilityRole="header"
                  style={[styles.title, { color: colors.white, ...typography.font.black }]}
                >
                  {previewMemory.title}
                </Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Feather name="calendar" size={13} color={colors.white} />
                    <Text style={[styles.meta, { color: colors.white, ...typography.font.medium }]}>
                      {formatFullDatePTBR(previewMemory.memory_date)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather name="star" size={12} color={colors.white} />
                    <Text style={[styles.meta, { color: colors.white, ...typography.font.medium }]}>
                      Eternizado por {authorName}
                    </Text>
                  </View>
                </View>
                {previewMemory.created_at ? (
                  <Text style={[styles.savedAt, { color: colors.white, ...typography.font.regular }]}>
                    Salvo em {formatSavedAtDateTime(previewMemory.created_at)}
                  </Text>
                ) : null}
              </LiquidGlassView>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  actionsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  action: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  info: {
    width: '100%',
    maxWidth: 520,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontSize: 13,
  },
  savedAt: {
    fontSize: 12,
  },
});
