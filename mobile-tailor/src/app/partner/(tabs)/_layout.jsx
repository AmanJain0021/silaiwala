// The five bottom-nav roots (Home, Orders, Wallet, Services, Profile) stay mounted in a tab navigator
// so switching tabs is instant. Each screen renders the web's TailorLayout (header + bottom nav),
// so the navigator's own tab bar is hidden.
import React from 'react';
import Tabs from 'expo-router/js-tabs';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => null}
      backBehavior="firstRoute"
      screenOptions={{ headerShown: false, animation: 'none', lazy: true, freezeOnBlur: true, sceneStyle: { backgroundColor: '#F7F8FC' } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="wallet" />
      <Tabs.Screen name="products" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
