import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { CoupleProvider } from '../context/CoupleContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CoupleProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CoupleProvider>
    </AuthProvider>
  );
}