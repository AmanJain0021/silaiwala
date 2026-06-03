import React, { useState } from 'react';
import { Search, Bell, ShoppingBag, X, User, MapPin, ChevronDown, Check, Loader2, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCartStore from '../../../store/cartStore';
import useCheckoutStore from '../../../store/checkoutStore';
import useLocationStore from '../../../store/locationStore';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSearchBar from './AnimatedSearchBar';
import { useGoogleLocation } from '../../../hooks/useGoogleLocation';

import silaiwalaLogo from '/sewzella_logo.jpeg';

import { useNotifications } from '../context/NotificationContext';

const HomeHeader = ({ user }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const { items: productCartItems } = useCartStore(state => state);
    const { serviceItems } = useCheckoutStore(state => state);
    const cartCount = productCartItems.length + serviceItems.length;
    const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

    const { address: location, setLocation } = useLocationStore();
    const [isEditing, setIsEditing] = useState(false);
    const [tempLocation, setTempLocation] = useState('');
    const { detectLocation, isLocating: isLoading } = useGoogleLocation();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };
    const userName = user?.name ? user.name.split(' ')[0] : 'Guest';

    const handleSave = () => {
        if (tempLocation.trim()) {
            const mockLat = 34.0837 + (Math.random() - 0.5) * 0.01;
            const mockLng = 74.7973 + (Math.random() - 0.5) * 0.01;
            setLocation(tempLocation, mockLat, mockLng);
            setIsEditing(false);
        }
    };

    const handleDetectLocation = async () => {
        try {
            const data = await detectLocation();
            if (data) {
                setLocation(data.address, data.latitude, data.longitude);
            }
        } catch (error) {
            console.error(error);
            alert(error.message || "Failed to detect location.");
        } finally {
            setIsEditing(false);
        }
    };

    return (
        <div className="sticky top-0 z-[100] bg-gradient-to-b from-[#1E2050] to-[#2D2F6E] rounded-b-[2rem] shadow-xl pt-2 pb-6 transition-all duration-300 md:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3 pt-safe">
                {/* Greeting */}
                <div className="mb-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                        {getGreeting()}, <span className="text-indigo-200 capitalize">{userName}</span> <span className="origin-bottom-right animate-bounce">👋</span>
                    </h2>
                </div>

                {/* Top Row: Brand & Icons */}
                <div className="flex justify-between items-center mb-2 sm:mb-4">
                    <div className="flex-1 min-w-0 mr-4">
                        <AnimatePresence mode="wait">
                            {isEditing ? (
                                <motion.div
                                    key="editing"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="flex items-center gap-2 w-full"
                                >
                                    <div className="flex-1 relative flex items-center">
                                        <Search className="absolute left-2.5 h-3 w-3 text-gray-400" />
                                        <input
                                            type="text"
                                            value={tempLocation}
                                            onChange={(e) => setTempLocation(e.target.value)}
                                            placeholder="Enter area..."
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-1.5 pl-7 pr-2 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-[#2D2F6E]/10 transition-all shadow-sm"
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        onClick={handleDetectLocation}
                                        className="p-1.5 bg-[#2D2F6E]/5 text-[#2D2F6E] rounded-lg"
                                    >
                                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="p-1.5 bg-[#2D2F6E] text-white rounded-lg shadow-md"
                                    >
                                        <Check size={12} />
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="viewing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2 cursor-pointer group"
                                    onClick={() => {
                                        setTempLocation(location);
                                        setIsEditing(true);
                                    }}
                                >
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/20 shadow-sm backdrop-blur-sm">
                                        <MapPin size={14} className="group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] text-white/70 font-bold uppercase tracking-tighter leading-none mb-0.5">Delivering To</p>
                                        <div className="flex items-center gap-1 overflow-hidden">
                                            <span className="text-[11px] font-black text-white truncate tracking-tight">{location}</span>
                                            <ChevronDown size={10} className="text-white/70" />
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
                                        <span className="text-[9px] font-black text-white/90 uppercase tracking-widest">Riders Online</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 sm:p-2.5 bg-white/10 rounded-xl sm:rounded-2xl text-white border border-white/20 hover:bg-white/20 transition-all active:scale-90 backdrop-blur-sm shadow-sm"
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-[#2D2F6E] animate-pulse shadow-sm"></span>
                            )}
                        </button>

                        <Link
                            to={serviceItems.length > 0 && productCartItems.length === 0 ? "/user/checkout/summary" : "/user/cart"}
                            onClick={() => useCheckoutStore.getState().setBuyNowMode(false)}
                            className="p-2 sm:p-2.5 bg-white/10 rounded-xl sm:rounded-2xl text-white border border-white/20 hover:bg-white/20 transition-all active:scale-90 relative backdrop-blur-sm shadow-sm"
                        >
                            <ShoppingBag size={18} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-white text-[#2D2F6E] text-[8px] font-black flex items-center justify-center rounded-full border-2 border-[#2D2F6E] shadow-md">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <Link to="/user/profile" className="ml-0.5 active:scale-90 transition-transform">
                            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-[1rem] sm:rounded-[1.25rem] border-2 border-white/30 p-0.5 overflow-hidden shadow-sm bg-white/10 backdrop-blur-sm">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
                                    className="w-full h-full object-cover bg-white rounded-[0.8rem] sm:rounded-[1rem]"
                                    alt="User"
                                />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Search Bar - Modernized */}
                <AnimatedSearchBar />
            </div>

            {/* Notification Dropdown Portal-like */}
            <AnimatePresence>
                {showNotifications && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNotifications(false)}
                            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[110]"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute top-20 right-4 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-6 z-[120] overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Updates</h3>
                                <button
                                    onClick={() => setShowNotifications(false)}
                                    className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div
                                        key={n._id}
                                        onClick={() => markAsRead(n._id)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${!n.isRead ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'bg-white border-gray-100'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1.5">
                                            <span className="text-xs font-black text-gray-900 leading-none">{n.title}</span>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{n.message}</p>
                                    </div>
                                )) : (
                                    <div className="py-12 text-center">
                                        <Bell size={40} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-xs font-bold text-gray-400">All caught up!</p>
                                    </div>
                                )}
                            </div>

                            <button className="w-full mt-6 py-3 text-xs font-black text-[#2D2F6E] uppercase tracking-widest border border-[#2D2F6E]/10 rounded-2xl hover:bg-[#2D2F6E]/5 transition-all">
                                View Activity History
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HomeHeader;
