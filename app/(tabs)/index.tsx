import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const [partnerName, setPartnerName] = useState<string>('Meu Amor');
  const [userName, setUserName] = useState<string>('Você');

  useEffect(() => {
    async function loadCoupleDetails() {
      if (!user || !coupleId) return;

      const currentUserName =
        user.user_metadata?.display_name || user.email?.split('@')[0] || 'Você';
      setUserName(currentUserName);

      try {
        // Busca os membros do casal para encontrar o parceiro
        const { data: members } = await supabase
          .from('couple_members')
          .select('user_id')
          .eq('couple_id', coupleId);

        const otherMember = members?.find((m) => m.user_id !== user.id);
        if (otherMember) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', otherMember.user_id)
            .maybeSingle();

          if (profile?.display_name) {
            setPartnerName(profile.display_name);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar detalhes do casal:', err);
      }
    }

    loadCoupleDetails();
  }, [user, coupleId]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho Superior */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.appIconBadge}>
              <Ionicons name="infinite" size={24} color="#8E7CE8" />
            </View>
            <View style={styles.titleWrapper}>
              <Text style={styles.brandTitle}>nós</Text>
              <Text style={styles.coupleNames}>
                {userName} & {partnerName}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.notificationButton} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={20} color="#16151E" />
          </TouchableOpacity>
        </View>

        {/* Card Principal: Nossa Jornada */}
        <View style={styles.heroGlassCard}>
          <View style={styles.imagePlaceholder}>
            <Ionicons name="heart" size={48} color="#8E7CE8" />
            <Text style={styles.imagePlaceholderText}>O nosso espaço a dois</Text>
          </View>

          <View style={styles.journeyContent}>
            <Text style={styles.journeyLabel}>NOSSA JORNADA</Text>
            <View style={styles.journeyPill}>
              <Text style={styles.journeyDaysText}>Juntos construindo memórias</Text>
            </View>
          </View>
        </View>

        {/* Seção: Memória Recente */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionSubtitle}>MEMÓRIA RECENTE</Text>
        </View>

        <TouchableOpacity style={styles.memoryCard} activeOpacity={0.85}>
          <View style={styles.memoryThumbnail}>
            <Ionicons name="images-outline" size={22} color="#8E7CE8" />
          </View>
          <View style={styles.memoryInfo}>
            <Text style={styles.memoryDate}>Hoje</Text>
            <Text style={styles.memoryTitle}>Primeiro dia no NÓS</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#686578" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 110, // Espaço reservado para o dock flutuante
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.25)',
  },
  titleWrapper: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8E7CE8',
    letterSpacing: 1,
  },
  coupleNames: {
    fontSize: 14,
    color: '#686578',
    fontWeight: '500',
    marginTop: 1,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  heroGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 28,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 24,
  },
  imagePlaceholder: {
    height: 220,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 124, 232, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.15)',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#686578',
    marginTop: 8,
    fontWeight: '500',
  },
  journeyContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  journeyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#686578',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  journeyPill: {
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
  },
  journeyDaysText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8E7CE8',
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#686578',
    letterSpacing: 1.2,
  },
  memoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  memoryThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 124, 232, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  memoryInfo: {
    flex: 1,
  },
  memoryDate: {
    fontSize: 12,
    color: '#686578',
    marginBottom: 2,
  },
  memoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16151E',
  },
});
