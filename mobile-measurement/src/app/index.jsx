// Launch route: logged-in executives open the dashboard, others the executive login (web entry).
import React from 'react';
import { Redirect } from 'expo-router';
import useAuthStore from '../store/authStore';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();
  return <Redirect href={isAuthenticated && user?.role === 'measurement_executive' ? '/executive/dashboard' : '/executive/login'} />;
}
