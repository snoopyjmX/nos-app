import React, { useEffect } from 'react';
import { LogBox, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useSegments, ErrorBoundaryProps } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '@/lib/context/AuthContext';
import { CoupleProvider } from '@/lib/context/CoupleContext';
import { ThemeProvider } from '@/lib/context/ThemeContext';
import { ToastProvider } from '@/lib/context/ToastContext';
import { Toast } from '@/components/ui/Toast';
import { UpdateBanner } from '@/components/ui/UpdateBanner';
import { DialogHost } from '@/components/ui/DialogHost';

LogBox.ignoreAllLogs(true);


export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorContainer}>
      <Text accessibilityRole="header" style={styles.errorTitle}>Ops! Algo deu errado.</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={retry} accessibilityRole="button">
        <Text style={styles.retryText}>Tentar Novamente</Text>
      </TouchableOpacity>
    </View>
  );
}

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoading) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    const isResetPassword = segments.includes('reset-password');
    const isPublicRoute = segments.includes('terms') || segments.includes('privacy');

    if (!session && !inAuthGroup && !isResetPassword && !isPublicRoute) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup && !isResetPassword) {
      router.replace('/');
    }
  }, [session, isLoading, segments, router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <UpdateBanner />
      <Toast />
      <DialogHost />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <CoupleProvider>
                <RootLayoutNav />
              </CoupleProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0F0D18',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#A09DB0',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#5B4FC7', // contraste AA com texto branco
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
