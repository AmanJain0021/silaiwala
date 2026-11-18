// /delivery -> /delivery/dashboard (web: <Navigate replace />)
import React from 'react';
import { Redirect } from 'expo-router';

export default function DeliveryIndex() {
  return <Redirect href="/delivery/dashboard" />;
}
