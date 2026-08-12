import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { Toaster, useToaster, toast } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import useSocketStore from './store/socketStore';
import { usePushNotifications } from './hooks/usePushNotifications';
import SplashScreen from './components/Common/SplashScreen';
import api from './utils/api';
import CustomToastCard from './shared/components/CustomToast';

// Component to handle push notifications hook
const PushNotificationManager = () => {
  const { user } = useAuthStore();
  usePushNotifications(user);
  return null;
};

// Component to handle splash screen
const SplashManager = ({ splashConfig, setSplashConfig }) => {
  if (!splashConfig || !splashConfig.enabled) return null;
  return <SplashScreen config={splashConfig} onComplete={() => setSplashConfig(null)} />;
};

// Single Toast Enforcer Wrapper
const SingleToastContainer = () => {
  const { toasts } = useToaster();

  // Enforce exactly 1 toast notification visible at any time
  useEffect(() => {
    if (toasts.length > 1) {
      toasts.slice(0, toasts.length - 1).forEach((t) => {
        toast.dismiss(t.id);
      });
    }
  }, [toasts]);

  return (
    <Toaster position="top-right" containerStyle={{ top: 20, right: 20, zIndex: 99999 }}>
      {(t) => <CustomToastCard t={t} />}
    </Toaster>
  );
};

function App() {
  const { user } = useAuthStore();
  const { socket, connect, disconnect } = useSocketStore();
  const [splashConfig, setSplashConfig] = useState(null);

  // Fetch splash configuration on mount
  useEffect(() => {
    const fetchSplashConfig = async () => {
      try {
        const response = await api.get('/cms/settings');
        if (response.data?.success && response.data?.data?.splashScreen) {
          setSplashConfig(response.data.data.splashScreen);
        }
      } catch (err) {
        console.error('Failed to fetch splash screen settings:', err);
      }
    };
    fetchSplashConfig();
  }, []);

  // Multi-tab socket sync
  useEffect(() => {
    const checkAndConnectSocket = () => {
      const activeUser = useAuthStore.getState().user;
      if (activeUser && activeUser._id) {
        connect(activeUser._id);
      } else {
        disconnect();
      }
    };

    checkAndConnectSocket();

    window.addEventListener('storage', checkAndConnectSocket);
    const interval = setInterval(checkAndConnectSocket, 5000);

    return () => {
      window.removeEventListener('storage', checkAndConnectSocket);
      clearInterval(interval);
    };
  }, [connect, disconnect]);

  // Global Event Listeners
  useEffect(() => {
    if (!socket) return;
    
    // Listen for new orders (Tailor)
    const handleNewOrder = (order) => {
      const orderId = order?.orderId || order?._id || 'new';
      toast.success({
        title: 'New Order Received!',
        body: `Order ID: #${orderId}`
      }, { id: `toast-new-order-${orderId}` });
    };

    // Listen for status updates (Customer/Tailor)
    const handleStatusUpdate = (data) => {
      if (!data?.status || /^[A-Z0-9_]+$/.test(String(data.status))) return;

      // Suppress duplicate status toast if action was performed locally recently
      if (window._lastStatusToastTime && (Date.now() - window._lastStatusToastTime < 4000)) {
        return;
      }

      const orderId = data.orderId || data._id;
      const statusKey = String(data.status).toLowerCase();
      const notifId = `toast-status-${orderId}-${statusKey}`;

      toast.success({
        title: `Order #${orderId} Updated`,
        body: `Status changed to: ${statusKey.replace(/-/g, ' ')}`
      }, { id: notifId });
    };

    // Listen for general notifications (like Admin Broadcasts or Test Pushes)
    const handleNewNotification = (data) => {
      if (data.type === 'BROADCAST' || data.type === 'TEST') {
        toast.success({
          title: `📣 ${data.title || 'Notification'}`,
          body: data.message || ''
        });
      }
    };

    socket.on('receive_new_order', handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdate);
    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('receive_new_order', handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdate);
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  return (
    <>
      <PushNotificationManager />
      <SplashManager splashConfig={splashConfig} setSplashConfig={setSplashConfig} />
      <SingleToastContainer />
      <AppRoutes />
    </>
  );
}

export default App;
