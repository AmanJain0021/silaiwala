/*
 * App-wide side effects for the delivery app (from frontend/src/App.jsx + main.jsx):
 * branding prefetch, socket per logged-in delivery partner, push registration + notification taps,
 * offline/online toasts (OfflineDetector), session expiry (401) -> logout to /delivery/login.
 */
import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import useAuthStore from '../../store/authStore';
import useSocketStore from '../../store/socketStore';
import useBrandingStore from '../../store/brandingStore';
import events from '../../lib/events';
import toast from '../../lib/toast';
import { registerForPush, attachNotificationListeners, handleInitialNotification } from '../../lib/push';

export default function AppManagers() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = user?._id || user?.id;
  const wasOffline = useRef(false);

  useEffect(() => {
    useBrandingStore.getState().fetchBranding();
  }, []);

  useEffect(() => {
    const { connect, disconnect } = useSocketStore.getState();
    if (isAuthenticated && userId) connect(String(userId), user?.role || 'delivery');
    else disconnect();
  }, [isAuthenticated, userId, user?.role]);

  useEffect(() => {
    if (isAuthenticated && userId) registerForPush(userId);
  }, [isAuthenticated, userId]);
  useEffect(() => {
    const detach = attachNotificationListeners();
    handleInitialNotification();
    return detach;
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false;
      if (offline && !wasOffline.current) toast.error('You are currently offline', { id: 'offline-toast', icon: '📡', duration: 5000 });
      if (!offline && wasOffline.current) toast.success('Internet connection restored!', { id: 'online-toast', icon: '🌐', duration: 4000 });
      wasOffline.current = offline;
    });
    return unsub;
  }, []);

  useEffect(() => events.on('session_expired', () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    toast.error('Session expired\nPlease log in again.', { id: 'session-expired' });
    useAuthStore.getState().logout();
  }), []);

  return null;
}
