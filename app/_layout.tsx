import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CoupleProvider } from '../context/CoupleContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NavbarProvider } from '../context/NavbarContext';

// Desativa todos os banners amarelos e toasts de aviso na tela do app
LogBox.ignoreAllLogs(true);

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    // Se a sessão expirou ou o usuário deslogou e não está no grupo (auth), redireciona compulsoriamente
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      // Se já possui sessão e está nas telas de login/cadastro, redireciona para a raiz
      router.replace('/');
    }
  }, [session, isLoading, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <CoupleProvider>
            <NavbarProvider>
              <RootLayoutNav />
            </NavbarProvider>
          </CoupleProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}