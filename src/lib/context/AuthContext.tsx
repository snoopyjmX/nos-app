import { logger } from '@/lib/core/logger';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { supabase } from '@/lib/core/supabase';
import { clearHomeDataCache } from '@/features/home/api/useHomeData';
import { clearMemoriesCache } from '@/features/memories/api/useMemories';
import { clearDatesCache } from '@/features/dates/api/useDates';
import { clearProfileCache } from '@/features/profile/api/useProfile';
import { clearSignedUrlCache } from '@/features/memories/utils/storage';

interface AuthContextData {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Busca a sessão persistida ao abrir o app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // 2. Escuta mudanças na autenticação (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (_event === 'PASSWORD_RECOVERY') {
          router.replace('/(auth)/reset-password');
        }
        setSession(currentSession);
        setIsLoading(false);
        if (currentSession?.user) {
          import('@/lib/core/pushNotifications')
            .then(({ registerForPushNotificationsAsync }) => {
              registerForPushNotificationsAsync(currentSession.user.id).catch(() => {});
            })
            .catch(() => {});
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      logger.warn('Erro ao encerrar sessão no Supabase:', err);
    } finally {
      // 1. Limpa explicitamente a sessão e o usuário do estado
      setSession(null);
      setIsLoading(false);

      // 2. Invalida caches de módulo em memória (evita vazamento de dados entre contas)
      clearHomeDataCache();
      clearMemoriesCache();
      clearDatesCache();
      clearProfileCache();
      clearSignedUrlCache();

      // 3. Limpa chaves residuais de autenticação do AsyncStorage (restringido ao Supabase)
      try {
        const keys = await AsyncStorage.getAllKeys();
        const authKeys = keys.filter(
          (k) => k.startsWith('sb-') || k.startsWith('supabase.')
        );
        if (authKeys.length > 0) {
          await AsyncStorage.multiRemove(authKeys);
        }
      } catch (storageErr) {
        logger.warn('Erro ao limpar chaves do AsyncStorage:', storageErr);
      }

      // 4. Força a navegação imediata para a tela de login
      try {
        router.replace('/(auth)/login');
      } catch (navErr) {
        logger.warn('Erro ao redirecionar após logout:', navErr);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}