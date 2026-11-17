/*
 * App-wide side effects for the tailor app (from frontend/src/App.jsx + main.jsx):
 * branding prefetch, push notification listeners (taps open the linked partner screen),
 * offline/online toasts (OfflineDetector). Socket + push registration live in TailorLayout
 * and session expiry in the tailor AuthContext, as on the web.
 */
import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import useBrandingStore from '../../store/brandingStore';
import toast from '../../lib/toast';
import { attachNotificationListeners, handleInitialNotification } from '../../lib/push';

export default function AppManagers() {
  const wasOffline = useRef(false);

  useEffect(() => {
    useBrandingStore.getState().fetchBranding();
  }, []);

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

  return null;
}
