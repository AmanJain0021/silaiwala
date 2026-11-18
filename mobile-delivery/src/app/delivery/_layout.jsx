import React from 'react';
import { Stack } from 'expo-router';

export default function DeliveryStack() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAFAFB' }, animation: 'none', freezeOnBlur: true }} />;
}
