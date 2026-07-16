import { useState, useRef, useEffect, useCallback } from "react";
import logo from "../../../../assets/animations/lottie/logo-removebg.png";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { FiLogOut, FiPackage, FiHome, FiUser, FiMenu, FiBell, FiAlertCircle } from "react-icons/fi";
import { MapPin } from "lucide-react";
import { MdMotorcycle } from "react-icons/md";
import { useDeliveryAuthStore } from "../../store/deliveryStore";
import { useDeliveryNotificationStore } from "../../store/deliveryNotificationStore";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import DeliveryBottomNav from "./DeliveryBottomNav";
import NewTaskAlert from "../NewTaskAlert";
import { useDeliveryTracking } from "../../../../shared/hooks/useDeliveryTracking";
import { formatPrice } from "../../../../shared/utils/helpers";
import socketService from "../../../../shared/utils/socket";
import { useJsApiLoader } from "@react-google-maps/api";
import useUnifiedLocation from "../../../../shared/hooks/useUnifiedLocation";

const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry', 'drawing'];

const DeliveryLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    deliveryBoy, logout, isAuthenticated, acceptOrder, 
    acceptReturn, fetchProfileSummary, updateStatus, 
    isUpdatingStatus 
  } = useDeliveryAuthStore();
  const isOnline = deliveryBoy?.status === 'available';

  const handleToggleOnline = () => {
    if (isUpdatingStatus) return;
    const wasOnline = isOnline;
    const newStatus = wasOnline ? 'offline' : 'available';
    
    // 🚀 Instant Feedback
    toast.success(wasOnline ? 'Going Offline...' : 'Going Online...');
    
    updateStatus(newStatus).then(() => {
      window.dispatchEvent(new CustomEvent('delivery-dashboard-refresh'));
    }).catch((err) => {
      const msg = err?.response?.data?.message || 'Failed to update status';
      toast.error(msg);
    });
  };
  const { unreadCount, fetchNotifications } = useDeliveryNotificationStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const audioUnlockedRef = useRef(false);

  const { detectLocation, isLocating } = useUnifiedLocation({ fetchAddress: true });
  const [partnerLocation, setPartnerLocation] = useState('Detecting location...');

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const data = await detectLocation();
        if (data && data.address) {
          const shortAddr = data.address.split(',')[0] + (data.city ? `, ${data.city}` : '');
          setPartnerLocation(shortAddr);
        } else {
          setPartnerLocation('Location unknown');
        }
      } catch (err) {
        setPartnerLocation('Location unknown');
      }
    };
    fetchLocation();
  }, [detectLocation]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const initialFetch = () => {
      fetchProfileSummary();
      fetchNotifications(1);
    };

    initialFetch();

    const interval = setInterval(() => {
      Promise.all([fetchProfileSummary(), fetchNotifications(1)]);
    }, 120000); // Polling every 2 minutes for better mobile performance

    return () => clearInterval(interval);
  }, [isAuthenticated]); // Only run on auth change

  useEffect(() => {
    // Throttled refresh to prevent storm of calls from multiple socket events
    let lastRefresh = 0;
    const handleGlobalRefresh = () => {
      const now = Date.now();
      if (now - lastRefresh < 2000) return;
      lastRefresh = now;
      fetchProfileSummary();
      fetchNotifications(1);
    };
    window.addEventListener('delivery-dashboard-refresh', handleGlobalRefresh);
    return () => window.removeEventListener('delivery-dashboard-refresh', handleGlobalRefresh);
  }, []);

  // Audio Policy Unlock: User interaction required
  useEffect(() => {
    const unlock = () => {
      if (audioUnlockedRef.current) return;
      const dummy = new Audio();
      dummy.play().catch(() => { });
      audioUnlockedRef.current = true;
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);  // Global Buzzer & Notification State
  const [isBuzzerActive, setIsBuzzerActive] = useState(false);
  const buzzerRef = useRef(null);

  const stopBuzzer = useCallback(() => {
    if (buzzerRef.current) {
      try {
        buzzerRef.current.pause();
        buzzerRef.current.currentTime = 0;
      } catch (e) { }
      buzzerRef.current = null;
    }
    setIsBuzzerActive(false);
  }, []);

  const startBuzzer = useCallback(() => {
    if (buzzerRef.current) return;
    try {
      const audio = new Audio('/sounds/buzzer.mp3');
      audio.loop = true;
      audio.volume = 0.6;
      audio.play().catch(err => {
        console.warn('Audio blocked:', err);
      });
      buzzerRef.current = audio;
      setIsBuzzerActive(true);
      setTimeout(() => { if (buzzerRef.current === audio) stopBuzzer(); }, 120000);
    } catch (e) { }
  }, [stopBuzzer]);

  // Socket management
  useEffect(() => {
    const isOnline = deliveryBoy?.status === 'available' || deliveryBoy?.status === 'busy';
    if (!isOnline || !deliveryBoy?.id) return;

    socketService.connect();
    socketService.deliveryRegister(deliveryBoy.id);

    const registerOnConnect = () => socketService.deliveryRegister(deliveryBoy.id);
    socketService.socket?.on('connect', registerOnConnect);

    const onOrderTaken = (data) => {
      window.dispatchEvent(new CustomEvent('delivery-dashboard-refresh'));
    };
    socketService.on('order_taken', onOrderTaken);

    socketService.on('balance_updated', (data) => {
      useDeliveryAuthStore.getState().setBalance(data);
    });

    return () => {
      socketService.socket?.off('connect', registerOnConnect);
      socketService.off('order_taken', onOrderTaken);
      socketService.off('balance_updated');
      stopBuzzer();
    };
  }, [deliveryBoy?.id, deliveryBoy?.status, stopBuzzer]);

  const riderLocation = useDeliveryTracking(deliveryBoy?.id);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/delivery/login");
  };

  const menuItems = [
    { icon: FiHome, label: "Dashboard", path: "/delivery/dashboard" },
    { icon: FiPackage, label: "Orders", path: "/delivery/orders" },
    { icon: FiBell, label: "Notifications", path: "/delivery/notifications" },
    { icon: FiUser, label: "Profile", path: "/delivery/profile" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "busy": return "bg-yellow-500";
      case "offline": return "bg-slate-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <div id="delivery-layout-root" className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Mobile Header (Hidden on Wallet Page) */}
      {!location.pathname.includes('/delivery/wallet') && (
        <header className="sticky top-0 left-0 z-50 bg-[#843D9B] backdrop-blur-lg border-b border-indigo-400/20 shadow-lg shadow-indigo-900/10 shrink-0">
          <div className="flex items-center gap-3 px-4 py-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-95 border border-white/10"
            aria-label="Open menu">
            <FiMenu className="text-white text-xl" />
          </button>

          <div className="flex flex-col ml-1 min-w-0 max-w-[140px] sm:max-w-[180px]">
             <div className="flex items-center gap-1">
                 <h1 className="text-[12px] font-black text-white leading-tight tracking-tighter capitalize truncate">
                     {deliveryBoy?.name || "Partner"}
                 </h1>
             </div>
             <div className="flex items-center gap-1 overflow-hidden mt-0.5 text-indigo-200">
                 <MapPin size={10} className="shrink-0" />
                 <span className="text-[9px] font-bold tracking-wide truncate">
                     {isLocating ? 'Detecting location...' : partnerLocation}
                 </span>
             </div>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Premium Status Toggle */}
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isOnline ? 'text-emerald-300' : 'text-indigo-200'}`}>
                {isOnline ? 'Live' : 'Off'}
              </span>
              <button 
                onClick={handleToggleOnline} 
                disabled={isUpdatingStatus}
                className={`group relative h-5 w-10 flex-shrink-0 items-center rounded-full transition-all duration-500 border border-white/10 ${isOnline ? 'bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-indigo-900/50'}`}
              >
                <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${isOnline ? 'opacity-100 bg-emerald-500/20 animate-pulse' : 'opacity-0'}`} />
                <motion.div 
                  animate={{ x: isOnline ? 22 : 2 }} 
                  transition={{ type: "spring", stiffness: 600, damping: 30 }}
                  className={`relative h-3.5 w-3.5 rounded-full shadow-lg flex items-center justify-center transition-colors duration-300 ${isOnline ? 'bg-emerald-400' : 'bg-indigo-300'}`}
                >
                  {isOnline && <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-25" />}
                </motion.div>
              </button>
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-indigo-400/30">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shadow-2xl border border-indigo-100 overflow-hidden">
                <img src={logo} alt="CLOSH" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </header>
      )}

      <AnimatePresence>
        {sidebarOpen && (
          <div className="contents">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100]"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl z-[110] overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center overflow-hidden border-2 border-indigo-100/50 shadow-sm">
                    {deliveryBoy?.avatar ? (
                      <img src={deliveryBoy.avatar} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <MdMotorcycle className="text-white w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">{deliveryBoy?.name || "Partner"}</h2>
                    <p className="text-xs text-gray-600 truncate max-w-[140px]">{deliveryBoy?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(deliveryBoy?.status)}`}></div>
                  <span className="text-xs text-gray-600 capitalize font-bold">{deliveryBoy?.status || "offline"}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                  <div className="p-2 bg-orange-50 rounded-xl border border-orange-100/50">
                    <p className="text-[9px] font-black text-orange-500 uppercase tracking-tighter">In Hand</p>
                    <p className="text-[13px] font-black text-orange-700">{formatPrice(deliveryBoy?.cashInHand || 0)}</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-xl border border-green-100/50">
                    <p className="text-[9px] font-black text-green-500 uppercase tracking-tighter">Collected</p>
                    <p className="text-[13px] font-black text-green-700">{formatPrice(deliveryBoy?.totalCashCollected || 0)}</p>
                  </div>
                </div>
              </div>

              <nav className="p-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-colors ${isActive ? "bg-primary-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"}`}>
                      <Icon className="text-xl" />
                      <span className="font-medium">{item.label}</span>
                      {item.path === "/delivery/notifications" && unreadCount > 0 && (
                        <span className="ml-auto min-w-[20px] px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold text-center">{unreadCount}</span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="p-2 border-t border-gray-200 mt-auto">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors">
                  <FiLogOut className="text-xl" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main id="delivery-scroll-container" className="flex-1 overflow-y-auto pb-20 scrollbar-responsive">
        <Outlet context={{ startBuzzer, stopBuzzer, isLoaded }} />
      </main>

      <NewTaskAlert onTaskAccepted={(orderId) => {
        if (location.pathname.includes('dashboard') || location.pathname.includes('orders')) {
           navigate('/delivery/orders');
        }
      }} />

      <DeliveryBottomNav />

      {/* Global Notifications Layer */}
      <AnimatePresence>
        {isBuzzerActive && (
          <motion.div
            initial={{ y: 100, x: 0, opacity: 0 }}
            animate={{ y: 0, x: 0, opacity: 1 }}
            exit={{ y: 100, x: 0, opacity: 0 }}
            className="fixed bottom-24 right-6 z-[1000] flex flex-col gap-2 pointer-events-none"
          >
            <button
              onClick={stopBuzzer}
              className="bg-red-500 text-white p-4 rounded-2xl shadow-2xl animate-bounce flex items-center gap-2 font-black uppercase text-xs tracking-widest border-2 border-white pointer-events-auto"
            >
              <FiAlertCircle className="animate-pulse" /> 🛑 Stop Alarm
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeliveryLayout;
