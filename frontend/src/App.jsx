import React, { useEffect, useState } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AppRoutes from './routes';
import useSocketStore from './store/socketStore';
import { Toaster } from 'react-hot-toast';
import SplashScreen from './components/Common/SplashScreen';
import { usePushNotifications } from './hooks/usePushNotifications';
// import LocationSplashScreen from './components/Common/LocationSplashScreen';

function PushNotificationManager() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
      setUser(JSON.parse(userStr));
    }
  }, []);

  usePushNotifications(user);
  return null;
}

function SplashManager({ splashConfig, setSplashConfig }) {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const isSplash = false; // Disabled splash screen as requested
    
    let role = 'customer';
    if (path.startsWith('/partner')) {
      role = 'tailor';
    } else if (path.startsWith('/delivery')) {
      role = 'delivery';
    }
    
    if (isSplash) {
      setSplashConfig({ isSplash: true, role });
    }
  }, [location.pathname, setSplashConfig]);

  if (!splashConfig.isSplash) return null;

  return (
    <SplashScreen 
      role={splashConfig.role}
      onComplete={() => setSplashConfig(prev => ({ ...prev, isSplash: false }))} 
    />
  );
}

function App() {
  const { socket, connect, disconnect } = useSocketStore();
  const [splashConfig, setSplashConfig] = useState({ isSplash: false, role: 'customer' });

  useEffect(() => {
    // Check if user is logged in
    const checkAndConnectSocket = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr && userStr !== 'undefined') {
          const user = JSON.parse(userStr);
          const userId = user._id || user.id;
          if (userId) {
            connect(userId, user.role);
          }
        } else {
          disconnect();
        }
      } catch (error) {
        console.error('Socket connection error:', error);
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
      import('react-hot-toast').then((module) => {
        const { toast } = module.default || module;
        toast.success(`🎉 New Order Received! ID: ${order?.orderId || 'Unknown'}`, {
          duration: 6000,
          position: 'top-right',
        });
      });
    };

    // Listen for status updates (Customer/Tailor)
    const handleStatusUpdate = (data) => {
      import('react-hot-toast').then((module) => {
        const { toast } = module.default || module;
        toast(`📦 Order ${data.orderId} status changed to: ${data.status}`, {
          duration: 5000,
          position: 'top-right',
          icon: '🔄',
        });
      });
    };

    socket.on('receive_new_order', handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdate);

    return () => {
      socket.off('receive_new_order', handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdate);
    };
  }, [socket]);

  return (
    <BrowserRouter>
      <PushNotificationManager />
      <SplashManager splashConfig={splashConfig} setSplashConfig={setSplashConfig} />
      <Toaster position="top-right" />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
