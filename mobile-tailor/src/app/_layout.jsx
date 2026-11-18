import { NavPathTracker } from '../lib/nav';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SplashGate } from '../lib/splash';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FONTS } from '../lib/fonts';
import { hydrateStorage } from '../lib/storage';
import { bootstrapStores } from '../store/bootstrap';
import { Toaster } from '../lib/toast';
import { PromptHost } from '../lib/prompt';
import ErrorBoundary from '../components/common/ErrorBoundary';
import AppManagers from '../components/common/AppManagers';
import { AuthProvider as TailorAuthProvider } from '../context/tailor/AuthContext';
import { NotificationProvider as TailorNotificationProvider } from '../context/tailor/NotificationContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await hydrateStorage();
        await bootstrapStores();
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const loaded = (fontsLoaded || fontError) && ready;
  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#F7F8FC' }}>
        <ErrorBoundary>
          {/* TailorContextWrapper on the web: auth + notifications around every /partner route */}
          <TailorAuthProvider>
            <TailorNotificationProvider>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F7F8FC' }, animation: 'none', freezeOnBlur: true }} />
            </TailorNotificationProvider>
          </TailorAuthProvider>
          <NavPathTracker />
          <AppManagers />
        </ErrorBoundary>
        <SplashGate />
        <PromptHost />
        <Toaster />
      </View>
    </SafeAreaProvider>
  );
}
