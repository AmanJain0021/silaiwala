import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Truck,
    History,
    User,
    Bell,
    Power,
    MapPin,
    Navigation2,
    Wallet,
    ShieldAlert,
    Phone,
    X
} from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import NewTaskAlert from '../components/NewTaskAlert';

const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry', 'drawing'];
import deliveryService from '../services/deliveryService';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';
import useAuthStore from '../../../store/authStore';

import api from '../../../utils/api';

const silaiwalaLogo = '/logo.png';

const DeliveryLayout = () => {
    const [isOnline, setIsOnline] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSOS, setShowSOS] = useState(false);
    const [platformSettings, setPlatformSettings] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchProfileStatus = async () => {
            try {
                const res = await deliveryService.getProfile();
                if (res.success) {
                    setIsOnline(res.data.isAvailable);
                }
            } catch (error) {
                console.error('Failed to fetch profile status:', error);
            }
        };
        const fetchPlatformSettings = async () => {
            try {
                // Public endpoint to get basic settings
                const res = await api.get('/content/settings');
                if (res.data?.success) {
                    setPlatformSettings(res.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch platform settings:', error);
            }
        };
        fetchProfileStatus();
        fetchPlatformSettings();
    }, []);

    const toggleAvailability = async () => {
        const newStatus = !isOnline;
        setIsOnline(newStatus);
        try {
            await deliveryService.updateStatus({ isAvailable: newStatus });
            toast.success(`You are now ${newStatus ? 'Online' : 'Offline'}`);
        } catch (error) {
            console.error('Failed to update status:', error);
            setIsOnline(!newStatus);
            toast.error('Failed to update status');
        }
    };

    const { user } = useAuthStore();
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
            console.error('Failed to fetch notifications:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await deliveryService.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await deliveryService.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark read:', error);
        }
    };

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: GOOGLE_MAPS_LIBRARIES
    });

    React.useEffect(() => {
        fetchNotifications();

        const socket = io(SOCKET_URL);
        
        socket.emit('join', 'delivery_partners');
        if (user?._id) {
            socket.emit('join', `user_${user._id}`);
        }

        socket.on('new_notification', (data) => {
            setNotifications(prev => [data, ...prev]);
            setUnreadCount(prev => prev + 1);
            toast(data.message, { icon: '🔔' });
        });

        socket.on('new_task', (data) => {
            // NewTaskAlert handles the UI, but we can also refresh notifications
            fetchNotifications();
        });

        return () => {
            socket.disconnect();
        };
    }, [user?._id]);

    const navItems = [
        { name: 'Home', icon: LayoutDashboard, path: '/delivery/dashboard' },
        { name: 'Tasks', icon: Truck, path: '/delivery/tasks' },
        { name: 'History', icon: History, path: '/delivery/history' },
        { name: 'Wallet', icon: Wallet, path: '/delivery/wallet' },
        { name: 'Profile', icon: User, path: '/delivery/profile' },
    ];

    return (
        <div className="min-h-[100dvh] bg-[#FAFAFB] flex flex-col font-sans selection:bg-indigo-100 selection:text-primary overflow-x-clip">
            {/* New Task Rapido-Style Alert */}
            <NewTaskAlert onTaskAccepted={(orderId) => {
                // Refresh data if we are on dashboard or tasks page
                if (location.pathname.includes('dashboard') || location.pathname.includes('tasks')) {
                    // We could trigger a global refresh event here or just navigate to tasks
                   navigate('/delivery/tasks');
                }
            }} />

            {/* Notifications Overlay */}
            <AnimatePresence>
                {showNotifications && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNotifications(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-[70] shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h2>
                                <button
                                    onClick={() => setShowNotifications(false)}
                                    className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                >
                                    <Bell size={20} className="scale-x-[-1]" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {notifications.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 opacity-40">
                                        <Bell size={40} />
                                        <p className="text-sm font-bold uppercase tracking-widest">No Alerts</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div 
                                            key={n._id} 
                                            onClick={() => !n.isRead && handleMarkRead(n._id)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${!n.isRead ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-100'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className={`text-sm font-black ${!n.isRead ? 'text-primary' : 'text-slate-700'}`}>{n.title}</h3>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{n.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-6 border-t border-slate-100">
                                <button 
                                    onClick={handleMarkAllRead}
                                    className="w-full py-3.5 bg-primary text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                                >
                                    Mark All As Read
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* SOS Emergency Modal */}
            <AnimatePresence>
                {showSOS && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSOS(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[80]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-[2rem] z-[90] shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="bg-red-500 p-6 flex flex-col items-center justify-center text-white relative">
                                <button
                                    onClick={() => setShowSOS(false)}
                                    className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
                                >
                                    <X size={16} />
                                </button>
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-red-500 mb-3 shadow-lg animate-pulse">
                                    <ShieldAlert size={32} />
                                </div>
                                <h2 className="text-xl font-black tracking-tight uppercase">Emergency SOS</h2>
                                <p className="text-xs font-bold opacity-80 mt-1 text-center">Tap any number below to call immediately</p>
                            </div>

                            <div className="p-6 space-y-4 bg-slate-50">
                                {/* Personal Emergency Contact */}
                                {user?.emergencyContact && (
                                    <a href={`tel:${user.emergencyContact}`} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-red-200 hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Personal Contact</p>
                                                <p className="text-lg font-black text-slate-900 group-hover:text-red-500 transition-colors">{user.emergencyContact}</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                                            <Phone size={14} />
                                        </div>
                                    </a>
                                )}

                                {/* Admin Support SOS */}
                                {platformSettings?.general?.emergencyPhone && (
                                    <a href={`tel:${platformSettings.general.emergencyPhone}`} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-red-200 hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                                <ShieldAlert size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Platform Support</p>
                                                <p className="text-lg font-black text-slate-900 group-hover:text-red-500 transition-colors">{platformSettings.general.emergencyPhone}</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                                            <Phone size={14} />
                                        </div>
                                    </a>
                                )}

                                {/* National Emergency */}
                                <a href="tel:112" className="flex items-center justify-between p-4 bg-red-50 rounded-2xl shadow-sm border border-red-100 hover:border-red-300 hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-md">
                                            <ShieldAlert size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest">National Emergency</p>
                                            <p className="text-lg font-black text-red-600 group-hover:text-red-700 transition-colors">112 / 100</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-red-200 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                                        <Phone size={14} />
                                    </div>
                                </a>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Top Fixed Header - Elegant Mobile Profile Bar */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-200/50 overflow-hidden border border-gray-100">
                        <img src={silaiwalaLogo} alt="Silaiwala" className="w-full h-full object-contain p-1.5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-lg tracking-tighter leading-none">Silaiwala</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Partner Hub</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* SOS Emergency Button */}
                    <button
                        onClick={() => setShowSOS(true)}
                        className="w-11 h-11 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm border border-red-100"
                    >
                        <ShieldAlert size={20} className={showSOS ? 'animate-pulse' : ''} />
                    </button>

                    {/* Status Pill Toggle */}
                    <button
                        onClick={toggleAvailability}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-300 ${isOnline
                            ? 'bg-indigo-50 border-indigo-100 text-primary'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                    >
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                        <Power size={11} strokeWidth={3} className={isOnline ? 'text-primary' : 'text-slate-300'} />
                    </button>

                    <button
                        onClick={() => setShowNotifications(true)}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative ${showNotifications ? 'bg-primary text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                        <Bell size={20} className={showNotifications ? 'animate-bounce' : ''} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-rose-50">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Dynamic Viewport */}
            <main className="flex-1 pb-24 md:pb-12 pt-[104px] px-4 md:px-10 max-w-lg mx-auto w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <Outlet context={{ isOnline, setIsOnline, isLoaded }} />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Mobile Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 h-[80px] bg-black backdrop-blur-xl rounded-t-[1.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] flex items-center justify-around px-2 z-50 border-t border-white/5 md:max-w-md md:mx-auto pb-safe">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="relative group flex flex-col items-center justify-center w-16 h-full"
                        >
                            <div className={`p-3 rounded-[1.2rem] transition-all duration-300 ${isActive
                                ? 'bg-primary text-white shadow-xl shadow-primary/20 mb-3'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}>
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            {isActive && (
                                <motion.span
                                    layoutId="navLabel"
                                    className="absolute bottom-2.5 text-[9px] font-black text-primary uppercase tracking-widest"
                                >
                                    {item.name}
                                </motion.span>
                            )}
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
};

export default DeliveryLayout;

