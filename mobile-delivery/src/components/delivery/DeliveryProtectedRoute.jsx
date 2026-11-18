// Port of modules/delivery/components/DeliveryProtectedRoute.jsx: same checks (delivery role, approval).
// Native: route files wrap screens with withDeliveryGuard(Screen) instead of <Outlet />.
import React from 'react';
import { Redirect } from 'expo-router';
import useAuthStore from '../../store/authStore';
import PendingApproval from '../../screens/PendingApproval';
import Screen from '../common/Screen';
import { Box } from '../ui/primitives';
import Spin from '../ui/Spin';

export function DeliveryGuard({ children }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  if (isLoading && !user) {
    return (
      <Screen className="bg-slate-50">
        <Box className="flex-1 items-center justify-center">
          <Spin size={40} color="#843D9B" />
        </Box>
      </Screen>
    );
  }
  if (!isAuthenticated || user?.role !== 'delivery') return <Redirect href="/delivery/login" />;
  if (user && user.isActive === false) return <PendingApproval />;
  return children;
}

export const withDeliveryGuard = (ScreenComponent) => {
  const Guarded = (props) => (
    <DeliveryGuard>
      <ScreenComponent {...props} />
    </DeliveryGuard>
  );
  Guarded.displayName = `withDeliveryGuard(${ScreenComponent.displayName || ScreenComponent.name || 'Screen'})`;
  return Guarded;
};

export default DeliveryGuard;
