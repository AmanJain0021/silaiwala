// Launch route: approved tailors open the dashboard, pending/rejected ones their verification page,
// logged-out users the partner landing page (the web's public entry for partners).
import React from 'react';
import { Redirect } from 'expo-router';
import { useTailorAuth, TAILOR_STATUS } from '../context/tailor/AuthContext';

export default function Index() {
  const { token, user, status } = useTailorAuth();
  if (!token || !user) return <Redirect href="/partner/welcome" />;
  if (status === TAILOR_STATUS.APPROVED) return <Redirect href="/partner" />;
  return <Redirect href="/partner/verification" />;
}
