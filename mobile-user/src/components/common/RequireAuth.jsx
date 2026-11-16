// Port of CustomerProtectedRoute: logged-out (or non-customer) users go to login, then come back.
import React from 'react';
import { Redirect, usePathname, useLocalSearchParams } from 'expo-router';
import useAuthStore from '../../store/authStore';

export default function RequireAuth({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  const pathname = usePathname();
  const params = useLocalSearchParams();
  if (!isAuthenticated || (user?.role && user.role !== 'customer')) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (typeof v === 'string' && k !== '__s') qs.set(k, v); });
    const from = pathname + (qs.toString() ? `?${qs}` : '');
    return <Redirect href={{ pathname: '/user/login', params: { from } }} />;
  }
  return children;
}

export const withAuth = (Component) => function Protected(props) {
  return (
    <RequireAuth>
      <Component {...props} />
    </RequireAuth>
  );
};
