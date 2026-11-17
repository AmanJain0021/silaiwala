// /partner/* stack (the web's TailorContextWrapper providers are in the root layout).
import React from 'react';
import { Stack } from 'expo-router';

export default function PartnerLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F7F8FC' }, animation: 'none', freezeOnBlur: true }} />;
}
