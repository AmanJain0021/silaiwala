// Port of modules/delivery/layouts/DeliveryLayout.jsx (converted with scripts/web2rn.js, then reviewed)
import { Linking } from 'react-native';
import { GOOGLE_MAPS_API_KEY } from '../../lib/config';
import React, { useState } from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '../common/Screen';
import { Dialog, Drawer } from '../ui/Sheet';
import { OutletContext } from '../../lib/nav';
import {   useLocation, useNavigate } from '../../lib/nav';
import { LayoutDashboard, Truck, History, User, Bell, Power, MapPin, Navigation2, Wallet, ShieldAlert, Phone, X } from "lucide-react-native";
import NewTaskAlert from "./NewTaskAlert";
import { Box, Btn, Txt, I, Img, Scroll } from '../ui/primitives';
import deliveryService from "../../lib/deliveryService";
import toast from '../../lib/toast';
import { useDeliveryAuthStore } from "../../store/deliveryStore";
import useAuthStore from "../../store/authStore";
import api from "../../lib/api";
import { playNotificationSound } from "../../utils/audio";
import useUnifiedLocation from "../../shared/hooks/useUnifiedLocation";
import useSocketStore from "../../store/socketStore";
import useBrandingStore from "../../store/brandingStore";
const DeliveryLayout = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [isOnline, setIsOnline] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [platformSettings, setPlatformSettings] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    appName
  } = useBrandingStore();
  React.useEffect(() => {
    const fetchProfileStatus = async () => {
      try {
        const res = await deliveryService.getProfile();
        if (res.success && res.data) {
          const online = typeof res.data.isAvailable === 'boolean' ? res.data.isAvailable : res.data.status === 'active' || res.data.status === 'available';
          setIsOnline(Boolean(online));
          try {
            const store = useDeliveryAuthStore.getState();
            if (store.deliveryBoy) {
              store.deliveryBoy.isAvailable = Boolean(online);
              store.deliveryBoy.status = online ? 'available' : 'offline';
            }
          } catch (_) {}
        }
      } catch (error) {
        import('axios').then(({
          default: axios
        }) => {
          if (!axios.isCancel(error)) {
            console.error('Failed to fetch profile status:', error);
          }
        });
      }
    };
    const fetchPlatformSettings = async () => {
      try {
        // Public endpoint to get basic settings
        const res = await api.get('/cms/settings');
        if (res.data?.success) {
          setPlatformSettings(res.data.data);
        }
      } catch (error) {
        import('axios').then(({
          default: axios
        }) => {
          if (!axios.isCancel(error)) {
            console.error('Failed to fetch platform settings:', error);
          }
        });
      }
    };
    fetchProfileStatus();
    fetchPlatformSettings();
  }, []);
  const toggleAvailability = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    try {
      await deliveryService.updateStatus({
        isAvailable: newStatus,
        status: newStatus ? 'active' : 'inactive'
      });
      try {
        const store = useDeliveryAuthStore.getState();
        if (store.deliveryBoy) {
          store.deliveryBoy.isAvailable = newStatus;
          store.deliveryBoy.status = newStatus ? 'available' : 'offline';
        }
      } catch (_) {}
      toast.success(`You are now ${newStatus ? 'Online' : 'Offline'}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      setIsOnline(!newStatus);
      toast.error('Failed to update status');
    }
  };
  const {
    user
  } = useAuthStore();
  const {
    deliveryBoy
  } = useDeliveryAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const fetchNotifications = async () => {
    try {
      const res = await deliveryService.getNotifications();
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (error) {
      import('axios').then(({
        default: axios
      }) => {
        if (!axios.isCancel(error)) {
          console.error('Failed to fetch notifications:', error);
        }
      });
    }
  };
  const handleMarkAllRead = async () => {
    try {
      await deliveryService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({
        ...n,
        isRead: true
      })));
      setUnreadCount(0);
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };
  const handleMarkRead = async id => {
    try {
      await deliveryService.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? {
        ...n,
        isRead: true
      } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };
  const isLoaded = true;
  const loadError = null;
  const {
    socket
  } = useSocketStore();
  React.useEffect(() => {
    fetchNotifications();
    const handleNewNotification = data => {
      try {
        playNotificationSound('delivery');
      } catch (e) {
        console.error(e);
      }
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
      if (data?.message) {
        toast.success(data.message, {
          icon: '🔔'
        });
      }
    };
    const handleNewTask = data => {
      try {
        playNotificationSound('delivery');
      } catch (e) {
        console.error(e);
      }
      fetchNotifications();
    };
    if (socket) {
      socket.on('new_notification', handleNewNotification);
      socket.on('new_task', handleNewTask);
    }
    return () => {
      if (socket) {
        socket.off('new_notification', handleNewNotification);
        socket.off('new_task', handleNewTask);
      }
    };
  }, [socket]);
  const navItems = [{
    name: 'Home',
    icon: LayoutDashboard,
    path: '/delivery/dashboard'
  }, {
    name: 'Tasks',
    icon: Truck,
    path: '/delivery/tasks'
  }, {
    name: 'History',
    icon: History,
    path: '/delivery/history'
  }, {
    name: 'Wallet',
    icon: Wallet,
    path: '/delivery/wallet'
  }, {
    name: 'Profile',
    icon: User,
    path: '/delivery/profile'
  }];
  const [currentLocationStr, setCurrentLocationStr] = useState('Fetching Location...');
  const [headerLocationCoords, setHeaderLocationCoords] = useState(null);
  const {
    location: unifiedLocation,
    error: locationError,
    startTracking,
    stopTracking
  } = useUnifiedLocation({
    fetchAddress: true
  });
  const lastSyncedLocation = React.useRef({
    lat: null,
    lng: null
  });
  React.useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);
  React.useEffect(() => {
    if (unifiedLocation.lat && unifiedLocation.lng) {
      setHeaderLocationCoords({
        lat: unifiedLocation.lat,
        lng: unifiedLocation.lng
      });
      let displayAddress = unifiedLocation.address;
      if (!displayAddress) {
        if (unifiedLocation.isAddressLoading) {
          displayAddress = 'Resolving Address...';
        } else {
          displayAddress = `${unifiedLocation.lat.toFixed(4)}, ${unifiedLocation.lng.toFixed(4)}`;
        }
      }
      setCurrentLocationStr(displayAddress);

      // Sync to backend if we have a valid address or coordinates
      if (!unifiedLocation.isAddressLoading) {
        const isSignificantChange = !lastSyncedLocation.current.lat || Math.abs(lastSyncedLocation.current.lat - unifiedLocation.lat) > 0.0005 || Math.abs(lastSyncedLocation.current.lng - unifiedLocation.lng) > 0.0005;
        if (isSignificantChange) {
          lastSyncedLocation.current = {
            lat: unifiedLocation.lat,
            lng: unifiedLocation.lng
          };
          const syncAddress = unifiedLocation.address || `${unifiedLocation.lat.toFixed(4)}, ${unifiedLocation.lng.toFixed(4)}`;
          deliveryService.updateStatus({
            address: syncAddress,
            lat: unifiedLocation.lat,
            lng: unifiedLocation.lng
          }).catch(err => console.warn("Failed to sync delivery address:", err));
        }
      }
    } else if (locationError) {
      setCurrentLocationStr('Location Unavailable');
    }
  }, [unifiedLocation.lat, unifiedLocation.lng, unifiedLocation.address, unifiedLocation.isAddressLoading, locationError]);
  const [pullState, setPullState] = useState({
    startY: 0,
    currentY: 0,
    isPulling: false
  });
  return <Screen className="bg-[#FAFAFB]" bottom={false}><Box className="flex-1 bg-[#FAFAFB] flex flex-col font-sans">
            {/* New Task Rapido-Style Alert */}
            <NewTaskAlert onTaskAccepted={orderId => {
      // Refresh data if we are on dashboard or tasks page
      if (location.pathname.includes('dashboard') || location.pathname.includes('tasks')) {
        // We could trigger a global refresh event here or just navigate to tasks
        navigate('/delivery/tasks');
      }
    }} />

            {/* Notifications Overlay */}
            <Drawer visible={showNotifications} onClose={() => setShowNotifications(false)} side="right" className="bg-white w-[85%] max-w-sm" backdropClassName="bg-slate-900/40">
                        <Box className="flex-1 bg-white flex flex-col">
                            <Box className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <Txt className="text-xl font-black text-slate-900 tracking-tight">Notifications</Txt>
                                <Btn onPress={() => setShowNotifications(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                                    <I icon={Bell} size={20} className="scale-x-[-1]" />
                                </Btn>
                            </Box>

                            <Scroll contentClassName="p-4 space-y-3" className="flex-1" nestedScrollEnabled>
                                {notifications.length === 0 ? <Box className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 opacity-40">
                                        <I icon={Bell} size={40} />
                                        <Txt className="text-sm font-bold uppercase tracking-widest">No Alerts</Txt>
                                    </Box> : notifications.map(n => <Btn key={n._id} onPress={() => !n.isRead && handleMarkRead(n._id)} className={`block ${`p-4 rounded-2xl border transition-all cursor-pointer ${!n.isRead ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-100'}`}`}>
                                            <Box className="flex justify-between items-start mb-1">
                                                <Txt className={`text-sm font-black ${!n.isRead ? 'text-primary' : 'text-slate-700'}`}>{n.title}</Txt>
                                                <Txt className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {new Date(n.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                                                </Txt>
                                            </Box>
                                            <Txt className="text-xs text-slate-500 font-medium leading-relaxed">{n.message}</Txt>
                                        </Btn>)}
                            </Scroll>

                            <Box className="p-6 border-t border-slate-100">
                                <Btn onPress={handleMarkAllRead} className="w-full py-3.5 bg-primary text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 active:scale-95 transition-all">
                                    Mark All As Read
                                </Btn>
                            </Box>
                        </Box>
            </Drawer>
            

            {/* SOS Emergency Modal */}
            <Dialog visible={showSOS} onClose={() => setShowSOS(false)} className="w-[90%] max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden" backdropClassName="bg-slate-900/60">
                        <Box className="flex flex-col">
                            <Box className="bg-red-500 p-6 flex flex-col items-center justify-center text-white relative">
                                <Btn onPress={() => setShowSOS(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all">
                                    <I icon={X} size={16} />
                                </Btn>
                                <Box className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-red-500 mb-3 shadow-lg animate-pulse">
                                    <I icon={ShieldAlert} size={32} />
                                </Box>
                                <Txt className="text-xl font-black tracking-tight uppercase">Emergency SOS</Txt>
                                <Txt className="text-xs font-bold opacity-80 mt-1 text-center">Tap any number below to call immediately</Txt>
                            </Box>

                            <Box className="p-6 space-y-4 bg-slate-50">
                                {/* Personal Emergency Contact */}
                                {user?.emergencyContact && <Btn onPress={() => Linking.openURL(`tel:${user.emergencyContact}`)} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-red-200 hover:shadow-md transition-all group">
                                        <Box className="flex items-center gap-3">
                                            <Box className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                                <I icon={User} size={18} />
                                            </Box>
                                            <Box>
                                                <Txt className="text-xs font-bold text-slate-500 uppercase tracking-widest">Personal Contact</Txt>
                                                <Txt className="text-lg font-black text-slate-900 group-hover:text-red-500 transition-colors">{user.emergencyContact}</Txt>
                                            </Box>
                                        </Box>
                                        <Box className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                                            <I icon={Phone} size={14} />
                                        </Box>
                                    </Btn>}

                                {/* Admin Support SOS */}
                                {platformSettings?.general?.emergencyPhone && <Btn onPress={() => Linking.openURL(`tel:${platformSettings.general.emergencyPhone}`)} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-red-200 hover:shadow-md transition-all group">
                                        <Box className="flex items-center gap-3">
                                            <Box className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                                <I icon={ShieldAlert} size={18} />
                                            </Box>
                                            <Box>
                                                <Txt className="text-xs font-bold text-slate-500 uppercase tracking-widest">Platform Support</Txt>
                                                <Txt className="text-lg font-black text-slate-900 group-hover:text-red-500 transition-colors">{platformSettings.general.emergencyPhone}</Txt>
                                            </Box>
                                        </Box>
                                        <Box className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                                            <I icon={Phone} size={14} />
                                        </Box>
                                    </Btn>}

                                {/* National Emergency */}
                                <Btn onPress={() => Linking.openURL("tel:112")} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl shadow-sm border border-red-100 hover:border-red-300 hover:shadow-md transition-all group">
                                    <Box className="flex items-center gap-3">
                                        <Box className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-md">
                                            <I icon={ShieldAlert} size={18} />
                                        </Box>
                                        <Box>
                                            <Txt className="text-xs font-bold text-red-400 uppercase tracking-widest">National Emergency</Txt>
                                            <Txt className="text-lg font-black text-red-600 group-hover:text-red-700 transition-colors">112 / 100</Txt>
                                        </Box>
                                    </Box>
                                    <Box className="w-8 h-8 rounded-full bg-red-200 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                                        <I icon={Phone} size={14} />
                                    </Box>
                                </Btn>
                            </Box>
                        </Box>
            </Dialog>
            

            {/* Top Fixed Header - Elegant Mobile Profile Bar */}
            {!location.pathname.includes('/delivery/wallet') && <Box className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-3 sm:px-5 z-50 gap-2">
                <Box className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <Box className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 rounded-xl flex items-center justify-center shadow-inner overflow-hidden border border-indigo-100 shrink-0">
                        {user?.profileImage ? <Img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" /> : <Txt className="text-indigo-600 font-black text-lg">{user?.name?.charAt(0) || 'S'}</Txt>}
                    </Box>
                    <Box className="flex flex-col min-w-0">
                        <Txt className="font-black text-slate-900 text-xs sm:text-sm tracking-tight leading-none mb-1 truncate">{user?.name || `${appName} Partner`}</Txt>
                        <Box className="flex items-center gap-1 text-slate-500 min-w-0 w-full overflow-hidden">
                            <I icon={MapPin} size={10} className="text-indigo-400 shrink-0" />
                            <Txt className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate leading-none mt-[1px] inline-block w-full">{currentLocationStr}</Txt>
                        </Box>
                    </Box>
                </Box>

                <Box className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                    {/* Status Pill Toggle */}
                    <Btn onPress={toggleAvailability} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 shrink-0 cursor-pointer active:scale-95 shadow-sm select-none ${isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-50' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                        <Txt className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        <Txt className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider leading-none">
                            {isOnline ? 'Online' : 'Offline'}
                        </Txt>
                        <I icon={Power} size={11} strokeWidth={2.5} className={isOnline ? 'text-emerald-600' : 'text-slate-400'} />
                    </Btn>

                    {/* SOS Emergency Button */}
                    <Btn onPress={() => setShowSOS(true)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm border border-red-100 shrink-0">
                        <I icon={ShieldAlert} size={16} className={showSOS ? 'animate-pulse' : ''} />
                    </Btn>

                    <Btn onPress={() => setShowNotifications(true)} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all relative shrink-0 ${showNotifications ? 'bg-primary text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                        <I icon={Bell} size={16} className={showNotifications ? 'animate-bounce' : ''} />
                        {unreadCount > 0 && <Txt className="absolute top-0 right-0 sm:top-0.5 sm:right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-500 text-white text-[7px] sm:text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-rose-50">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Txt>}
                    </Btn>
                </Box>
            </Box>}

            {/* Main Dynamic Viewport: the tab navigator (each tab scrolls itself) */}
            <Box className="flex-1">
                <OutletContext.Provider value={{
            isOnline,
            setIsOnline,
            toggleAvailability,
            isLoaded,
            layoutLocationStr: currentLocationStr,
            layoutLocationCoords: headerLocationCoords
          }}>
                    {children}
                </OutletContext.Provider>
            </Box>

            {/* Bottom Mobile Navigation */}
            <Box className="bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex items-center justify-around px-1 border-t border-slate-100" style={{ height: 64 + insets.bottom, paddingBottom: insets.bottom, elevation: 12 }}>
                {navItems.map(item => {
        const isActive = location.pathname === item.path || item.path !== '/delivery/dashboard' && location.pathname.startsWith(item.path);
        const Icon = item.icon;
        return <Btn key={item.path} onPress={() => navigate(item.path)} className="flex flex-col items-center justify-center flex-1 h-full py-1 min-w-[50px] relative group">
                            <Box className={`p-1.5 rounded-xl transition-all duration-200 flex items-center justify-center ${isActive ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105' : 'text-slate-400 group-hover:text-slate-600 active:scale-95'}`}>
                                <I icon={Icon} size={18} strokeWidth={isActive ? 2.5 : 2} />
                            </Box>
                            <Txt className={`text-[10px] tracking-tight mt-0.5 transition-colors whitespace-nowrap ${isActive ? 'text-primary font-bold' : 'text-slate-400 font-medium'}`}>
                                {item.name}
                            </Txt>
                        </Btn>;
      })}
            </Box>
        </Box></Screen>;
};
export default DeliveryLayout;
