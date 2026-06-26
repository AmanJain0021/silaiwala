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
        const tailorStr = localStorage.getItem('tailor_user');
        const deliveryStr = localStorage.getItem('delivery_user');
        const adminStr = localStorage.getItem('admin_user');
        const meStr = localStorage.getItem('me_user');

        let activeUser = null;
        let role = null;

        if (userStr && userStr !== 'undefined') {
            activeUser = JSON.parse(userStr);
            role = activeUser.role || 'customer';
        } else if (tailorStr && tailorStr !== 'undefined') {
            activeUser = JSON.parse(tailorStr);
            role = 'tailor';
        } else if (deliveryStr && deliveryStr !== 'undefined') {
            activeUser = JSON.parse(deliveryStr);
            role = 'delivery';
        } else if (adminStr && adminStr !== 'undefined') {
            activeUser = JSON.parse(adminStr);
            role = 'admin';
        } else if (meStr && meStr !== 'undefined') {
            activeUser = JSON.parse(meStr);
            role = 'measurement_executive';
        }

        if (activeUser) {
          const userId = activeUser._id || activeUser.id;
          if (userId) {
            connect(userId, role);
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

    // Listen for general notifications (like Admin Broadcasts)
    const handleNewNotification = (data) => {
      if (data.type === 'BROADCAST') {
        import('react-hot-toast').then((module) => {
          const { toast } = module.default || module;
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-bold text-gray-900">📣 {data.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{data.message}</p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          ), { duration: 8000, position: 'top-center' });
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
    <BrowserRouter>
      <PushNotificationManager />
      <SplashManager splashConfig={splashConfig} setSplashConfig={setSplashConfig} />
      <Toaster position="top-right" />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
