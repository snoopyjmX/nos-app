import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../context/CoupleContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { coupleId, clearCouple } = useCouple();

  const handleSignOut = () => {
    Alert.alert('Sair da conta', 'Tem certeza de que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          clearCouple();
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const displayName = user?.user_metadata?.display_name || 'Você';
  const email = user?.email || '';

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color="#8E7CE8" />
        </View>
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userEmail}>{email}</Text>

        <View style={styles.coupleBadge}>
          <Ionicons name="heart" size={16} color="#8E7CE8" />
          <Text style={styles.coupleBadgeText}>Casal Conectado</Text>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#FF5A5F" />
          <Text style={styles.signOutText}>Terminar Sessão</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 100,
  },
  profileCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#16151E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(142, 124, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 124, 232, 0.25)',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#16151E',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#686578',
    marginBottom: 16,
  },
  coupleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(142, 124, 232, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
    marginBottom: 28,
  },
  coupleBadgeText: {
    fontSize: 13,
    color: '#8E7CE8',
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 90, 95, 0.08)',
    gap: 8,
  },
  signOutText: {
    fontSize: 15,
    color: '#FF5A5F',
    fontWeight: '600',
  },
});
