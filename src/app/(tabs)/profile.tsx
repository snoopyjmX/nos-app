import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, RefreshControl } from 'react-native';
import { showAlert } from '@/lib/core/dialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDockInset } from '@/lib/hooks/useDockInset';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';

import { ScreenTitleBar, Skeleton } from '@/components/ui';
import { useAuth } from '@/lib/context/AuthContext';
import { useCouple } from '@/lib/context/CoupleContext';
import { useAppTheme } from '@/lib/context/ThemeContext';
import { useTheme } from '@/theme';
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
  const { colors, radii, spacing } = useTheme();
  const { mode, setMode } = useAppTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { coupleId, clearCouple, updateAnniversaryDate } = useCouple();
  const insets = useSafeAreaInsets();
  const dockInset = useDockInset();

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
        showAlert(
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
      showAlert('Avatar atualizado!', 'Sua nova foto já está visível para vocês dois.');
    } catch (err: any) {
      showAlert('Não conseguimos salvar sua foto agora', 'Tenta de novo? ' + (err.message || ''));
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
      updateAnniversaryDate(isoDate);
      setIsDateModalVisible(false);
      await loadProfileData();

      showAlert(
        'Data atualizada!',
        `A data de início do relacionamento foi ajustada para ${day}/${month}/${year}.`
      );
    } catch (err: any) {
      showAlert('Erro ao atualizar data', err.message || 'Tente novamente.');
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

    showAlert('Encerrar sessão', 'Tem certeza de que deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Encerrar', style: 'destructive', onPress: doSignOut },
    ]);
  };

  const myName = myProfile?.display_name || user?.user_metadata?.display_name || 'Você';
  const partnerName = partnerProfile?.display_name || 'Meu Amor';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: dockInset,
          paddingHorizontal: spacing[20],
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <ScreenTitleBar title="Ajustes" subtitle="Configurações e nós dois" topInset={insets.top} />

        {loading ? (
          <View style={{ gap: spacing[16] }}>
            <Skeleton width="100%" height={240} borderRadius={radii.lg} />
            <Skeleton width="100%" height={160} borderRadius={radii.md} />
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
            />

            <RelationshipSection
              anniversaryDate={anniversaryDate}
              coupleCode={coupleCode}
              onOpenDateModal={handleOpenDateModal}
            />

            <ThemeSection
              mode={mode}
              setMode={setMode}
            />

            <SecuritySection />

            <AccountActions
              onSignOut={handleSignOut}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
