import React, { useState } from 'react';
import { Search, Bell, ShoppingBag, X, User, MapPin, ChevronDown, Check, Loader2, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCartStore from '../../../store/cartStore';
import useLocationStore from '../../../store/locationStore';
import { motion, AnimatePresence } from 'framer-motion';

import silaiwalaLogo from '/sewzella_logo.jpeg';

import { useNotifications } from '../context/NotificationContext';

const HomeHeader = ({ user }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const cartCount = useCartStore(state => state.getTotalItems());
    const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

    const { address: location, setLocation } = useLocationStore();
    const [isEditing, setIsEditing] = useState(false);
    const [tempLocation, setTempLocation] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = () => {
        if (tempLocation.trim()) {
            const mockLat = 34.0837 + (Math.random() - 0.5) * 0.01;
            const mockLng = 74.7973 + (Math.random() - 0.5) * 0.01;
            setLocation(tempLocation, mockLat, mockLng);
            setIsEditing(false);
        }
    };

    const handleDetectLocation = () => {
        setIsLoading(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Real Reverse Geocoding using Nominatim (OpenStreetMap)
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
                    const data = await res.json();
                    
                    if (data && data.address) {
                        const addr = data.address;
                        // Build a concise address: Suburb/City, State - Postcode
                        const area = addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || addr.town || addr.city || "";
                        const city = addr.city || addr.town || addr.village || addr.county || "";
                        const postcode = addr.postcode || "";
                        
                        const displayAddress = `${area}${area && city ? ', ' : ''}${city}${postcode ? ' - ' + postcode : ''}` || data.display_name.split(',').slice(0, 2).join(',');
                        
                        setLocation(displayAddress, latitude, longitude);
                    } else {
                        throw new Error("No address found");
                    }
                } catch (error) {
                    console.error("Reverse geocoding failed:", error);
                    // Fallback to coordinates if API fails
                    setLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`, latitude, longitude);
                } finally {
                    setIsLoading(false);
                    setIsEditing(false);
                }
            }, (error) => {
                alert("Location access denied. Please enable location permissions.");
                setIsLoading(false);
            }, { enableHighAccuracy: true });
        } else {
            alert("Geolocation is not supported by your browser.");
            setIsLoading(false);
        }
    };

    return (
        <div className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-gray-100/50 pt-2 transition-all duration-300 md:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3 pt-safe">
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
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[#2D2F6E] shrink-0 border border-gray-100 shadow-sm">
                                        <MapPin size={14} className="group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter leading-none mb-0.5">Delivering To</p>
                                        <div className="flex items-center gap-1 overflow-hidden">
                                            <span className="text-[11px] font-black text-gray-900 truncate tracking-tight">{location}</span>
                                            <ChevronDown size={10} className="text-[#2D2F6E] opacity-50" />
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#2D2F6E] animate-pulse"></div>
                                        <span className="text-[9px] font-black text-[#2D2F6E] uppercase tracking-widest opacity-70">Riders Online</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 sm:p-2.5 bg-gray-50 rounded-xl sm:rounded-2xl text-gray-400 border border-gray-100 hover:bg-white hover:text-[#2D2F6E] transition-all active:scale-90"
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white animate-pulse shadow-sm"></span>
                            )}
                        </button>

                        <Link
                            to="/cart"
                            className="p-2 sm:p-2.5 bg-gray-50 rounded-xl sm:rounded-2xl text-gray-400 border border-gray-100 hover:bg-white hover:text-[#2D2F6E] transition-all active:scale-90 relative"
                        >
                            <ShoppingBag size={18} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#2D2F6E] text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-md">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <Link to="/profile" className="ml-0.5 active:scale-90 transition-transform">
                            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-[1rem] sm:rounded-[1.25rem] border-2 border-[#2D2F6E]/10 p-0.5 overflow-hidden shadow-sm">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
                                    className="w-full h-full object-cover bg-gray-100 rounded-[0.8rem] sm:rounded-[1rem]"
                                    alt="User"
                                />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Search Bar - Modernized */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-[#2D2F6E] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search tailors, fabrics, designs..."
                        className="w-full bg-gray-100 border border-transparent rounded-[1rem] sm:rounded-[1.25rem] py-2 sm:py-3 pl-10 pr-4 text-[13px] font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2D2F6E]/5 focus:border-[#2D2F6E]/20 transition-all placeholder:text-gray-400 shadow-inner"
                    />
                </div>
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
