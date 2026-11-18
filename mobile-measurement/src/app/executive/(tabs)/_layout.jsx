// ProtectedRoute + layout wrap the four bottom-nav pages once; the tab navigator keeps each page mounted.
import React from 'react';
import Tabs from 'expo-router/js-tabs';
import { ExecutiveGuard } from '../../../components/executive/ExecutiveProtectedRoute';
import MeasurementExecutiveLayout from '../../../components/executive/MeasurementExecutiveLayout';

export default function ExecutiveTabsLayout() {
  return (
    <ExecutiveGuard>
      <MeasurementExecutiveLayout>
        <Tabs tabBar={() => null} backBehavior="firstRoute" screenOptions={{ headerShown: false, animation: 'none', lazy: true, freezeOnBlur: true, sceneStyle: { backgroundColor: '#F9FAFB' } }}>
          <Tabs.Screen name="dashboard" />
          <Tabs.Screen name="requests" />
          <Tabs.Screen name="wallet" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </MeasurementExecutiveLayout>
    </ExecutiveGuard>
  );
}
