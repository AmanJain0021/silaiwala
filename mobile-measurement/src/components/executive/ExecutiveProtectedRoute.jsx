// Port of modules/measurement-executive/components/ProtectedRoute.jsx: same role and approval checks.
import React from 'react';
import { Redirect } from 'expo-router';
import useAuthStore from '../../store/authStore';
import PendingApproval from '../../screens/PendingApproval';

export function ExecutiveGuard({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || user?.role !== 'measurement_executive') return <Redirect href="/executive/login" />;
  if (user.isActive === false) return <PendingApproval />;
  return children;
}

export const withExecutiveGuard = (ScreenComponent) => {
  const Guarded = (props) => (
    <ExecutiveGuard>
      <ScreenComponent {...props} />
    </ExecutiveGuard>
  );
  Guarded.displayName = `withExecutiveGuard(${ScreenComponent.displayName || ScreenComponent.name || 'Screen'})`;
  return Guarded;
};
