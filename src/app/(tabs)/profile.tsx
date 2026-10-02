import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';

import { AtmosphereBackground } from '@/design/ui/AtmosphereBackground';
import { GlassSurface } from '@/design/ui/GlassSurface';
import { AppHeader } from '@/design/components/AppHeader';

import { useAuth } from '@/lib/context/AuthContext';
import { useCouple } from '@/lib/context/CoupleContext';
import { useAppTheme } from '@/lib/context/ThemeContext';
import { getThemeTokens } from '@/design/tokens/theme';
import { useTabBarHeight } from '@/lib/hooks/useTabBarHeight';
import { supabase } from '@/lib/core/supabase';
import { normalizeAndCompressImage } from '@/lib/core/imageManipulation';

import { useProfile } from '@/features/profile/api/useProfile';
import { ProfileHero } from '@/features/profile/components/ProfileHero';
import { RelationshipSection } from '@/features/profile/components/RelationshipSection';
import { ThemeSection } from '@/features/profile/components/ThemeSection';
import { SecuritySection } from '@/features/profile/components/SecuritySection';
import { AccountActions } from '@/features/profile/components/AccountActions';
import { AnniversaryModal } from '@/features/profile/components/AnniversaryModal';

export default function ProfileScreen() {
  const { isDark, mode, setMode } = useAppTheme();
  const themeTokens = getThemeTokens(isDark);
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { coupleId, clearCouple } = useCouple();
  const insets = useSafeAreaInsets();
  const { paddingBottom: tabBarPaddingBottom } = useTabBarHeight();

  const {
    myProfile,
    partnerProfile,
    anniversaryDate,
    setAnniversaryDate,
    coupleCode,
    loading,
    refreshing,
    onRefresh,
    loadProfileData,
  } = useProfile(coupleId, user);

  // Estados locais da tela
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [savingDate, setSavingDate] = useState(false);

  const handlePickAvatar = async () => {
    if (!user || uploadingAvatar) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para acessar sua galeria de fotos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setUploadingAvatar(true);

      const manipulatedUri = await normalizeAndCompressImage(asset.uri, 512, 0.8, true, asset.width, asset.height);

      const response = await fetch(manipulatedUri);
      const fileBody = await response.blob();

      const fileName = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileBody, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: fileName,
          display_name: myProfile?.display_name || user.user_metadata?.display_name || 'Você',
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        throw updateError;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadProfileData();
      Alert.alert('Avatar atualizado!', 'Sua nova foto já está visível para vocês dois.');
    } catch (err: any) {
      Alert.alert('Não conseguimos salvar sua foto agora', 'Tenta de novo? ' + (err.message || ''));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveAnniversary = async () => {
    if (!coupleId) return;

    setSavingDate(true);
    try {
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, '0');
      const day = String(tempDate.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;

      const { error } = await supabase
        .from('couples')
        .update({ anniversary_date: isoDate })
        .eq('id', coupleId);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAnniversaryDate(isoDate);
      setIsDateModalVisible(false);
      await loadProfileData();

      Alert.alert(
        'Data atualizada!',
        `A data de início do relacionamento foi ajustada para ${day}/${month}/${year}.`
      );
    } catch (err: any) {
      Alert.alert('Erro ao atualizar data', err.message || 'Tente novamente.');
    } finally {
      setSavingDate(false);
    }
  };

  const handleOpenDateModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (anniversaryDate) {
      const parts = anniversaryDate.split('-');
      if (parts.length === 3) {
        setTempDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
      } else {
        setTempDate(new Date(anniversaryDate));
      }
    }
    setIsDateModalVisible(true);
  };

  const onDateChange = (_event: DateTimePickerChangeEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false);
    }
    if (selected) {
      setTempDate(selected);
    }
  };

  const handleSignOut = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const doSignOut = async () => {
      clearCouple();
      await signOut();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza de que deseja sair da sua conta?')) {
        doSignOut();
      }
    } else {
      Alert.alert('Encerrar sessão', 'Tem certeza de que deseja sair da sua conta?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Encerrar', style: 'destructive', onPress: doSignOut },
      ]);
    }
  };

  const myName = myProfile?.display_name || user?.user_metadata?.display_name || 'Você';
  const partnerName = partnerProfile?.display_name || 'Meu Amor';

  return (
    <View style={[styles.container, { backgroundColor: themeTokens.background }]}>
      <AtmosphereBackground />

      <View style={[styles.blurredHeaderContainer, { paddingTop: insets.top }]}>
        <GlassSurface
          intensity={Platform.OS === 'ios' ? 80 : 100}
          tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? 'rgba(15, 13, 24, 0.65)' : 'rgba(248, 249, 252, 0.70)',
              borderBottomWidth: 1,
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.60)',
            },
          ]}
        />
        <View style={styles.headerInnerRow}>
          <AppHeader
            sectionTitle="perfil"
            coupleSubtitle="Configurações e nós dois"
            containerStyle={{ marginBottom: 0, paddingTop: 6, paddingBottom: 6 }}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + (Platform.OS === 'ios' ? 98 : 92),
          paddingBottom: tabBarPaddingBottom,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeTokens.primary}
            colors={[themeTokens.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.skeletonContainer}>
            <View
              style={[
                styles.skeletonHeroCard,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 111, 224, 0.08)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(124, 111, 224, 0.15)',
                },
              ]}
            />
            <View
              style={[
                styles.skeletonCard,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 111, 224, 0.08)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(124, 111, 224, 0.15)',
                },
              ]}
            />
          </View>
        ) : (
          <>
            <ProfileHero
              myProfile={myProfile}
              partnerProfile={partnerProfile}
              myName={myName}
              partnerName={partnerName}
              uploadingAvatar={uploadingAvatar}
              onPickAvatar={handlePickAvatar}
              isDark={isDark}
              themeTokens={themeTokens}
            />

            <RelationshipSection
              anniversaryDate={anniversaryDate}
              coupleCode={coupleCode}
              onOpenDateModal={handleOpenDateModal}
              isDark={isDark}
              themeTokens={themeTokens}
            />

            <ThemeSection
              mode={mode}
              setMode={setMode}
              isDark={isDark}
              themeTokens={themeTokens}
            />

            <SecuritySection
              isDark={isDark}
              themeTokens={themeTokens}
            />

            <AccountActions
              onSignOut={handleSignOut}
              isDark={isDark}
              themeTokens={themeTokens}
            />
          </>
        )}
      </ScrollView>

      <AnniversaryModal
        visible={isDateModalVisible}
        tempDate={tempDate}
        savingDate={savingDate}
        showAndroidPicker={showAndroidPicker}
        setShowAndroidPicker={setShowAndroidPicker}
        onDateChange={onDateChange}
        onSave={handleSaveAnniversary}
        onClose={() => setIsDateModalVisible(false)}
        isDark={isDark}
        themeTokens={themeTokens}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurredHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    overflow: 'hidden',
  },
  headerInnerRow: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  skeletonContainer: {
    paddingTop: 10,
    gap: 18,
  },
  skeletonHeroCard: {
    width: '100%',
    height: 180,
    borderRadius: 28,
    borderWidth: 1,
  },
  skeletonCard: {
    width: '100%',
    height: 90,
    borderRadius: 20,
    borderWidth: 1,
  },
});
