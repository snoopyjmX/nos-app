import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CoupleProvider } from '../context/CoupleContext';

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    // Se a sessão expirou ou o usuário deslogou e não está no grupo (auth), redireciona compulsoriamente
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Se já possui sessão e está nas telas de login/cadastro, redireciona para a raiz
      router.replace('/');
    }
  }, [session, isLoading, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CoupleProvider>
        <RootLayoutNav />
      </CoupleProvider>
    </AuthProvider>
  );
}