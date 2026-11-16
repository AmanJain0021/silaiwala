/*
 * App-wide side effects ported from frontend/src/App.jsx + main.jsx:
 * branding/banner prefetch, socket connect per user, global socket toasts,
 * push registration, offline/online toasts (OfflineDetector), session expiry.
 */
import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import useAuthStore from '../../store/authStore';
import useSocketStore from '../../store/socketStore';
import useBrandingStore from '../../store/brandingStore';
import useBannerStore from '../../store/bannerStore';
import events from '../../lib/events';
import toast from '../../lib/toast';
import { registerForPush, attachNotificationListeners, handleInitialNotification } from '../../lib/push';

export default function AppManagers() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const socket = useSocketStore((s) => s.socket);
  const userId = user?._id || user?.id;
  const wasOffline = useRef(false);

  // Prefetch branding + banners (App.jsx)
  useEffect(() => {
    useBrandingStore.getState().fetchBranding();
    useBannerStore.getState().fetchHomeBanners();
    useBannerStore.getState().fetchStoreBanners();
  }, []);

  // Socket per user
  useEffect(() => {
    const { connect, disconnect } = useSocketStore.getState();
    if (isAuthenticated && userId) connect(userId, user?.role);
    else disconnect();
  }, [isAuthenticated, userId, user?.role]);

  // Global socket events
  useEffect(() => {
    if (!socket) return undefined;
    const handleStatusUpdate = (data) => {
      if (!data?.status || /^[A-Z0-9_]+$/.test(String(data.status))) return;
      if (global._lastStatusToastTime && Date.now() - global._lastStatusToastTime < 4000) return;
      const orderId = data.orderId || data._id;
      const statusKey = String(data.status).toLowerCase();
      toast.success(`Order #${orderId} Updated\nStatus changed to: ${statusKey.replace(/-/g, ' ')}`, { id: `toast-status-${orderId}-${statusKey}` });
    };
    const handleNewNotification = (data) => {
      if (data.type === 'BROADCAST' || data.type === 'TEST') {
        toast.success(`📣 ${data.title || 'Notification'}\n${data.message || ''}`);
      }
    };
    socket.on('order_status_updated', handleStatusUpdate);
    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('order_status_updated', handleStatusUpdate);
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  // Push
  useEffect(() => {
    if (isAuthenticated && userId) registerForPush(userId);
  }, [isAuthenticated, userId]);
  useEffect(() => {
    const detach = attachNotificationListeners();
    handleInitialNotification();
    return detach;
  }, []);

  // Online / offline toasts (OfflineDetector)
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false;
      if (offline && !wasOffline.current) toast.error('You are currently offline', { id: 'offline-toast', icon: '📡', duration: 5000 });
      if (!offline && wasOffline.current) toast.success('Internet connection restored!', { id: 'online-toast', icon: '🌐', duration: 4000 });
      wasOffline.current = offline;
    });
    return unsub;
  }, []);

  // Session expiry (401 on an authenticated request)
  useEffect(() => events.on('session_expired', () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    toast.error('Session expired\nPlease log in again.', { id: 'session-expired' });
    useAuthStore.getState().logout();
  }), []);

  return null;
}
