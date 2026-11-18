import React from 'react';
import { Stack } from 'expo-router';

export default function ExecutiveStack() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F9FAFB' }, animation: 'none', freezeOnBlur: true }} />;
}
