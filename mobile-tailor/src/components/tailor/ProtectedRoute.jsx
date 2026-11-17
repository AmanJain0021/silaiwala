// Port of modules/tailor/components/ProtectedRoute.jsx: same redirects by token / role / tailor status.
// Native: route files wrap screens with withTailorGuard(Screen, requiredStatus) instead of <Outlet />.
import React from 'react';
import { Redirect } from 'expo-router';
import { useTailorAuth, TAILOR_STATUS } from '../../context/tailor/AuthContext';
import Screen from '../common/Screen';
import { Box } from '../ui/primitives';
import Spin from '../ui/Spin';

export function TailorGuard({ requiredStatus = [TAILOR_STATUS.APPROVED], children }) {
  const { token, status, loading, user } = useTailorAuth();

  if (loading && !user) {
    return (
      <Screen className="bg-[#F7F8FC]">
        <Box className="flex-1 items-center justify-center">
          <Spin size={40} color="#843D9B" />
        </Box>
      </Screen>
    );
  }

  const currentRole = user?.role;
  if (!token || (currentRole && currentRole !== 'tailor' && currentRole !== 'partner')) {
    return <Redirect href="/partner/login" />;
  }
  if (status === TAILOR_STATUS.PENDING_APPROVAL && !requiredStatus.includes(TAILOR_STATUS.PENDING_APPROVAL)) {
    return <Redirect href="/partner/verification" />;
  }
  if (status === TAILOR_STATUS.REJECTED && !requiredStatus.includes(TAILOR_STATUS.REJECTED)) {
    return <Redirect href="/partner/verification" />;
  }
  if (!requiredStatus.includes(status)) {
    return <Redirect href={status === TAILOR_STATUS.NOT_REGISTERED ? '/partner/login' : '/partner/verification'} />;
  }
  return children;
}

export const withTailorGuard = (ScreenComponent, requiredStatus) => {
  const Guarded = (props) => (
    <TailorGuard requiredStatus={requiredStatus}>
      <ScreenComponent {...props} />
    </TailorGuard>
  );
  Guarded.displayName = `withTailorGuard(${ScreenComponent.displayName || ScreenComponent.name || 'Screen'})`;
  return Guarded;
};

export default TailorGuard;
