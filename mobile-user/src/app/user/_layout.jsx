// /user/* — CustomerNotificationProvider + CustomerMainLayout (mobile: no header, content only)
import React from 'react';
import { Stack } from 'expo-router';
import { NotificationProvider } from '../../context/NotificationContext';

export default function UserLayout() {
  return (
    <NotificationProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F7F8FC' }, animation: 'none', freezeOnBlur: true }} />
    </NotificationProvider>
  );
}
