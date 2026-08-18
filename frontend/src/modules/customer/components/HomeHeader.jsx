import React, { useState, useEffect } from 'react';
import { Search, Bell, ShoppingCart, X, MapPin, ChevronDown, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../../../store/cartStore';
import useAuthStore from '../../../store/authStore';
import useUserStore from '../../../store/userStore';
import LocationModal from './LocationModal';
import useCheckoutStore from '../../../store/checkoutStore';
import useLocationStore from '../../../store/locationStore';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSearchBar from './AnimatedSearchBar';
import { useNotifications } from '../context/NotificationContext';
import toast from 'react-hot-toast';

const HomeHeader = ({ user }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const { items: productCartItems } = useCartStore(state => state);
    const { serviceItems } = useCheckoutStore(state => state);
    const cartCount = (productCartItems || []).length + (serviceItems || []).length;
    const { notifications = [], unreadCount, markAsRead } = useNotifications();
    const navigate = useNavigate();

    const [showLocationModal, setShowLocationModal] = useState(false);
    const { address: location } = useLocationStore();

    useEffect(() => {
        if (showNotifications || showLocationModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => document.body.style.overflow = 'unset';
    }, [showNotifications, showLocationModal]);

    return (
        <>
            <div className="bg-[#843D9B] pt-4 md:pt-6 pb-12 px-4 md:px-6 relative z-20 w-full overflow-hidden">
                {/* Top Row: Location & Icons */}
                <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0 pr-4" onClick={() => setShowLocationModal(true)}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 border border-white">
                            <MapPin size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-white/80 font-medium leading-none mb-1">Delivering to</p>
                            <div className="flex items-center gap-1">
                                <span className="text-xs sm:text-sm font-bold text-white truncate">{location || 'Select Location'}</span>
                                <ChevronDown size={14} className="text-white shrink-0" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="w-10 h-10 bg-white/10 rounded-xl text-white border border-white/20 flex items-center justify-center relative active:scale-95 transition-transform"
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border border-[#843D9B]"></span>
                            )}
                        </button>

                        <Link
                            to={(serviceItems || []).length > 0 && (productCartItems || []).length === 0 ? "/user/checkout/summary" : "/user/cart"}
                            onClick={() => useCheckoutStore.getState().setBuyNowMode(false)}
                            className="w-10 h-10 bg-white/10 rounded-xl text-white border border-white/20 flex items-center justify-center relative active:scale-95 transition-transform"
                        >
                            <ShoppingCart size={18} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-white text-[#843D9B] text-[9px] font-bold flex items-center justify-center rounded-full shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Search Bar Row */}
                <div className="bg-white rounded-[1.25rem] flex items-center shadow-sm relative overflow-hidden pl-1 pr-1.5 h-[46px] sm:h-[50px]">
                    <div className="flex-1 h-full">
                        <AnimatedSearchBar className="h-full bg-transparent shadow-none border-none text-sm w-full" hideBackground={true} />
                    </div>
                    <div className="w-px h-6 bg-gray-200 mx-1 shrink-0" />
                    <button className="h-full px-3 flex items-center gap-1.5 text-gray-700 font-bold text-[10px] sm:text-xs shrink-0 active:scale-95 transition-transform bg-transparent">
                        <Filter size={14} className="text-gray-900" /> Filters
                    </button>
                </div>
            </div>

            {/* Notification Dropdown Portal */}
            <AnimatePresence>
                {showNotifications && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNotifications(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110]"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute top-20 right-4 w-[calc(100vw-2rem)] max-w-sm mx-auto bg-white rounded-3xl shadow-2xl p-5 z-[120] overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                                <button
                                    onClick={() => setShowNotifications(false)}
                                    className="p-1.5 bg-gray-50 rounded-full text-gray-400"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-72 overflow-y-auto">
                                {(notifications || []).length > 0 ? (notifications || []).map(n => (
                                    <div
                                        key={n._id}
                                        onClick={() => markAsRead(n._id)}
                                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${!n.isRead ? 'bg-purple-50/50 border-purple-100' : 'bg-white border-gray-100'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-gray-900 leading-tight">{n.title}</span>
                                            <span className="text-[9px] font-bold text-gray-400">
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium leading-snug">{n.message}</p>
                                    </div>
                                )) : (
                                    <div className="py-8 text-center">
                                        <Bell size={32} className="mx-auto text-gray-200 mb-2" />
                                        <p className="text-xs font-bold text-gray-400">No new notifications</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <LocationModal 
                isOpen={showLocationModal} 
                onClose={() => setShowLocationModal(false)} 
            />
        </>
    );
};

export default HomeHeader;
