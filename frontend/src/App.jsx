import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import useSocketStore from './store/socketStore';
import { Toaster } from 'react-hot-toast';
import SplashScreen from './components/common/SplashScreen';

function App() {
  const { socket, connect, disconnect } = useSocketStore();
  const [showSplash, setShowSplash] = useState(
    window.location.pathname === '/' || window.location.pathname === '/welcome'
  );

  useEffect(() => {
    // Check if user is logged in
    const checkAndConnectSocket = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr && userStr !== 'undefined') {
          const user = JSON.parse(userStr);
          if (user && user._id) {
            connect(user._id, user.role);
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
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Toaster position="top-right" />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
