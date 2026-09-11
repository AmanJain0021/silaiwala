import React, { useEffect } from 'react';
import toast from 'react-hot-toast';

// Helper function to test real internet connectivity
export const checkRealConnectivity = async () => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`/vite.svg?_t=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok || res.status < 500;
  } catch (e) {
    return false;
  }
};

export const OfflineScreen = () => null;

export default function OfflineDetector({ children }) {
  useEffect(() => {
    const handleOnline = () => {
      toast.success('Internet connection restored!', {
        id: 'online-toast',
        icon: '🌐',
        duration: 4000,
      });
    };

    const handleOffline = () => {
      toast.error('You are currently offline', {
        id: 'offline-toast',
        icon: '📡',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleNetworkError = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        handleOffline();
      }
    };
    window.addEventListener('app_network_offline', handleNetworkError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('app_network_offline', handleNetworkError);
    };
  }, []);

  return children;
}
