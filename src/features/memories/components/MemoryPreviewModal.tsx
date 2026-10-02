import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { MemoryItem, MemberProfile } from '../types';
import { formatFullDatePTBR, formatSavedAtDateTime } from '../utils/formatting';

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
  const { colors, typography, radii, shadows } = useTheme();

  return (
    <Modal
      visible={!!previewMemory}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.previewOverlay, { backgroundColor: colors.overlayDark }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        {previewMemory && (
          <View style={styles.previewCard} pointerEvents="box-none">
            <View style={styles.previewImageContainer}>
              <Image
                source={{ uri: previewMemory.displayUrl || previewMemory.image_url }}
                style={[styles.previewImage, { borderRadius: radii.lg }]}
                contentFit="cover"
                transition={300}
                cachePolicy="memory-disk"
                placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              />

              <View style={styles.previewTopActionsRow}>
                <TouchableOpacity
                  style={[styles.previewActionCircle, { backgroundColor: colors.overlayMedium }]}
                  onPress={() => onDelete(previewMemory)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel="Remover memória"
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={18} color={colors.danger} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.previewActionCircle, { backgroundColor: colors.overlayMedium }]}
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel="Fechar visualização"
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.previewInfoWrapper}>
                <View 
                  style={[
                    styles.previewInfoGlass, 
                    { 
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      borderRadius: radii.md,
                    }
                  ]}
                >
                  <Text style={[styles.previewTitle, { fontFamily: typography.fontFamily.bold }]}>{previewMemory.title}</Text>
                  
                  <View style={styles.previewMetaPills}>
                    <View style={styles.previewPill}>
                      <Feather name="calendar" size={12} color="#FFFFFF" />
                      <Text style={[styles.previewDate, { fontFamily: typography.fontFamily.regular }]}>
                        {formatFullDatePTBR(previewMemory.memory_date)}
                      </Text>
                    </View>
                    <View style={styles.previewPill}>
                      <Feather name="star" size={11} color={colors.primary} />
                      <Text style={[styles.previewSignature, { fontFamily: typography.fontFamily.regular }]}>
                        Eternizado por {previewMemory.created_by === user?.id ? 'Você' : (profileMap.get(previewMemory.created_by || '')?.name || 'Parceiro(a)')}
                      </Text>
                    </View>
                  </View>
                  {previewMemory.created_at ? (
                    <Text style={[styles.previewSavedAt, { fontFamily: typography.fontFamily.regular }]}>
                      Salvo em {formatSavedAtDateTime(previewMemory.created_at)}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  previewOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCard: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewImageContainer: {
    width: '100%',
    height: '85%',
    maxWidth: 500,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111',
  },
  previewTopActionsRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  previewActionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfoWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  previewInfoGlass: {
    padding: 20,
  },
  previewTitle: {
    fontSize: 24,
    
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  previewDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
    lineHeight: 22,
  },
  previewMetaPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  previewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  previewDate: {
    
    fontSize: 13,
  },
  previewSignature: {
    
    fontSize: 12,
  },
  previewSavedAt: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
});
