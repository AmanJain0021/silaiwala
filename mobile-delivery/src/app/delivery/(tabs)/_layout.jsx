// DeliveryProtectedRoute + DeliveryLayout wrap the five bottom-nav pages once (one header, one bottom nav,
// one location tracker); the tab navigator keeps each page mounted for instant switching.
import React from 'react';
import Tabs from 'expo-router/js-tabs';
import { DeliveryGuard } from '../../../components/delivery/DeliveryProtectedRoute';
import DeliveryLayout from '../../../components/delivery/DeliveryLayout';

export default function DeliveryTabsLayout() {
  return (
    <DeliveryGuard>
      <DeliveryLayout>
        <Tabs
          tabBar={() => null}
          backBehavior="firstRoute"
          screenOptions={{ headerShown: false, animation: 'none', lazy: true, freezeOnBlur: true, sceneStyle: { backgroundColor: '#FAFAFB' } }}
        >
          <Tabs.Screen name="dashboard" />
          <Tabs.Screen name="tasks" />
          <Tabs.Screen name="history" />
          <Tabs.Screen name="wallet" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </DeliveryLayout>
    </DeliveryGuard>
  );
}
