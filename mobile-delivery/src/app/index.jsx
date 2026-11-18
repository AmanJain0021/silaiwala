// Launch route: logged-in delivery partners open the dashboard, others the delivery login (web entry).
import React from 'react';
import { Redirect } from 'expo-router';
import useAuthStore from '../store/authStore';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();
  return <Redirect href={isAuthenticated && user?.role === 'delivery' ? '/delivery/dashboard' : '/delivery/login'} />;
}
