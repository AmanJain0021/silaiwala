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
    const checkUser = () => {
      let userStr, tailorStr, deliveryStr, adminStr, meStr;
      try {
          userStr = localStorage.getItem('user');
          tailorStr = localStorage.getItem('tailor_user');
          deliveryStr = localStorage.getItem('delivery_user');
          adminStr = localStorage.getItem('admin_user');
          meStr = localStorage.getItem('me_user');
      } catch (e) {
          console.error("Error reading localStorage", e);
      }

      let activeUser = null;

      if (userStr && userStr !== 'undefined') {
          activeUser = JSON.parse(userStr);
      } else if (tailorStr && tailorStr !== 'undefined') {
          activeUser = JSON.parse(tailorStr);
      } else if (deliveryStr && deliveryStr !== 'undefined') {
          activeUser = JSON.parse(deliveryStr);
      } else if (adminStr && adminStr !== 'undefined') {
          activeUser = JSON.parse(adminStr);
      } else if (meStr && meStr !== 'undefined') {
          activeUser = JSON.parse(meStr);
      }

      // Only update state if the user string has actually changed
      // to prevent infinite re-renders and repeated API calls
      setUser(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(activeUser)) {
          return activeUser;
        }
        return prev;
      });
    };

    checkUser();
    window.addEventListener('storage', checkUser);
    const interval = setInterval(checkUser, 5000);

    return () => {
      window.removeEventListener('storage', checkUser);
      clearInterval(interval);
    };
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
  const lastConnectedUserRef = React.useRef(null);

  useEffect(() => {
    // Check if user is logged in
    const checkAndConnectSocket = () => {
      try {
      let userStr, tailorStr, deliveryStr, adminStr, meStr, deliveryAuthStorage;
      try {
          userStr = localStorage.getItem('user');
          tailorStr = localStorage.getItem('tailor_user');
          deliveryStr = localStorage.getItem('delivery_user');
          deliveryAuthStorage = localStorage.getItem('delivery-auth-storage');
          adminStr = localStorage.getItem('admin_user');
          meStr = localStorage.getItem('me_user');
      } catch (e) {
          console.error("Error reading localStorage", e);
      }

        let activeUser = null;
        let role = null;

        // Give priority to the current route's role if possible
        const path = window.location.pathname;

        if (path.startsWith('/delivery') && (deliveryStr || deliveryAuthStorage)) {
            if (deliveryAuthStorage && deliveryAuthStorage !== 'undefined') {
                const parsed = JSON.parse(deliveryAuthStorage);
                activeUser = parsed?.state?.deliveryBoy;
            } else if (deliveryStr && deliveryStr !== 'undefined') {
                activeUser = JSON.parse(deliveryStr);
            }
            role = 'delivery';
        } else if (path.startsWith('/partner') && tailorStr && tailorStr !== 'undefined') {
            activeUser = JSON.parse(tailorStr);
            role = 'tailor';
        } else if (userStr && userStr !== 'undefined') {
            activeUser = JSON.parse(userStr);
            role = activeUser.role || 'customer';
        } else if (tailorStr && tailorStr !== 'undefined') {
            activeUser = JSON.parse(tailorStr);
            role = 'tailor';
        } else if (adminStr && adminStr !== 'undefined') {
            activeUser = JSON.parse(adminStr);
            role = 'admin';
        } else if (meStr && meStr !== 'undefined') {
            activeUser = JSON.parse(meStr);
            role = 'measurement_executive';
        }

        if (activeUser) {
          console.log('[Socket Debug] activeUser found:', activeUser);
          let userId = activeUser._id || activeUser.id;
          if (activeUser.user) {
            userId = typeof activeUser.user === 'string' ? activeUser.user : (activeUser.user._id || userId);
          }
          console.log('[Socket Debug] Evaluated userId:', userId, 'Role:', role);
          
          if (userId) {
            const connectionKey = `${userId}-${role}`;
            console.log(`[Socket Debug] ConnectionKey: ${connectionKey}, lastConnected: ${lastConnectedUserRef.current}`);
            if (lastConnectedUserRef.current !== connectionKey) {
              console.log(`[Socket] Connecting with User ID: ${userId}, Role: ${role}`);
              connect(userId, role);
              lastConnectedUserRef.current = connectionKey;
            }
          } else {
             console.log('[Socket Debug] userId is falsy');
          }
        } else {
          console.log('[Socket Debug] No activeUser found');
          if (lastConnectedUserRef.current !== null) {
            console.log('[Socket] Disconnecting socket, no active user found');
            disconnect();
            lastConnectedUserRef.current = null;
          }
        }
      } catch (error) {
        console.error('[Socket Debug] Socket connection error:', error);
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
      import('react-hot-toast').then((module) => {
        const { toast } = module.default || module;
        toast.success(`🎉 New Order Received! ID: ${orderId}`, {
          id: `toast-new-order-${orderId}`,
          duration: 5000,
          position: 'top-right',
        });
      });
    };

    // Listen for status updates (Customer/Tailor)
    const handleStatusUpdate = (data) => {
      if (!data?.status || /^[A-Z0-9_]+$/.test(String(data.status))) return;

      const orderId = data.orderId || data._id;
      const statusKey = String(data.status).toLowerCase();
      const notifId = `toast-status-${orderId}-${statusKey}`;

      import('react-hot-toast').then((module) => {
        const { toast } = module.default || module;
        toast.success(`📦 Order ${orderId} status changed to: ${statusKey.replace(/-/g, ' ')}`, {
          id: notifId,
          duration: 5000,
          position: 'top-right',
          icon: '🔄',
        });
      });
    };

    // Listen for general notifications (like Admin Broadcasts or Test Pushes)
    const handleNewNotification = (data) => {
      if (data.type === 'BROADCAST' || data.type === 'TEST') {
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
