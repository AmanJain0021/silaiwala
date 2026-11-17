// The four bottom-nav roots (Services/Home, Store, Orders, Profile) live in one tab navigator,
// so switching tabs shows the already-mounted screen instantly instead of pushing a new copy
// onto the stack. The web's BottomNav is still rendered by each screen, so the default tab bar is hidden.
import React from 'react';
import Tabs from 'expo-router/js-tabs';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => null}
      backBehavior="firstRoute"
      screenOptions={{
        headerShown: false,
        animation: 'none',
        lazy: true,
        freezeOnBlur: true,
        sceneStyle: { backgroundColor: '#F7F8FC' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="store" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
