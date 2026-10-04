import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { supabase } from '@/lib/core/supabase';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  // 1. Em emuladores/simuladores ou no Expo Go no Android (SDK 53+), não inicializa push para evitar erros nativos
  if (!Device.isDevice || (isExpoGo && Platform.OS === 'android')) {
    return null;
  }

  // 2. Se não houver projectId do EAS configurado, getExpoPushTokenAsync falhará no bare workflow / Expo Go
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId ??
    process.env.EXPO_PUBLIC_PROJECT_ID;

  if (!projectId) {
    return null;
  }

  try {
    const Notifications = await import('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8E7CE8',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenResponse?.data;

    // Salva o token no perfil do usuário no Supabase
    if (token && userId) {
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);
    }

    return token;
  } catch {
    // Silencia qualquer exceção sem emitir warnings
    return null;
  }
}
