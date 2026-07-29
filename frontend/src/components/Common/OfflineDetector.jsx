import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// Helper function to test real internet connectivity
export const checkRealConnectivity = async () => {
  if (!navigator.onLine) return false;
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

export const OfflineScreen = ({ onRetry, isChecking = false }) => {
  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Offline Icon */}
        <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 mb-6 shadow-inner ring-8 ring-rose-50/50 dark:ring-rose-950/20">
          <WifiOff className="w-10 h-10 animate-pulse" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100/80 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs font-semibold tracking-wide uppercase mb-4">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          No Internet Connection
        </div>

        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
          Web Page Offline
        </h2>

        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-8 max-w-xs">
          You are currently disconnected from the network. Check your internet settings to continue using SewZella.
        </p>

        {/* Retry Button */}
        <button
          onClick={onRetry}
          disabled={isChecking}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98] text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
        >
          <RefreshCw className={`w-5 h-5 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking Connection...' : 'Try Reconnecting'}
        </button>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-5">
          SewZella will automatically reconnect once internet is back.
        </p>
      </div>
    </div>
  );
};

export default function OfflineDetector({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    toast.success('Internet connection restored!', {
      id: 'online-toast',
      icon: '🌐',
      duration: 4000,
    });
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    toast.error('You are currently offline', {
      id: 'offline-toast',
      icon: '📡',
      duration: 5000,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleNetworkError = () => {
      if (!navigator.onLine) {
        setIsOnline(false);
      }
    };
    window.addEventListener('app_network_offline', handleNetworkError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('app_network_offline', handleNetworkError);
    };
  }, [handleOnline, handleOffline]);

  const handleRetry = async () => {
    setIsChecking(true);
    const connected = await checkRealConnectivity();
    setIsChecking(false);
    if (connected) {
      setIsOnline(true);
      toast.success('Reconnected successfully!', { icon: '✅' });
    } else {
      setIsOnline(false);
      toast.error('Still offline. Please check your connection.', { id: 'retry-offline-toast' });
    }
  };

  return (
    <>
      {!isOnline && <OfflineScreen onRetry={handleRetry} isChecking={isChecking} />}
      {children}
    </>
  );
}
