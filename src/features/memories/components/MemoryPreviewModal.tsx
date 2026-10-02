import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LiquidGlassView } from '@/design/ui/LiquidGlassView';
import { GlassSurface } from '@/design/ui/GlassSurface';
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
  return (
    <Modal
      visible={!!previewMemory}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <LiquidGlassView variant="hero" intensity={80} style={styles.previewOverlay}>
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
                style={styles.previewImage}
                contentFit="cover"
                transition={300}
                cachePolicy="memory-disk"
                placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              />

              <View style={styles.previewTopActionsRow}>
                <TouchableOpacity
                  style={styles.previewActionCircle}
                  onPress={() => onDelete(previewMemory)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel="Remover memória"
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color="#F58FA8" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.previewActionCircle}
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel="Fechar visualização"
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.previewInfoWrapper}>
                <GlassSurface
                  intensity={Platform.OS === 'ios' ? 70 : 90}
                  tint="systemThinMaterialDark"
                  style={styles.previewInfoGlass}
                >
                  <Text style={styles.previewTitle}>{previewMemory.title}</Text>
                  <View style={styles.previewMetaPills}>
                    <View style={styles.previewPill}>
                      <Ionicons name="calendar-outline" size={13} color="#FFFFFF" />
                      <Text style={styles.previewDate}>
                        {formatFullDatePTBR(previewMemory.memory_date)}
                      </Text>
                    </View>
                    <View style={styles.previewPill}>
                      <Ionicons name="sparkles" size={12} color="#DDD6FE" />
                      <Text style={styles.previewSignature}>
                        Eternizado por {previewMemory.created_by === user?.id ? 'Você' : (profileMap.get(previewMemory.created_by || '')?.name || 'Parceiro(a)')}
                      </Text>
                    </View>
                  </View>
                  {previewMemory.created_at ? (
                    <Text style={styles.previewSavedAt}>
                      Salvo em {formatSavedAtDateTime(previewMemory.created_at)}
                    </Text>
                  ) : null}
                </GlassSurface>
              </View>
            </View>
          </View>
        )}
      </LiquidGlassView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  previewOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  previewTopActionsRow: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  previewActionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  previewCard: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  previewImageContainer: {
    width: '100%',
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#1C1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  previewImage: {
    width: '100%',
    height: 540,
  },
  previewInfoWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  previewInfoGlass: {
    borderRadius: 24, overflow: "hidden",
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  previewDate: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  previewMetaPills: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  previewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewSignature: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DDD6FE',
  },
  previewSavedAt: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 8,
  },
});
